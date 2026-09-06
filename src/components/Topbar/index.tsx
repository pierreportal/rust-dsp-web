import { Box, Header, Text } from "grommet";
import { StatusGood, StatusUnknown } from "grommet-icons";

interface ITopbarProps {
    ready: boolean;
}

export const Topbar = ({ ready }: ITopbarProps) => {
    const Status = ready ? StatusGood : StatusUnknown;
    return (
        <Header
            background="panel"
            border={{ side: "bottom", color: "border" }}
            pad={{ horizontal: "medium", vertical: "small" }}
            flex={false}
        >
            <Text weight="bold" size="medium">
                rust-dsp modular
            </Text>
            <Box direction="row" align="center" gap="small">
                <Status size="small" color={ready ? "accent" : "muted"} />
                <Text size="small" color="muted">
                    {ready ? "audio ready" : "starting…"}
                </Text>
            </Box>
        </Header>
    );
};