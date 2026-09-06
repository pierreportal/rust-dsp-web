import { NODE_SPECS, ParamSpec } from "../../audio/nodeSpec";
import {
    Node,
    NodeBody,
    NodeClose,
    NodeParams,
    NodePorts,
    NodeTitle,
    Param,
    ParamHead,
    ParamVal,
    PortLabel,
    PortRow,
    Rotary,
} from "./styles";

export interface ModuleNodeData {
    kind: number;
    params: Record<string, number>;
    onParamChange: (id: string, name: string, value: number) => void;
    [key: string]: unknown;
}

interface ModuleNodeProps {
    id: string;
    data: ModuleNodeData;
    onDelete: (id: string) => void;
    onParamChange: (id: string, name: string, value: number) => void;
}

export function ModuleNode({ id, data, onDelete }: ModuleNodeProps) {
    const d = data as unknown as ModuleNodeData;
    const spec = NODE_SPECS[d.kind];

    return (
        <Node
            $color={spec.color}
            data-node="true"
            onPointerDown={(e) => e.stopPropagation()}
        >
            <NodeTitle $color={spec.color}>
                <span>{spec.label}</span>
                <NodeClose
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(id);
                    }}
                >
                    ×
                </NodeClose>
            </NodeTitle>

            <NodeBody>
                <NodePorts>
                    {spec.inputs.map((label, i) => (
                        <PortRow key={i}>
                            <PortLabel>{label}</PortLabel>
                        </PortRow>
                    ))}
                </NodePorts>
                <NodePorts>
                    {spec.outputs.map((label, i) => (
                        <PortRow $out key={i}>
                            <PortLabel>{label}</PortLabel>
                        </PortRow>
                    ))}
                </NodePorts>
            </NodeBody>

            {spec.params.length > 0 && (
                <NodeParams>
                    {spec.params.map((p) => (
                        <Param key={p.name}>
                            <ParamHead>
                                <span>{p.label}</span>
                                <ParamVal>
                                    {d.params[p.name]?.toFixed(p.step < 1 ? 2 : 0)}
                                </ParamVal>
                            </ParamHead>
                            <RotaryInput
                                min={p.min}
                                max={p.max}
                                step={p.step}
                                value={d.params[p.name] ?? p.default}
                                onChange={(e) =>
                                    d.onParamChange(id, p.name, parseFloat(e.target.value))
                                }
                            />
                        </Param>
                    ))}
                </NodeParams>
            )}
        </Node>
    );
}

interface IRotaryInputProps {
    min: number,
    max: number,
    step: number,
    value: number,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const RotaryInput = ({ min, max, step, value, onChange }: IRotaryInputProps) => {
    return (
        <Rotary>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={onChange}
            />
        </Rotary>
    )
}