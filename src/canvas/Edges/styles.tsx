import styled from "styled-components";

import { colors } from "../../theme";

export const EdgeGroup = styled.g`
  cursor: pointer;
`;

export const EdgeHitPath = styled.path`
  stroke: transparent;
`;

interface EdgePathProps {
  $selected?: boolean;
}

export const EdgePath = styled.path<EdgePathProps>`
  stroke: ${({ $selected }) => ($selected ? colors.selectedEdge : colors.accent)};
  stroke-width: ${({ $selected }) => ($selected ? 3 : 1)};
  stroke-dasharray: 6 4;
  opacity: ${({ $selected }) => ($selected ? 1 : 0.8)};
`;

export const TempEdgePath = styled.path`
  stroke: ${colors.accent};
  stroke-width: 2;
  opacity: 0.5;
  stroke-dasharray: 4 3;
`;