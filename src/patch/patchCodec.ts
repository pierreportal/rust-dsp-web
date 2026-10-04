// Client-side patch serialization. Turns the live canvas graph into a compact,
// URL-safe string and back again. No server involved: the whole graph travels
// inside the location hash.
//
// Wire format (v1) — JSON, base64url-encoded:
//   { "v": 1,
//     "n": [ [id, kind, x, y, {param: value, ...}], ... ],
//     "e": [ [source, sourcePort, target, targetPort], ... ] }
//
// Tuples rather than objects keep the hash short, and the shape is trivial to
// reimplement on the other side of the product (the Ableton Live plugin and the
// Daisy Seed firmware both need to read this format too).
//
// `decodePatch` treats its input as untrusted: a hash is hand-editable and can
// come from an older registry, so unknown module kinds, missing ports, dangling
// cables and feedback loops are repaired away (with warnings) instead of being
// pushed into the audio engine, which would either throw or silently ignore them.

import { NODE_SPECS, type KindCode, type ParamSpec } from "../audio/nodeSpec";
import { portIndex, type CanvasEdge, type CanvasNode } from "../canvas/types";

export const PATCH_VERSION = 1;

const MAX_NODES = 512;
const MAX_EDGES = 4096;
const MAX_NODE_ID = 65536;
const MAX_KIND = 256;
const MAX_POSITION = 100000;
const BASE64URL = /^[A-Za-z0-9_-]*$/;

type WireNode = [number, KindCode, number, number, Record<string, number>];
type WireEdge = [number, number, number, number];

interface WirePatch {
  v: number;
  n: WireNode[];
  e: WireEdge[];
}

export interface PatchNode {
  id: number;
  kind: KindCode;
  x: number;
  y: number;
  params: Record<string, number>;
}

export interface PatchEdge {
  source: number;
  sourcePort: number;
  target: number;
  targetPort: number;
}

export interface PatchData {
  nodes: PatchNode[];
  edges: PatchEdge[];
}

export interface DecodeResult {
  patch: PatchData;
  warnings: string[];
  error: string | null;
}

const emptyPatch = (): PatchData => ({ nodes: [], edges: [] });

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isFiniteNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

const isNodeId = (v: unknown): v is number =>
  isFiniteNumber(v) && Number.isInteger(v) && v >= 0 && v < MAX_NODE_ID;

const isKind = (v: unknown): v is KindCode =>
  isFiniteNumber(v) && Number.isInteger(v) && v >= 0 && v < MAX_KIND;

const isPortIndex = (v: unknown): v is number =>
  isFiniteNumber(v) && Number.isInteger(v) && v >= 0 && v < 256;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export function serializePatch(nodes: CanvasNode[], edges: CanvasEdge[]): PatchData {
  return {
    nodes: nodes.map((node) => ({
      id: Number(node.id),
      kind: node.data.kind,
      x: Math.round(node.position.x),
      y: Math.round(node.position.y),
      params: { ...node.data.params },
    })),
    edges: edges.map((edge) => ({
      source: Number(edge.source),
      sourcePort: Math.max(0, portIndex(edge.sourceHandle)),
      target: Number(edge.target),
      targetPort: Math.max(0, portIndex(edge.targetHandle)),
    })),
  };
}

export function encodePatch(patch: PatchData): string {
  const wire: WirePatch = {
    v: PATCH_VERSION,
    n: patch.nodes.map((node) => [
      node.id,
      node.kind,
      node.x,
      node.y,
      node.params,
    ]),
    e: patch.edges.map((edge) => [
      edge.source,
      edge.sourcePort,
      edge.target,
      edge.targetPort,
    ]),
  };
  return base64UrlEncode(JSON.stringify(wire));
}

export function decodePatch(code: string): DecodeResult {
  const warnings: string[] = [];
  const raw = code.trim();
  if (raw.length === 0) {
    return failed(warnings, "empty link");
  }
  if (!BASE64URL.test(raw)) {
    return failed(warnings, "malformed link");
  }

  let wire: unknown;
  try {
    wire = JSON.parse(decodeBase64UrlText(raw));
  } catch {
    return failed(warnings, "malformed link");
  }

  if (!isPlainObject(wire)) {
    return failed(warnings, "malformed link");
  }
  if (wire.v !== PATCH_VERSION) {
    return failed(warnings, `unsupported patch version ${String(wire.v)}`);
  }

  const nodes = parseNodes(wire.n, warnings);
  const edges = parseEdges(wire.e, nodes, warnings);
  return { patch: { nodes, edges }, warnings, error: null };
}

function failed(warnings: string[], error: string): DecodeResult {
  return { patch: emptyPatch(), warnings, error };
}

