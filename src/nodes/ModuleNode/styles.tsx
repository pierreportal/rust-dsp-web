import styled from 'styled-components';

export const Node = styled.div`
    width: 180px;
    background: #11141a;
    border: 1px solid #2c313c;
    border-radius: 8px;
    overflow: visible;
    font-size: 12px;
    
    & input[type="range"], button {
        pointer-events: auto;
    }
`;

export const NodeTitle = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 8px;
    font-weight: 600;
    font-size: 12px;
    border-radius: 7px 7px 0 0;
    color: #fff;
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

interface IPortsProps {
    out?: boolean;
}

export const PortRow = styled.div<IPortsProps>`
    height: 22px;
    line-height: 22px;
    color: #8a8f99;
    ${({ out }) => out && 'text-align: right;'}
`;

export const PortLabel = styled.span`
    font-size: 11px;
`;

export const NodeParams = styled.div`
    padding: 6px 8px;
    border-top: 1px solid #232731;
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

export const ParamHead = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #8a8f99;
`;

export const Param = styled.label`
    & input[type="range"] { 
        width: 100%; 
        accent-color: #6aa1ff; 
    }
`;

export const ParamVal = styled.span`
    color: #6aa1ff; 
    font-variant-numeric: tabular-nums;
`;