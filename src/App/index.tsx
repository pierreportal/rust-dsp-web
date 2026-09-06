import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Text } from "grommet";

import { audioEngine } from "../audio/audioEngine";
import { NODE_SPECS, Kind, type KindCode } from "../audio/nodeSpec";
import type { CanvasNode, CanvasEdge, Connection } from "../canvas/types";
import { Canvas, type CanvasHandle } from "../canvas/Canvas";
import { Keyboard } from "../components/Keyboard";
import { Palette } from "../components/Palette";
import { Topbar } from "../components/Topbar";
import { ErrorCode } from "./styles";

const parsePort = (handle?: string | null): number | null => {
  if (!handle) return null;
  const i = handle.indexOf("-");
  if (i < 0) return null;
  const n = parseInt(handle.slice(i + 1), 10);
  return Number.isNaN(n) ? null : n;
};

function AppInner() {
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<CanvasEdge[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idCounter = useRef(0);
  const canvasRef = useRef<CanvasHandle>(null);

  const nextId = () => idCounter.current++;

  const handleParamChange = useCallback(
    (id: string, name: string, value: number) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id
            ? { ...n, data: { ...n.data, params: { ...n.data.params, [name]: value } } }
            : n
        )
      );
      audioEngine.setParam(Number(id), name, value);
    },
    []
  );

  const buildNode = useCallback(
    (kind: KindCode, x: number, y: number, id: number): CanvasNode => {
      const spec = NODE_SPECS[kind];
      const params: Record<string, number> = {};
      for (const p of spec.params) params[p.name] = p.default;
      audioEngine.addNode(id, kind);
      for (const p of spec.params) audioEngine.setParam(id, p.name, p.default);
      return {
        id: String(id),
        position: { x, y },
        data: { kind, params, onParamChange: handleParamChange },
      };
    },
    [handleParamChange]
  );

  const addNode = useCallback(
    (kind: KindCode) => {
      const id = nextId();
      const node = buildNode(kind, 40 + (id % 5) * 60, 40 + (id % 5) * 60, id);
      setNodes((nds) => [...nds, node]);
    },
    [buildNode]
  );

  const onConnect = useCallback(
    (conn: Connection) => {
      const edge: CanvasEdge = {
        id: `e${conn.source}-${conn.sourceHandle}-${conn.target}-${conn.targetHandle}`,
        source: conn.source,
        sourceHandle: conn.sourceHandle,
        target: conn.target,
        targetHandle: conn.targetHandle,
      };
      setEdges((eds) => [...eds, edge]);
      const fromPort = parsePort(conn.sourceHandle);
      const toPort = parsePort(conn.targetHandle);
      if (fromPort != null && toPort != null) {
        audioEngine.connect(Number(conn.source), fromPort, Number(conn.target), toPort);
      }
    },
    []
  );

  const onEdgesDelete = useCallback((deleted: CanvasEdge[]) => {
    const ids = new Set(deleted.map((e) => e.id));
    setEdges((eds) => eds.filter((e) => !ids.has(e.id)));
    for (const e of deleted) {
      const fromPort = parsePort(e.sourceHandle);
      const toPort = parsePort(e.targetHandle);
      if (fromPort != null && toPort != null) {
        audioEngine.disconnect(Number(e.source), fromPort, Number(e.target), toPort);
      }
    }
  }, []);

  const onNodesDelete = useCallback((deletedIds: string[]) => {
    const ids = new Set(deletedIds);
    setNodes((nds) => nds.filter((n) => !ids.has(n.id)));
    for (const id of deletedIds) audioEngine.removeNode(Number(id));
  }, []);

  const onNodePositionChange = useCallback((id: string, x: number, y: number) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, position: { x, y } } : n))
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await audioEngine.init();
        await audioEngine.resume();
        if (cancelled) return;
        setReady(true);
        loadDefaultPatch();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDefaultPatch = () => {
    const midi = nextId();
    const osc = nextId();
    const adsr = nextId();
    const vca = nextId();
    const out = nextId();

    const built: CanvasNode[] = [
      buildNode(Kind.Midi, 0, 120, midi),
      buildNode(Kind.Osc, 260, 40, osc),
      buildNode(Kind.Adsr, 260, 240, adsr),
      buildNode(Kind.Vca, 520, 140, vca),
      buildNode(Kind.Out, 780, 140, out),
    ];

    const edge = (from: number, fromPort: number, to: number, toPort: number): CanvasEdge => ({
      id: `e${from}-out-${fromPort}-${to}-in-${toPort}`,
      source: String(from),
      sourceHandle: `out-${fromPort}`,
      target: String(to),
      targetHandle: `in-${toPort}`,
    });

    const builtEdges: CanvasEdge[] = [
      edge(midi, 1, osc, 0),
      edge(midi, 0, adsr, 0),
      edge(osc, 0, vca, 0),
      edge(adsr, 0, vca, 1),
      edge(vca, 0, out, 0),
    ];
    for (const e of builtEdges) {
      audioEngine.connect(Number(e.source), parsePort(e.sourceHandle)!, Number(e.target), parsePort(e.targetHandle)!);
    }

    setNodes(built);
    setEdges(builtEdges);
  };

  const midiNodeIds = nodes
    .filter((n) => n.data.kind === Kind.Midi)
    .map((n) => Number(n.id));

  const onNoteOn = useCallback(
    (note: number) => {
      audioEngine.resume();
      midiNodeIds.forEach((id) => audioEngine.noteOn(id, note));
    },
    [midiNodeIds]
  );
  const onNoteOff = useCallback(
    (note: number) => {
      void note;
      midiNodeIds.forEach((id) => audioEngine.noteOff(id));
    },
    [midiNodeIds]
  );

  if (error) {
    return (
      <Box
        margin="medium"
        pad="medium"
        round="small"
        background="errorBg"
        align="start"
        gap="xsmall"
      >
        <Text weight="bold" color="errorText">
          Audio init failed.
        </Text>
        <Text color="errorText">{error}</Text>
        <Text size="small" color="errorHint" margin={{ top: "small" }}>
          If AudioWorklet is unavailable, serve the app over <ErrorCode>http://localhost</ErrorCode> (run
          <ErrorCode> npm run dev</ErrorCode> in <ErrorCode>web/ui/</ErrorCode>) — not file:// or a LAN IP.
        </Text>
      </Box>
    );
  }

  return (
    <Box direction="row" height="100vh">
      <Palette onAdd={addNode} />
      <Box flex direction="column" background="bg" style={{ minWidth: 0 }}>
        <Topbar ready={ready} />
        <Box flex background="canvasBg" style={{ minHeight: 0 }}>
          <Canvas
            ref={canvasRef}
            nodes={nodes}
            edges={edges}
            onConnect={onConnect}
            onEdgesDelete={onEdgesDelete}
            onNodesDelete={onNodesDelete}
            onNodePositionChange={onNodePositionChange}
          />
        </Box>
        <Keyboard midiNodeIds={midiNodeIds} onNoteOn={onNoteOn} onNoteOff={onNoteOff} />
      </Box>
    </Box>
  );
}

export default function App() {
  return <AppInner />;
}