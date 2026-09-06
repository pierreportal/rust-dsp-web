import styled from "styled-components";

import { colors } from "../../theme";

export const CanvasContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

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

export const CanvasControls = styled.div`
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const ControlButton = styled.button`
  width: 32px;
  height: 32px;
  border: 1px solid ${colors.nodeBorder};
  background: ${colors.panel};
  color: ${colors.text};
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${colors.panelHover};
  }
`;