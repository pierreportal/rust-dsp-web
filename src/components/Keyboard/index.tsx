import { useEffect, useState } from "react";
import { Box, Text } from "grommet";

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

interface Props {
  midiNodeIds: number[];
  onNoteOn: (note: number) => void;
  onNoteOff: (note: number) => void;
}

export function Keyboard({ midiNodeIds, onNoteOn, onNoteOff }: Props) {
  const [pressed, setPressed] = useState<Set<number>>(new Set());

  const press = (note: number) => {
    if (pressed.has(note)) return;
    setPressed((p) => new Set(p).add(note));
    onNoteOn(note);
  };
  const release = (note: number) => {
    if (!pressed.has(note)) return;
    setPressed((p) => {
      const n = new Set(p);
      n.delete(note);
      return n;
    });
    onNoteOff(note);
  };

  useEffect(() => {
    const keyToMidi = new Map(KEYS.map((k) => [k.key, k.note]));
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const midi = keyToMidi.get(e.key.toLowerCase());
      if (midi !== undefined) press(midi);
    };
    const up = (e: KeyboardEvent) => {
      const midi = keyToMidi.get(e.key.toLowerCase());
      if (midi !== undefined) release(midi);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  });

  // midiNodeIds is present so consumers can read it; the actual note routing
  // is done by the parent via onNoteOn/onNoteOff.
  void midiNodeIds;

  return (
    <Box
      direction="row"
      flex={false}
      background="panel"
      border={{ side: "top", color: "border" }}
      pad="small"
      style={{ height: 120, userSelect: "none" }}
    >
      {KEYS.map((k) => {
        const active = pressed.has(k.note);
        const bg = active ? "keyActive" : k.black ? "keyBlack" : "keyWhite";
        const fg = active ? "#ffffff" : k.black ? "#dddddd" : "#222222";
        return (
          <Box
            key={k.note}
            flex={k.black ? false : "grow"}
            background={bg}
            align="center"
            justify="end"
            style={{
              cursor: "pointer",
              borderRadius: 4,
              border: `1px solid ${k.black ? "#000000" : "#c8c8c0"}`,
              paddingBottom: 6,
              flex: k.black ? "0 0 6%" : undefined,
              height: k.black ? "60%" : undefined,
              alignSelf: k.black ? "flex-start" : "stretch",
              margin: k.black ? "0 -3%" : undefined,
              zIndex: k.black ? 2 : undefined,
            }}
            onMouseDown={() => press(k.note)}
            onMouseUp={() => release(k.note)}
            onMouseLeave={() => release(k.note)}
          >
            <Text size="small" weight="bold" color={fg}>
              {k.name}
            </Text>
            <Text size="xsmall" color={fg} style={{ opacity: 0.6 }}>
              {k.key}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}