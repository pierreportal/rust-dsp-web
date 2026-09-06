import styled from "styled-components";

import { colors } from "../../theme";

export const PaletteContainer = styled.nav`
  width: 168px;
  background: ${colors.panel};
  border-right: 1px solid ${colors.border};
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
`;

export const PaletteTitle = styled.div`
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${colors.muted};
  margin-bottom: 4px;
`;

export const PaletteItem = styled.button<{ $color: string }>`
  text-align: left;
  background: ${colors.nodeBg};
  color: ${colors.text};
  border: 1px solid ${colors.nodeBorder};
  border-left-width: 3px;
  border-left-color: ${({ $color }) => $color};
  border-radius: 6px;
  padding: 8px 10px;
  cursor: pointer;
  font-size: 13px;
  font-family: inherit;

  &:hover {
    background: ${colors.panelHover};
  }
`;