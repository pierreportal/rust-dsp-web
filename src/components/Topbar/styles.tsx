import styled from "styled-components";

import { colors } from "../../theme";

export const AppTopbar = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    background: ${colors.panel};
    border-bottom: 1px solid ${colors.border};
`;

export const Title = styled.h1`
    font-size: 14px;
    font-weight: 600;
    margin: 0;
    color: ${colors.text};
`;

export const AppStatus = styled.span`
    color: ${colors.muted};
    font-size: 13px;
`;