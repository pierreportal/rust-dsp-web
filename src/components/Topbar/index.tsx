import { AppStatus, AppTopbar, Title } from "./styles";

interface ITopbarProps {
    ready: boolean;
}

export const Topbar = ({ ready }: ITopbarProps) => {
    return (
        <AppTopbar>
            <Title>rust-dsp modular</Title>
            <AppStatus>{ready ? "audio ready" : "starting…"}</AppStatus>
        </AppTopbar>
    )
}