import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, Text } from "grommet";
import { Close } from "grommet-icons";
import { audioEngine } from "../audio/audioEngine";
import { Canvas, type CanvasHandle } from "../canvas/Canvas";
import { Keyboard } from "../components/Keyboard";
import { Palette } from "../components/Palette";
import { Topbar } from "../components/Topbar";
import { midiManager } from "../MIDI/midiManager";
import { useMIDICC } from "../MIDI/useMIDI";
import { ErrorCode } from "./styles";
import { usePatch } from "../hooks/usePatch";
import { decodePatch, encodePatch, serializePatch } from "../patch/patchCodec";
import { readPatchHash, writePatchHash } from "../patch/patchUrl";

const COPIED_FEEDBACK_MS = 1600;

function repairMessage(warnings: string[]): string {
  const shown = warnings.slice(0, 3).join("; ");
  const extra = warnings.length > 3 ? ` (+${warnings.length - 3} more)` : "";
  return `Patch link repaired — ${shown}${extra}.`;
}

function AppInner() {
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(() => audioEngine.isRunning);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const canvasRef = useRef<CanvasHandle>(null);
  const copiedTimer = useRef<number | null>(null);

  const {
    loadDefaultPatch,
    loadPatch,
    nodes,
    edges,
    addNode,
    onConnect,
    onEdgesDelete,
    onNodesDelete,
    onNodePositionChange,
  } = usePatch();

  const restorePatchFromHash = () => {
    const code = readPatchHash();
    if (!code) return false;

    const result = decodePatch(code);
    if (result.error) {
      setNotice(`That patch link could not be read (${result.error}). Showing the default patch.`);
      return false;
    }
    if (result.patch.nodes.length === 0) {
      setNotice("That patch link has no modules. Showing the default patch.");
      return false;
    }

    loadPatch(result.patch);
    if (result.warnings.length > 0) setNotice(repairMessage(result.warnings));
    requestAnimationFrame(() => canvasRef.current?.fitView());
    return true;
  };

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
        if (!restorePatchFromHash()) loadDefaultPatch();
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

  useEffect(
    () => () => {
      if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current);
    },
    [],
  );

  const onShareLink = useCallback(() => {
    writePatchHash(encodePatch(serializePatch(nodes, edges)));
    void Promise.resolve(navigator.clipboard?.writeText(window.location.href)).then(
      () => setLinkCopied(true),
      () => setLinkCopied(false),
    );
    if (copiedTimer.current !== null) window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => setLinkCopied(false), COPIED_FEEDBACK_MS);
  }, [nodes, edges]);

  const onNoteOn = useCallback((note: number) => {
    // First real interaction is often a note press, so nudge the context
    // awake. Fire-and-forget: this promise does not settle without a gesture.
    void audioEngine.resume();
    // One call: the engine allocates the note to one of its polyphonic voices
    // and drives that voice's Midi nodes, so the UI no longer fans out per node.
    audioEngine.noteOn(note);
  }, []);

  const onNoteOff = useCallback((note: number) => {
    audioEngine.noteOff(note);
  }, []);

  // Controllers are patchable sources rather than per-knob assignments, so
  // there is nothing to look up here: every CC is forwarded and the engine
  // feeds only the Controller modules tuned to that number. This runs
  // independently of note handling, so a sweep works while chords are held.
  useMIDICC((event) => {
    audioEngine.setCC(event.cc, event.value);
  });

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
      <Topbar
        ready={ready}
        running={running}
        linkCopied={linkCopied}
        onShareLink={onShareLink}
      />
      {notice && (
        <Box
          direction="row"
          align="center"
          justify="between"
          gap="small"
          background="errorBg"
          border={{ side: "bottom", color: "border" }}
          pad={{ horizontal: "16px", vertical: "xsmall" }}
          flex={false}
        >
          <Text size="small" color="errorText">
            {notice}
          </Text>
          <Button
            plain
            focusIndicator={false}
            title="Dismiss"
            onClick={() => setNotice(null)}
          >
            <Close size="small" color="errorText" opacity="0.8" />
          </Button>
        </Box>
      )}
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
      <Keyboard onNoteOn={onNoteOn} onNoteOff={onNoteOff} />
    </Box>
  );
}

export default function App() {
  return <AppInner />;
}
