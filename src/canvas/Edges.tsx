import { type CanvasNode, type CanvasEdge, NODE_W, handleY } from "./types";
import { NODE_SPECS } from "../audio/nodeSpec";

interface EdgesProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  selectedId?: string | null;
  onEdgeClick: (edge: CanvasEdge) => void;
}

function handleWorldPos(
  nodeMap: Map<string, CanvasNode>,
  nodeId: string,
  handleId: string
): { x: number; y: number } | null {
  const node = nodeMap.get(nodeId);
  if (!node) return null;
  const spec = NODE_SPECS[node.data.kind];
  const isOutput = handleId.startsWith("out-");
  const portIdx = parseInt(handleId.split("-")[1], 10);
  if (Number.isNaN(portIdx)) return null;
  const ports = isOutput ? spec.outputs : spec.inputs;
  if (portIdx >= ports.length) return null;
  return {
    x: node.position.x + (isOutput ? NODE_W : 0),
    y: node.position.y + handleY(portIdx),
  };
}

function bezierPath(sx: number, sy: number, tx: number, ty: number): string {
  const dx = Math.abs(tx - sx);
  const cp = Math.max(dx * 0.5, 50);
  return `M ${sx},${sy} C ${sx + cp},${sy} ${tx - cp},${ty} ${tx},${ty}`;
}

export function Edges({ nodes, edges, selectedId, onEdgeClick }: EdgesProps) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <>
      {edges.map((edge) => {
        const sp = handleWorldPos(nodeMap, edge.source, edge.sourceHandle);
        const tp = handleWorldPos(nodeMap, edge.target, edge.targetHandle);
        if (!sp || !tp) return null;
        const selected = edge.id === selectedId;
        return (
          <g
            key={edge.id}
            onClick={(e) => {
              e.stopPropagation();
              onEdgeClick(edge);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ cursor: "pointer" }}
          >
            <path
              d={bezierPath(sp.x, sp.y, tp.x, tp.y)}
              fill="none"
              stroke="transparent"
              strokeWidth={12}
            />
            <path
              d={bezierPath(sp.x, sp.y, tp.x, tp.y)}
              fill="none"
              stroke={selected ? "#ff8a5b" : "#5b8def"}
              strokeWidth={selected ? 3 : 2}
              strokeDasharray="6 4"
              opacity={selected ? 1 : 0.8}
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-20"
                dur="0.8s"
                repeatCount="indefinite"
              />
            </path>
          </g>
        );
      })}
    </>
  );
}

export function TempEdge({
  sx,
  sy,
  tx,
  ty,
}: {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
}) {
  return (
    <path
      d={bezierPath(sx, sy, tx, ty)}
      fill="none"
      stroke="#5b8def"
      strokeWidth={2}
      opacity={0.5}
      strokeDasharray="4 3"
    />
  );
}