function parseNodes(input: unknown, warnings: string[]): PatchNode[] {
  if (!Array.isArray(input)) return [];

  const nodes: PatchNode[] = [];
  const seen = new Set<number>();

  for (const entry of input) {
    if (nodes.length >= MAX_NODES) {
      warnings.push(`kept the first ${MAX_NODES} modules`);
      break;
    }
    if (!Array.isArray(entry) || entry.length < 5) {
      warnings.push("skipped a malformed module");
      continue;
    }

    const [id, kind, x, y, params] = entry as unknown[];
    if (!isNodeId(id) || !isKind(kind) || !isFiniteNumber(x) || !isFiniteNumber(y)) {
      warnings.push("skipped a malformed module");
      continue;
    }
    if (seen.has(id)) {
      warnings.push(`skipped duplicate module id ${id}`);
      continue;
    }
    if (!NODE_SPECS[kind]) {
      warnings.push(`skipped unknown module kind ${kind} (id ${id})`);
      continue;
    }

    seen.add(id);
    nodes.push({
      id,
      kind,
      x: clamp(Math.round(x), -MAX_POSITION, MAX_POSITION),
      y: clamp(Math.round(y), -MAX_POSITION, MAX_POSITION),
      params: parseParams(kind, params, warnings),
    });
  }

  return nodes;
}

function parseParams(
  kind: KindCode,
  input: unknown,
  warnings: string[],
): Record<string, number> {
  const specs = NODE_SPECS[kind].params;
  const params: Record<string, number> = {};
  for (const spec of specs) params[spec.name] = spec.default;

  if (!isPlainObject(input)) return params;

  for (const [name, value] of Object.entries(input)) {
    const spec = specs.find((candidate: ParamSpec) => candidate.name === name);
    if (!spec) {
      warnings.push(`ignored unknown parameter "${name}" on module kind ${kind}`);
      continue;
    }
    if (!isFiniteNumber(value)) {
      warnings.push(`ignored non-numeric parameter "${name}" on module kind ${kind}`);
      continue;
    }
    params[name] = clamp(value, spec.min, spec.max);
  }

  return params;
}

function parseEdges(input: unknown, nodes: PatchNode[], warnings: string[]): PatchEdge[] {
  if (!Array.isArray(input)) return [];

  const byId = new Map(nodes.map((node) => [node.id, node]));
  const adjacency = new Map<number, number[]>();
  const edges: PatchEdge[] = [];
  const seen = new Set<string>();

  for (const entry of input) {
    if (edges.length >= MAX_EDGES) {
      warnings.push(`kept the first ${MAX_EDGES} cables`);
      break;
    }
    if (!Array.isArray(entry) || entry.length < 4) {
      warnings.push("skipped a malformed cable");
      continue;
    }

    const [source, sourcePort, target, targetPort] = entry as unknown[];
    if (
      !isNodeId(source) ||
      !isNodeId(target) ||
      !isPortIndex(sourcePort) ||
      !isPortIndex(targetPort)
    ) {
      warnings.push("skipped a malformed cable");
      continue;
    }

    const from = byId.get(source);
    const to = byId.get(target);
    if (!from || !to) {
      warnings.push(`skipped cable ${source}.${sourcePort} → ${target}.${targetPort}`);
      continue;
    }
    if (source === target) {
      warnings.push(`skipped self-loop on module ${source}`);
      continue;
    }
    if (
      sourcePort >= NODE_SPECS[from.kind].outputs.length ||
      targetPort >= NODE_SPECS[to.kind].inputs.length
    ) {
      warnings.push(`skipped cable ${source}.${sourcePort} → ${target}.${targetPort}`);
      continue;
    }

    const key = `${source}.${sourcePort}>${target}.${targetPort}`;
    if (seen.has(key)) {
      warnings.push(`skipped duplicate cable ${key}`);
      continue;
    }
    // The engine drops cables that would close a feedback loop, so drop them
    // here too: otherwise the canvas would draw a cable that makes no sound.
    if (reaches(adjacency, target, source)) {
      warnings.push(`skipped cable ${key}: it would create a feedback loop`);
      continue;
    }

    seen.add(key);
    adjacency.set(source, [...(adjacency.get(source) ?? []), target]);
    edges.push({ source, sourcePort, target, targetPort });
  }

  return edges;
}

function reaches(adjacency: Map<number, number[]>, from: number, goal: number): boolean {
  const stack = [from];
  const visited = new Set<number>([from]);
  while (stack.length > 0) {
    const current = stack.pop() as number;
    if (current === goal) return true;
    for (const next of adjacency.get(current) ?? []) {
      if (!visited.has(next)) {
        visited.add(next);
        stack.push(next);
      }
    }
  }
  return false;
}

function base64UrlEncode(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodeBase64UrlText(code: string): string {
  const base64 = code.replace(/-/g, "+").replace(/_/g, "/");
  const remainder = base64.length % 4;
  const padded = remainder === 0 ? base64 : base64 + "=".repeat(4 - remainder);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}