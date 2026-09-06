import styled from "styled-components";

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
    background: #0b0d11;
`;

export const ErrorBanner = styled.div`
    margin: 24px;
    padding: 16px;
    background: #2a1414;
    color: #ff9b9b;
    border-radius: 8px;
    font-family: system-ui;
`;