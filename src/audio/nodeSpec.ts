// Module catalogue derived from `module-registry.json`, which is generated at
// build time by the rust-dsp `web` crate (see `web/src/registry.rs`). The Rust
// `Kind`/`Params` definitions are the single source of truth: when a new module
// is added there and a new wasm release is built, the palette updates without
// any TS changes. Keep the exported symbols below stable — the rest of the UI
// imports from here.

import registry from "../../pkg/module-registry.json";

export interface ParamSpec {
  name: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
}

export interface NodeSpec {
  kind: number;
  label: string;
  color: string;
  inputs: string[];
  outputs: string[];
  params: ParamSpec[];
}

interface ModuleRegistry {
  order: number[];
  modules: Record<string, NodeSpec>;
}

const reg = registry as ModuleRegistry;

/** Numeric type used across the UI/wasm boundary for a module kind. */
export type KindCode = number;

/** Named kind codes, for the handful of places that reference a fixed module. */
export const Kind = {
  Osc: 0,
  Adsr: 1,
  Filter: 2,
  Distortion: 3,
  Vca: 4,
  Mixer: 5,
  Constant: 7,
  Out: 8,
  Midi: 9,
} as const;

/** Module specs keyed by kind code (fully registry-driven). */
export const NODE_SPECS: Record<number, NodeSpec> = Object.fromEntries(
  reg.order.map((k) => [k, reg.modules[String(k)]])
);

/** Palette (insertion) order as declared by the registry. */
export const PALETTE_ORDER: number[] = reg.order;
