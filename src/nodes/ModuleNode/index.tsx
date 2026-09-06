import { Box, Button, Text } from "grommet";
import { Close } from "grommet-icons";

import { NODE_SPECS } from "../../audio/nodeSpec";
import { Knob } from "../../components/Knob";
import { NodeCard } from "./styles";
import { NODE_W } from "../../canvas/types";
import { colors } from "../../theme";

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

/** Pick white or dark text that stays readable on the module accent color. */
function titleColor(_hex: string): string {
    // const r = parseInt(hex.slice(1, 3), 16) / 255;
    // const g = parseInt(hex.slice(3, 5), 16) / 255;
    // const b = parseInt(hex.slice(5, 7), 16) / 255;
    // const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    // return lum > 0.6 ? "#111112" : "#ffffff";
    return colors.bg;
}

export function ModuleNode({ id, data, onDelete }: ModuleNodeProps) {
    const d = data as unknown as ModuleNodeData;
    const spec = NODE_SPECS[d.kind];
    const titleColorHex = titleColor(spec.color);

    return (
        <NodeCard
            width={`${NODE_W}px`}
            background="nodeBg"
            border={{ color: spec.color, size: "1px" }}
            round={{ size: "xxsmall" }}
            overflow="visible"
            data-node="true"
            onPointerDown={(e) => e.stopPropagation()}
        >
            <Box
                direction="row"
                align="center"
                justify="between"
                background={spec.color}
                pad={{ horizontal: "small", vertical: "xxxsmall" }}
                style={{ cursor: "grab" }}
            >
                <Text size="small" weight="bold" color={titleColorHex}>
                    {spec.label}
                </Text>
                <Button
                    plain
                    focusIndicator={false}
                    title="Remove node"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(id);
                    }}
                >
                    <Box pad={{ horizontal: "xsmall" }}>
                        <Close size="small" color={titleColorHex} opacity="0.8" />
                    </Box>
                </Button>
            </Box>

            <Box direction="row" justify="between" pad={{ horizontal: "small", vertical: "xsmall" }}>
                <Box direction="column">
                    {spec.inputs.map((label, i) => (
                        <Box key={i} justify="center" style={{ height: "22px" }}>
                            <Text size="xsmall" color="muted">
                                {label}
                            </Text>
                        </Box>
                    ))}
                </Box>
                <Box direction="column" align="end" >
                    {spec.outputs.map((label, i) => (
                        <Box key={i} justify="center" style={{ height: "22px" }}>
                            <Text size="xsmall" color="muted" textAlign="end">
                                {label}
                            </Text>
                        </Box>
                    ))}
                </Box>
            </Box>

            {spec.params.length > 0 && (
                <Box
                    border={{ side: "top", color: "nodeDivider" }}
                    pad={{ horizontal: "small", vertical: "small" }}
                    gap="small"
                >
                    {spec.params.map((p) => (
                        <Box key={p.name} gap="xsmall" align="center">
                            <Box direction="column" align="center" fill="horizontal">
                                <Text size="xsmall" color="muted">
                                    {p.label}
                                </Text>
                                {/* <Text
                                    size="xsmall"
                                    color="accent"
                                    style={{ fontVariantNumeric: "tabular-nums" }}
                                >
                                    {d.params[p.name]?.toFixed(p.step < 1 ? 2 : 0)}
                                </Text> */}
                            </Box>
                            <Knob
                                value={d.params[p.name] ?? p.default}
                                min={p.min}
                                max={p.max}
                                step={p.step}
                                defaultValue={p.default}
                                color={spec.color}
                                label={p.label}
                                onChange={(v) => d.onParamChange(id, p.name, v)}
                            />
                        </Box>
                    ))}
                </Box>
            )}
        </NodeCard>
    );
}