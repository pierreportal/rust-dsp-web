import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Text } from "grommet";
import { audioEngine } from "../audio/audioEngine";
import { Canvas, type CanvasHandle } from "../canvas/Canvas";
import { Keyboard } from "../components/Keyboard";
import { Palette } from "../components/Palette";
import { Topbar } from "../components/Topbar";
import { midiManager } from "../MIDI/midiManager";
import { ErrorCode } from "./styles";
import { usePatch } from "../hooks/usePatch";
import { Kind } from "../audio/nodeSpec";

function AppInner() {
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(() => audioEngine.isRunning);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<CanvasHandle>(null);

  const {
    loadDefaultPatch,
    nodes,
    edges,
    addNode,
    onConnect,
    onEdgesDelete,
    onNodesDelete,
    onNodePositionChange,
  } = usePatch();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Deliberately not awaiting `resume()`: without a user gesture the
        // browser leaves the context suspended and the promise never settles,
        // which would stall the first paint. The engine resumes itself on the
        // first interaction, and reports the transition via `subscribe`.
        await audioEngine.init();
        if (cancelled) {
          return;
        }
        setReady(true);
        loadDefaultPatch();
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => audioEngine.subscribe(() => setRunning(audioEngine.isRunning)),
    []);

  useEffect(() => {
    void midiManager.ensureAccess();
  }, []);

  const midiNodeIds = useMemo(
    () =>
      nodes.filter((n) => n.data.kind === Kind.Midi).map((n) => Number(n.id)),
    [nodes],
  );

  const onNoteOn = useCallback(
    (note: number) => {
      // First real interaction is often a note press, so nudge the context
      // awake. Fire-and-forget: this promise does not settle without a gesture.
      void audioEngine.resume();
      for (const id of midiNodeIds) audioEngine.noteOn(id, note);
    },
    [midiNodeIds],
  );
  const onNoteOff = useCallback(
    (note: number) => {
      void note;
      for (const id of midiNodeIds) audioEngine.noteOff(id);
    },
    [midiNodeIds],
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
          If AudioWorklet is unavailable, serve the app over{" "}
          <ErrorCode>http://localhost</ErrorCode> (run
          <ErrorCode> npm run dev</ErrorCode> in <ErrorCode>web/ui/</ErrorCode>)
          — not file:// or a LAN IP.
        </Text>
      </Box>
    );
  }

  return (
    <Box
      flex
      height="100vh"
      direction="column"
      background="bg"
      style={{ minWidth: 0 }}
    >
      <Topbar ready={ready} running={running} />
      <Box direction="row" height="100vh">
        <Palette onAdd={addNode} />
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
      </Box>
      <Keyboard
        midiNodeIds={midiNodeIds}
        onNoteOn={onNoteOn}
        onNoteOff={onNoteOff}
      />
    </Box>
  );
}

export default function App() {
  return <AppInner />;
}
