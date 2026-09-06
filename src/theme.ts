

export const colors = {
  bg: "#0e0d15",
  panel: "#17151f",
  panelHover: "#211d2b",
  text: "#ece9f5",
  muted: "#8f88a3",
  canvasBg: "#09080f",
  canvasDot: "#262233",
  border: "#272433",
  nodeBg: "#100e18",
  nodeBorder: "#2f2b3d",
  nodeDivider: "#211d2b",
  // accent: "#a78bfa",
  accent: "rgb(111, 255, 176)",
  selectedEdge: "#c4b5fd",
  keyWhite: "#e6e3f0",
  // keyWhite: "rgb(111, 255, 176)",
  keyWhiteBorder: "#b3aec9",
  // keyWhiteBorder: "rgb(44, 106, 72)",

  keyBlack: "#15121e",
  keyBlackBorder: "#000000",
  // keyActive: "#8b6fe0",
  keyActive: "rgb(111, 255, 176)",

  errorBg: "#24131f",
  errorText: "#f0a0c0",
  errorHint: "#d9a8bd",
  errorCodeBg: "#00000040",
} as const;

export const fonts = {
  // base: "system-ui, -apple-system, sans-serif",
  base: "monospace, sans-serif"
} as const;

/**
 * Monochrome-purple accent per module kind (kind code -> color), applied on
 * top of the registry's default colors. Keyed by the stable kind codes from
 * `pkg/module-registry.json`. Falls back to the registry color for unknown
 * kinds so a newly-added Rust module still renders.
 */
// export const moduleColors: Record<number, string> = {
//   0: "#5f29ff", // Oscillator
//   1: "#5f29ff", // ADSR
//   2: "#5f29ff", // Filter
//   3: "#5f29ff", // Distortion
//   4: "#5f29ff", // VCA
//   5: "#5f29ff", // Mixer
//   6: "#5f29ff", // LFO (slot free)
//   7: "#5f29ff", // Constant
//   8: "#5f29ff", // Output
//   9: "#5f29ff", // MIDI / CV
// } as const;

export const moduleColors: Record<number, string> = {
  0: colors.accent, // Oscillator
  1: colors.accent, // ADSR
  2: colors.accent, // Filter
  3: colors.accent, // Distortion
  4: colors.accent, // VCA
  5: colors.accent, // Mixer
  6: colors.accent, // LFO (slot free)
  7: colors.accent, // Constant
  8: colors.accent, // Output
  9: colors.accent, // MIDI / CV
} as const;