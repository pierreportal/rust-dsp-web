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
