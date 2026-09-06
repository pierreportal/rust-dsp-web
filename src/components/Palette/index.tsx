import { NODE_SPECS, PALETTE_ORDER, type KindCode } from "../../audio/nodeSpec";
import { PaletteContainer, PaletteItem, PaletteTitle } from "./styles";

interface Props {
  onAdd: (kind: KindCode) => void;
}

export function Palette({ onAdd }: Props) {
  return (
    <PaletteContainer>
      <PaletteTitle>Modules</PaletteTitle>
      {PALETTE_ORDER.map((kind) => {
        const spec = NODE_SPECS[kind];
        return (
          <PaletteItem key={kind} $color={spec.color} onClick={() => onAdd(kind)}>
            {spec.label}
          </PaletteItem>
        );
      })}
    </PaletteContainer>
  );
}