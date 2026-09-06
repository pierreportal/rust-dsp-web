import styled from "styled-components";

import { colors } from "../../theme";

export const KeyboardContainer = styled.div`
  display: flex;
  height: 120px;
  background: ${colors.panel};
  border-top: 1px solid ${colors.border};
  padding: 8px;
  user-select: none;
`;

interface KeyProps {
  $black?: boolean;
  $active?: boolean;
}

export const Key = styled.div<KeyProps>`
  position: relative;
  flex: ${({ $black }) => ($black ? "0 0 6%" : "1")};
  background: ${({ $active, $black }) =>
    $active ? colors.keyActive : $black ? colors.keyBlack : colors.keyWhite};
  color: ${({ $active, $black }) => ($active ? "#fff" : $black ? "#ddd" : "#222")};
  border: 1px solid
    ${({ $black }) => ($black ? colors.keyBlackBorder : colors.keyWhiteBorder)};
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding-bottom: 6px;
  cursor: pointer;
  margin: ${({ $black }) => ($black ? "0 -3%" : "0")};
  height: ${({ $black }) => ($black ? "60%" : "auto")};
  align-self: ${({ $black }) => ($black ? "flex-start" : "stretch")};
  z-index: ${({ $black }) => ($black ? 2 : "auto")};
`;

export const KeyLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
`;

export const KeyBinding = styled.span`
  font-size: 10px;
  opacity: 0.6;
`;