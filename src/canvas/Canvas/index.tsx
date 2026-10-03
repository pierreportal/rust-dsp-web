import { useCallback, useImperativeHandle, useState, forwardRef } from "react";
import { Box, Button, Text } from "grommet";
import { Close, Scan, ZoomIn, ZoomOut } from "grommet-icons";
import { type CanvasNode, type CanvasEdge, type Connection, NODE_W, TITLE_H, HANDLE_R, handleY } from "../types";
import { NODE_SPECS } from "../../audio/nodeSpec";
import { useCanvasInteraction } from "../useCanvasInteraction";
import { Edges, TempEdge } from "../Edges";
import { ModuleNode } from "../../nodes/ModuleNode";
import { CanvasBackground, Bullet, DragRegion, HandleCircle } from "./styles";
import { RxQuestionMark } from "react-icons/rx";
import { colors } from "../../theme";

export interface CanvasHandle {
  fitView: () => void;
}

interface CanvasProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  onConnect: (conn: Connection) => void;
  onEdgesDelete: (edges: CanvasEdge[]) => void;
  onNodesDelete: (nodeIds: string[]) => void;
  onNodePositionChange: (id: string, x: number, y: number) => void;
}

export const Canvas = forwardRef<CanvasHandle, CanvasProps>(function Canvas(
  {
    nodes,
    edges,
    onConnect,
    onEdgesDelete,
    onNodesDelete,
    onNodePositionChange,
  },
  ref
) {
  const {
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
  } = useCanvasInteraction({
    nodes,
    edges,
    onConnect,
    onEdgesDelete,
    onNodePositionChange,
  });

  useImperativeHandle(ref, () => ({ fitView }), [fitView]);

  const handleDeleteNode = useCallback(
    (id: string) => {
      const related = edges.filter(
        (e) => e.source === id || e.target === id
      );
      if (related.length > 0) onEdgesDelete(related);
      onNodesDelete([id]);
    },
    [edges, onEdgesDelete, onNodesDelete]
  );

  const [showHelp, setShowHelp] = useState(true);

  const cursor =
    mode === "panning" ? "grabbing" : mode === "dragging" ? "grabbing" : "default";

  return (
    <Box fill style={{ position: "relative" }}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ cursor, display: "block" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
      >
        <defs>
          <pattern
            id="dots"
            width={10}
            height={10}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={10} cy={10} r={1} fill={colors.canvasDot} />
          </pattern>
        </defs>
        <CanvasBackground width="100%" height="100%" />
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.zoom})`}>
          <rect
            x={-10000}
            y={-10000}
            width={20000}
            height={20000}
            fill="url(#dots)"
          />
          <Edges nodes={nodes} edges={edges} selectedId={selectedEdgeId} onEdgeClick={onEdgeClick} />
          {tempEdge && (
            <TempEdge
              sx={tempEdge.sx}
              sy={tempEdge.sy}
              tx={tempEdge.tx}
              ty={tempEdge.ty}
            />
          )}
          {nodes.map((node) => {
            const spec = NODE_SPECS[node.data.kind];
            return (
              <g key={node.id} transform={`translate(${node.position.x}, ${node.position.y})`}>
                <foreignObject width={NODE_W} height={600} style={{ pointerEvents: "none" }}>
                  <ModuleNode
                    id={node.id}
                    data={node.data}
                    onDelete={handleDeleteNode}
                    onParamChange={node.data.onParamChange}
                  />
                </foreignObject>
                <DragRegion
                  width={NODE_W}
                  height={TITLE_H}
                  fill="transparent"
                  style={{ pointerEvents: "none" }}
                />
                {spec.inputs.map((_label, i) => (
                  <HandleCircle
                    key={`in-${i}`}
                    cx={0}
                    cy={handleY(i)}
                    r={HANDLE_R}
                  />
                ))}
                {spec.outputs.map((_label, i) => (
                  <HandleCircle
                    key={`out-${i}`}
                    cx={NODE_W}
                    cy={handleY(i)}
                    r={HANDLE_R}
                  />
                ))}
              </g>
            );
          })}
        </g>
      </svg>
      {showHelp && (
        <Box
          width="300px"
          background="panel"
          border={{ color: "border" }}
          round="small"
          elevation="medium"
          pad="medium"
          gap="xsmall"
          style={{ position: "absolute", bottom: 32, right: 72, maxWidth: "60%" }}
        >
          <Box
            direction="row"
            align="center"
            justify="between"
            style={{ marginBottom: 4 }}
          >
            <Text size="small" weight="bold">
              How to use
            </Text>
            <Button
              plain
              focusIndicator={false}
              title="Dismiss"
              onClick={() => setShowHelp(false)}
            >
              <Close size="small" color="muted" />
            </Button>
          </Box>
          <Bullet>Drag a module title to move it</Bullet>
          <Bullet>Drag a port handle to patch (connect) modules</Bullet>
          <Bullet>Click a patch cable to select it, then press Delete to unpatch</Bullet>
          <Bullet>Click empty canvas and drag to pan, scroll to zoom</Bullet>
          <Bullet>Turn knobs by dragging up/down; double-click to reset</Bullet>
          <Bullet>Play notes with the keyboard at the bottom (A W S E D F T G Y H U J)</Bullet>
        </Box>
      )}
      <Box
        direction="column"
        gap="small"
        style={{ position: "absolute", bottom: 12, right: 12 }}
      >
        <Button
          icon={<ZoomIn size="small" />}
          title="Zoom in"
          onClick={zoomIn}
          pad="small"
          hoverIndicator={{ color: "panelHover" }}
          focusIndicator={false}
        />
        <Button
          icon={<ZoomOut size="small" />}
          title="Zoom out"
          onClick={zoomOut}
          pad="small"
          hoverIndicator={{ color: "panelHover" }}
          focusIndicator={false}
        />
        <Button
          icon={<Scan size="small" />}
          title="Fit view"
          onClick={fitView}
          pad="small"
          hoverIndicator={{ color: "panelHover" }}
          focusIndicator={false}
        />
        <Button
          icon={<RxQuestionMark size={12} />}
          title="How to"
          onClick={() => setShowHelp((s) => !s)}
          pad="small"
          hoverIndicator={{ color: "panelHover" }}
          focusIndicator={false}
        />
      </Box>
    </Box>
  );
});