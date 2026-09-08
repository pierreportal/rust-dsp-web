import { Box, Button, Text } from "grommet";
import { NODE_SPECS, PALETTE_ORDER, type KindCode } from "../../audio/nodeSpec";
interface Props {
  onAdd: (kind: KindCode) => void;
}

export function Palette({ onAdd }: Props) {
  return (
    <Box
      width="140px"
      flex={{ shrink: 0 }}
      background="panel"
      border={{ side: "right", color: "border" }}
      pad="xsmall"
      gap="xxsmall"
      overflow="auto"
    >
      <Text
        size="small"
        weight="bold"
        color="muted"
        style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}
      >
        Modules
      </Text>


      {PALETTE_ORDER.map((kind) => {
        const spec = NODE_SPECS[kind];
        return (
          <Button
            key={kind}
            onClick={() => onAdd(kind)}
            hoverIndicator={{ color: "panelHover" }}
            focusIndicator={false}
            title={`Add ${spec.label}`}
            style={{ borderLeft: `3px solid ${spec.color}` }}
          >
            <Box
              direction="row"
              align="center"
              gap="small"
              fill="horizontal"
              pad={{ horizontal: "small", vertical: "8px" }}
            >
              <Text size="small">
                {spec.label}</Text>
            </Box>
          </Button>
        );
      })}
    </Box>
  );
}