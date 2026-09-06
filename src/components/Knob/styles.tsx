import styled from "styled-components";

import { colors } from "../../theme";

export const KnobContainer = styled.div`
  pointer-events: auto;
  position: relative;
  display: inline-flex;
  touch-action: none;
  user-select: none;
  cursor: ns-resize;
  outline: none;

  &:focus-visible {
    outline: 2px solid ${colors.accent};
    outline-offset: 3px;
    border-radius: 50%;
  }
`;