import React from "react";
import { createRoot } from "react-dom/client";
import { Grommet } from "grommet";
import App from "./App";
import { GlobalStyle } from "./GlobalStyle";
import { grommetTheme } from "./grommetTheme";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Grommet theme={grommetTheme} full>
      <GlobalStyle />
      <App />
    </Grommet>
  </React.StrictMode>
);