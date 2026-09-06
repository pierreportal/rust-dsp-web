import styled from "styled-components";

import { colors } from "../../theme";

export const CanvasBackground = styled.rect`
  fill: ${colors.canvasBg};
`;

export const DragRegion = styled.rect`
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
`;

export const HandleCircle = styled.circle`
  cursor: crosshair;
  pointer-events: all;
  fill: ${colors.panelHover};
  stroke: ${colors.accent};
  stroke-width: 1.5;

  &:hover {
    fill: ${colors.accent};
  }
`;