import { createGlobalStyle } from "styled-components";

import { colors, fonts } from "./theme";

export const GlobalStyle = createGlobalStyle`
  :root {
    color-scheme: dark;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html,
  body,
  #root {
    margin: 0;
    height: 100%;
    background: ${colors.bg};
    color: ${colors.text};
    font-family: ${fonts.base};
    user-select: none;
  }
`;