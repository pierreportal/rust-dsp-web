import styled from "styled-components";
import { Box } from "grommet";

// The node lives inside an SVG <foreignObject> with pointer-events: none so
// the canvas surface stays draggable. Re-enable pointer events for the
// interactive controls (close button) — the Knob manages its own.
export const NodeCard = styled(Box)`
  & button {
    pointer-events: auto;
  }
`;