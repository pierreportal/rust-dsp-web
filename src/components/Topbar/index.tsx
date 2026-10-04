import { Box, Button, Header, Select, Text } from "grommet";
import { Share, StatusCritical, StatusGood, StatusUnknown, StatusWarning } from "grommet-icons";
import {
    MIDI_ALL_INPUTS,
    midiManager,
    type MIDIStatus,
} from "../../MIDI/midiManager";
import { useMIDIActive, useMIDIState } from "../../MIDI/useMIDI";

interface ITopbarProps {
    ready: boolean;
    running: boolean;
    linkCopied: boolean;
    onShareLink: () => void;
}

type StatusColor = "accent" | "muted" | "warning" | "critical";

const STATUS_META: Record<MIDIStatus, { label: string; color: StatusColor; Icon: typeof StatusGood }> = {
    "unsupported": { label: "MIDI unsupported", color: "muted", Icon: StatusUnknown },
    "denied": { label: "MIDI blocked", color: "critical", Icon: StatusCritical },
    "idle": { label: "MIDI idle", color: "muted", Icon: StatusUnknown },
    "no-devices": { label: "no MIDI device", color: "warning", Icon: StatusWarning },
    "ready": { label: "MIDI ready", color: "accent", Icon: StatusGood },
};

const ACCENT = "rgb(111, 255, 176)";

const ActivityLed = ({ active }: { active: boolean }) => (
    <Box
        width="8px"
        height="8px"
        round="full"
        flex={false}
        background={active ? ACCENT : "transparent"}
        style={{
            border: `1px solid ${active ? ACCENT : "#8f88a3"}`,
            opacity: active ? 1 : 0.4,
            transition: "background 80ms linear",
        }}
    />
);

const MIDIControl = () => {
    const { status, devices, selectedId } = useMIDIState();
    const active = useMIDIActive();
    const { label, color, Icon } = STATUS_META[status];

    const options = [
        { label: "All inputs", value: MIDI_ALL_INPUTS },
        ...devices.map((d) => ({
            label: d.manufacturer ? `${d.name} (${d.manufacturer})` : d.name,
            value: d.id,
        })),
    ];

    return (
        <Box direction="row" align="center" gap="small" flex={false}>
            <ActivityLed active={active} />
            <Icon size="small" color={color} />
            <Text size="small" color="muted">
                {label}
            </Text>
            <Select
                size="small"
                disabled={status !== "ready" && status !== "no-devices"}
                options={options}
                value={selectedId}
                onChange={(e) => midiManager.setSelectedId(e.option.value as string)}
                aria-label="MIDI input"
            />
        </Box>
    );
};

export const Topbar = ({ ready, running, linkCopied, onShareLink }: ITopbarProps) => {
    const Status = ready ? StatusGood : StatusUnknown;
    const audioLabel = !ready
        ? "starting…"
        : running
            ? "audio running"
            : "click to start audio";
    return (
        <Header
            background="panel"
            border={{ side: "bottom", color: "border" }}
            pad={{ horizontal: "16px", vertical: "xsmall" }}
            flex={false}
        >
            <Box direction="row" align="center" justify="between" gap="medium" width="100%">
                <Text weight="bold" size="medium">
                    COARSE
                </Text>
                <Box direction="row" align="center" gap="medium" flex={false}>
                    <Box direction="row" align="center" gap="small" flex={false}>
                        <Status size="small" color={running ? "accent" : "muted"} />
                        <Text size="small" color="muted">
                            {audioLabel}
                        </Text>
                    </Box>
                    <MIDIControl />
                    <Button
                        size="small"
                        label={linkCopied ? "Link copied" : "Share link"}
                        icon={<Share size="small" />}
                        onClick={onShareLink}
                        disabled={!ready}
                        title="Put this patch in the address bar and copy the link"
                        hoverIndicator={{ color: "panelHover" }}
                        focusIndicator={false}
                    />
                </Box>
            </Box>
        </Header>
    );
};
