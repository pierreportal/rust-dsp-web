import { useCallback, useEffect, useRef, useState } from "react";
import {
  type CanvasNode,
  type CanvasEdge,
  type Connection,
  type Transform,
  type InteractionMode,
  NODE_W,
  TITLE_H,
  HANDLE_R,
  handleY,
} from "./types";
import { NODE_SPECS } from "../audio/nodeSpec";

interface UseCanvasInteractionOptions {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  onConnect: (conn: Connection) => void;
  onEdgesDelete: (edges: CanvasEdge[]) => void;
  onNodePositionChange: (id: string, x: number, y: number) => void;
}

export function useCanvasInteraction({
  nodes,
  edges,
  onConnect,
  onEdgesDelete,
  onNodePositionChange,
}: UseCanvasInteractionOptions) {
  const svgRef = useRef<SVGSVGElement>(null);

  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, zoom: 1 });
  const [mode, setMode] = useState<InteractionMode>("idle");
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [tempEdge, setTempEdge] = useState<{
    sx: number;
    sy: number;
    tx: number;
    ty: number;
  } | null>(null);

  const dragRef = useRef<{
    startMouseX: number;
    startMouseY: number;
    startNodeX: number;
    startNodeY: number;
    nodeId: string;
  } | null>(null);

  const connectRef = useRef<{
    sourceNodeId: string;
    sourceHandle: string;
    sx: number;
    sy: number;
  } | null>(null);

  const panRef = useRef<{
    startMouseX: number;
    startMouseY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);

  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  const onNodePositionChangeRef = useRef(onNodePositionChange);
  onNodePositionChangeRef.current = onNodePositionChange;

  const onEdgeClick = useCallback((edge: CanvasEdge) => {
    setSelectedEdgeId((cur) => (cur === edge.id ? null : edge.id));
  }, []);

  const findHandle = useCallback(
    (cx: number, cy: number): { nodeId: string; handleId: string } | null => {
      const ns = nodesRef.current;
      let best: { nodeId: string; handleId: string } | null = null;
      let bestDist = HANDLE_R + 4;

      for (const node of ns) {
        const spec = NODE_SPECS[node.data.kind];
        const nx = node.position.x;
        const ny = node.position.y;

        for (let i = 0; i < spec.inputs.length; i++) {
          const hx = nx;
          const hy = ny + handleY(i);
          const d = Math.hypot(cx - hx, cy - hy);
          if (d < bestDist) {
            bestDist = d;
            best = { nodeId: node.id, handleId: `in-${i}` };
          }
        }
        for (let i = 0; i < spec.outputs.length; i++) {
          const hx = nx + NODE_W;
          const hy = ny + handleY(i);
          const d = Math.hypot(cx - hx, cy - hy);
          if (d < bestDist) {
            bestDist = d;
            best = { nodeId: node.id, handleId: `out-${i}` };
          }
        }
      }
      return best;
    },
    []
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      const target = e.target as Element;
      if (target.closest && target.closest("[data-node]")) return;
      setSelectedEdgeId(null);
      const t = transform;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const cx = (e.clientX - rect.left - t.x) / t.zoom;
      const cy = (e.clientY - rect.top - t.y) / t.zoom;

      const handle = findHandle(cx, cy);
      if (handle) {
        const node = nodesRef.current.find((n) => n.id === handle.nodeId);
        if (!node) return;
        const isOutput = handle.handleId.startsWith("out-");
        const portIdx = parseInt(handle.handleId.split("-")[1], 10);
        const hx = node.position.x + (isOutput ? NODE_W : 0);
        const hy = node.position.y + handleY(portIdx);

        connectRef.current = {
          sourceNodeId: handle.nodeId,
          sourceHandle: handle.handleId,
          sx: hx,
          sy: hy,
        };
        setMode("connecting");
        setTempEdge({ sx: hx, sy: hy, tx: cx, ty: cy });
        svg.setPointerCapture(e.pointerId);
        return;
      }

      for (const node of nodesRef.current) {
        if (
          cx >= node.position.x &&
          cx <= node.position.x + NODE_W &&
          cy >= node.position.y &&
          cy <= node.position.y + TITLE_H
        ) {
          dragRef.current = {
            startMouseX: e.clientX,
            startMouseY: e.clientY,
            startNodeX: node.position.x,
            startNodeY: node.position.y,
            nodeId: node.id,
          };
          setMode("dragging");
          svg.setPointerCapture(e.pointerId);
          return;
        }
      }

      panRef.current = {
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startPanX: t.x,
        startPanY: t.y,
      };
      setMode("panning");
      svg.setPointerCapture(e.pointerId);
    },
    [transform, findHandle]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const svg = svgRef.current;
      if (!svg) return;

      if (mode === "panning" && panRef.current) {
        const dx = e.clientX - panRef.current.startMouseX;
        const dy = e.clientY - panRef.current.startMouseY;
        setTransform((prev) => ({
          ...prev,
          x: panRef.current!.startPanX + dx,
          y: panRef.current!.startPanY + dy,
        }));
        return;
      }

      if (mode === "dragging" && dragRef.current) {
        const t = transform;
        const dx = (e.clientX - dragRef.current.startMouseX) / t.zoom;
        const dy = (e.clientY - dragRef.current.startMouseY) / t.zoom;
        const id = dragRef.current.nodeId;
        const nx = dragRef.current.startNodeX + dx;
        const ny = dragRef.current.startNodeY + dy;
        onNodePositionChangeRef.current(id, nx, ny);
        return;
      }

      if (mode === "connecting") {
        const rect = svg.getBoundingClientRect();
        const t = transform;
        const cx = (e.clientX - rect.left - t.x) / t.zoom;
        const cy = (e.clientY - rect.top - t.y) / t.zoom;
        if (connectRef.current) {
          setTempEdge({
            sx: connectRef.current.sx,
            sy: connectRef.current.sy,
            tx: cx,
            ty: cy,
          });
        }
        return;
      }
    },
    [mode, transform]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      svg.releasePointerCapture(e.pointerId);

      if (mode === "connecting" && connectRef.current) {
        const t = transform;
        const rect = svg.getBoundingClientRect();
        const cx = (e.clientX - rect.left - t.x) / t.zoom;
        const cy = (e.clientY - rect.top - t.y) / t.zoom;
        const target = findHandle(cx, cy);

        if (target && target.nodeId !== connectRef.current.sourceNodeId) {
          const src = connectRef.current;
          const srcIsOutput = src.sourceHandle.startsWith("out-");
          let conn: Connection;
          if (srcIsOutput) {
            conn = {
              source: src.sourceNodeId,
              sourceHandle: src.sourceHandle,
              target: target.nodeId,
              targetHandle: target.handleId,
            };
          } else {
            conn = {
              source: target.nodeId,
              sourceHandle: target.handleId,
              target: src.sourceNodeId,
              targetHandle: src.sourceHandle,
            };
          }
          onConnect(conn);
        }
        setTempEdge(null);
      }

      if (mode === "dragging") {
        dragRef.current = null;
      }

      if (mode === "panning") {
        panRef.current = null;
      }

      setMode("idle");
    },
    [mode, transform, findHandle, onConnect]
  );

  const onWheel = useCallback((e: React.WheelEvent) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setTransform((prev) => {
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.min(Math.max(prev.zoom * factor, 0.15), 3);
      const scale = newZoom / prev.zoom;
      return {
        zoom: newZoom,
        x: mouseX - (mouseX - prev.x) * scale,
        y: mouseY - (mouseY - prev.y) * scale,
      };
    });
  }, []);

  const zoomIn = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      zoom: Math.min(prev.zoom * 1.2, 3),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      zoom: Math.max(prev.zoom * 0.8, 0.15),
    }));
  }, []);

  const fitView = useCallback(() => {
    const ns = nodesRef.current;
    if (ns.length === 0) {
      setTransform({ x: 0, y: 0, zoom: 1 });
      return;
    }
    const svg = svgRef.current;
    if (!svg) return;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const n of ns) {
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + NODE_W);
      maxY = Math.max(maxY, n.position.y + 200);
    }

    const padding = 60;
    const rect = svg.getBoundingClientRect();
    const contentW = maxX - minX + padding * 2;
    const contentH = maxY - minY + padding * 2;
    const zoom = Math.min(
      rect.width / contentW,
      rect.height / contentH,
      1.5
    );
    const x = (rect.width - (maxX + minX) * zoom) / 2;
    const y = (rect.height - (maxY + minY) * zoom) / 2;
    setTransform({ x, y, zoom });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        ) {
          return;
        }
        if (selectedEdgeId) {
          const edge = edges.find((e) => e.id === selectedEdgeId);
          if (edge) {
            onEdgesDelete([edge]);
            setSelectedEdgeId(null);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onEdgesDelete, selectedEdgeId, edges]);

  return {
    svgRef,
    transform,
    mode,
    tempEdge,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
    zoomIn,
    zoomOut,
    fitView,
    onEdgeClick,
    selectedEdgeId,
  };
}
