import styled from 'styled-components';

import { colors } from '../../theme';

interface NodeProps {
    $color: string;
}

export const Node = styled.div<NodeProps>`
    width: 180px;
    background: ${colors.nodeBg};
    border: 1px solid ${colors.nodeBorder};
    border-color: ${({ $color }) => $color};
    border-radius: 2px;
    overflow: visible;
    font-size: 12px;
    
    & input[type="range"], button {
        pointer-events: auto;
    }
`;

export const NodeTitle = styled.div<NodeProps>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 8px;
    font-weight: 600;
    font-size: 12px;
    border-radius: 1px 1px 0 0;
    background: ${({ $color }) => $color};
    color: ${colors.text};
    
    cursor: grab;

    &:active {
        cursor: grabbing;
    }
`;

export const NodeClose = styled.button`
    background: none;
    border: none;
    color: rgba(255,255,255,0.6);
    font-size: 15px;
    cursor: pointer;
    padding: 0 2px;
    line-height: 1;

    &:hover { 
        color: #fff; 
    }
`;

export const NodeBody = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 6px 8px;
    min-height: 24px;
`;

export const NodePorts = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

interface PortRowProps {
    $out?: boolean;
}

export const PortRow = styled.div<PortRowProps>`
    height: 22px;
    line-height: 22px;
    color: ${colors.muted};
    ${({ $out }) => $out && 'text-align: right;'}
`;

export const PortLabel = styled.span`
    font-size: 11px;
`;

export const NodeParams = styled.div`
    padding: 6px 8px;
    border-top: 1px solid ${colors.nodeDivider};
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

export const ParamHead = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: ${colors.muted};
`;

export const Param = styled.label`
    & input[type="range"] { 
        width: 100%; 
        accent-color: ${colors.accent}; 
    }
`;

export const ParamVal = styled.span`
    color: ${colors.accent}; 
    font-variant-numeric: tabular-nums;
`;

export const Rotary = styled.div`
    border: solid 1px red;
    // width: 20px;
    height: 20px;
`;