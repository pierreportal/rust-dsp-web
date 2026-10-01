import { useCallback, useEffect, useState } from "react";
import { Box, Text } from "grommet";
import { useMIDINotes } from "../../MIDI/useMIDI";

// White keys A S D F G H J, black keys W E T Y U -> C4..B4.
const KEYS = [
  { note: 60, name: "C", key: "a" },
  { note: 61, name: "C#", key: "w", black: true },
  { note: 62, name: "D", key: "s" },
  { note: 63, name: "D#", key: "e", black: true },
  { note: 64, name: "E", key: "d" },
  { note: 65, name: "F", key: "f" },
  { note: 66, name: "F#", key: "t", black: true },
  { note: 67, name: "G", key: "g" },
  { note: 68, name: "G#", key: "y", black: true },
  { note: 69, name: "A", key: "h" },
  { note: 70, name: "A#", key: "u", black: true },
  { note: 71, name: "B", key: "j" },
];

const KEY_TO_MIDI = new Map(KEYS.map((k) => [k.key, k.note]));

interface Props {
  midiNodeIds: number[];
  onNoteOn: (note: number) => void;
  onNoteOff: (note: number) => void;
}

export function Keyboard({ midiNodeIds, onNoteOn, onNoteOff }: Props) {
  const [pressed, setPressed] = useState<Set<number>>(new Set());

  const press = useCallback(
    (note: number) => {
      setPressed((p) => {
        if (p.has(note)) return p;
        const n = new Set(p);
        n.add(note);
        return n;
      });
      onNoteOn(note);
    },
    [onNoteOn]
  );

  const release = useCallback(
    (note: number) => {
      setPressed((p) => {
        if (!p.has(note)) return p;
        const n = new Set(p);
        n.delete(note);
        return n;
      });
      onNoteOff(note);
    },
    [onNoteOff]
  );

  useMIDINotes((event) => {
    if (event.type === "on") press(event.note);
    else release(event.note);
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const midi = KEY_TO_MIDI.get(e.key.toLowerCase());
      if (midi !== undefined) press(midi);
    };
    const up = (e: KeyboardEvent) => {
      const midi = KEY_TO_MIDI.get(e.key.toLowerCase());
      if (midi !== undefined) release(midi);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [press, release]);

  // midiNodeIds is present so consumers can read it; the actual note routing
  // is done by the parent via onNoteOn/onNoteOff.
  void midiNodeIds;

  return (
    <Box
      direction="row"
      flex={false}
      background="panel"
      border={{ side: "top", color: "border" }}
      pad="xsmall"
      style={{
        height: 60,
        userSelect: "none",
        // opacity: 0,
        display: 'none',
        position: "absolute",
        bottom: 0,
        // width: '400px'
      }}
    >
      {KEYS.map((k) => {
        const active = pressed.has(k.note);
        const bg = active ? "keyActive" : k.black ? "keyBlack" : "keyWhite";
        const fg = active ? "#ffffff" : k.black ? "#e0dcf0" : "#1f1b2e";
        return (
          <Box
            key={k.note}
            flex="grow"
            background={bg}
            align="center"
            justify="end"
            style={{
              cursor: "pointer",
              borderRadius: 2,
              border: `1px solid ${k.black ? "#000000" : "#c8c8c0"}`,
              paddingBottom: 6,
            }}
            onMouseDown={() => press(k.note)}
            onMouseUp={() => release(k.note)}
            onMouseLeave={() => release(k.note)}
          >
            <Text size="small" weight="bold" color={fg}>
              {k.key.toUpperCase()}
            </Text>
            <Text size="xsmall" color={fg} style={{ opacity: 0.6 }}>
              {k.name}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
