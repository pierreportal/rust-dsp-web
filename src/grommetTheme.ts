import type { ThemeType } from "grommet";

import { colors, fonts } from "./theme";

export const grommetTheme: ThemeType = {
  global: {
    colors: {
      brand: colors.accent,
      control: colors.accent,
      active: colors.panelHover,
      selected: colors.accent,
      placeholder: colors.muted,
      "search-placeholder": colors.muted,
      text: colors.text,
      "text-strong": colors.text,
      border: colors.border,
      bg: colors.bg,
      panel: colors.panel,
      panelHover: colors.panelHover,
      muted: colors.muted,
      canvasBg: colors.canvasBg,
      nodeBg: colors.nodeBg,
      nodeBorder: colors.nodeBorder,
      nodeDivider: colors.nodeDivider,
      accent: colors.accent,
      selectedEdge: colors.selectedEdge,
      keyWhite: colors.keyWhite,
      keyWhiteBorder: colors.keyWhiteBorder,
      keyBlack: colors.keyBlack,
      keyBlackBorder: colors.keyBlackBorder,
      keyActive: colors.keyActive,
      errorBg: colors.errorBg,
      errorText: colors.errorText,
      errorHint: colors.errorHint,
    },
    font: {
      family: fonts.base,
    },
    focus: {
      border: {
        color: colors.accent,
      },
    },
  },
  button: {
    border: {
      radius: "6px",
    },
    default: {
      color: colors.text,
    },
    hover: {
      background: colors.panelHover,
    },
  },
};