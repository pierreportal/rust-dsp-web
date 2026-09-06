import styled from "styled-components";

import { colors } from "../theme";

export const AppContainer = styled.div`
  display: flex;
  height: 100vh;
`;

export const AppMain = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

export const AppCanvas = styled.div`
  flex: 1;
  min-height: 0;
  background: ${colors.canvasBg};
`;

export const ErrorBanner = styled.div`
  margin: 24px;
  padding: 16px;
  background: ${colors.errorBg};
  color: ${colors.errorText};
  border-radius: 8px;
`;

export const ErrorBannerHint = styled.div`
  margin-top: 8px;
  color: ${colors.errorHint};
  font-size: 13px;
`;

export const ErrorCode = styled.code`
  background: ${colors.errorCodeBg};
  padding: 1px 5px;
  border-radius: 3px;
`;