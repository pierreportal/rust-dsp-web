import type { ModuleNodeData } from "../nodes/ModuleNode";

export interface CanvasNode {
  id: string;
  position: { x: number; y: number };
  data: ModuleNodeData;
}

export interface CanvasEdge {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
}

export interface Connection {
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
}

export interface Transform {
  x: number;
  y: number;
  zoom: number;
}

export type InteractionMode = "idle" | "panning" | "dragging" | "connecting" | "select-edge";

export const NODE_W = 125;
export const TITLE_H = 28;
export const PORT_ROW_H = 22;
export const HANDLE_R = 5;

export function handleY(index: number): number {
  return (index + 0.5) * PORT_ROW_H + TITLE_H;
}

export function portIndex(handle?: string | null): number {
  if (!handle) return -1;
  const i = handle.indexOf("-");
  if (i < 0) return -1;
  const n = parseInt(handle.slice(i + 1), 10);
  return Number.isNaN(n) ? -1 : n;
}

export function portHandle(side: "in" | "out", index: number): string {
  return `${side}-${index}`;
}

export function edgeId(
  source: number,
  sourcePort: number,
  target: number,
  targetPort: number,
): string {
  return `e${source}-out-${sourcePort}-${target}-in-${targetPort}`;
}
