import { useEffect, useRef } from "react";

import { colors } from "../../theme";
import { KnobContainer } from "./styles";

const SIZE = 48;
const C = 24;
const R_TRACK = 20;
const R_BODY = 13;
const R_IND = 10;
// const R_TICK_IN = 16.5;
// const R_TICK_OUT = 18.5;

// 270-degree sweep clockwise from ~7 o'clock to ~5 o'clock (0 = 12 o'clock).
const START = -135;
const SWEEP = 270;
const ANGLE_PER_PX = 1.2;

/** Clock-face polar coords (0 = up, positive = clockwise in screen space). */
function pt(r: number, a: number): { x: number; y: number } {
  const rad = (a * Math.PI) / 180;
  return { x: C + r * Math.sin(rad), y: C - r * Math.cos(rad) };
}

function arcPath(r: number, a0: number, a1: number): string {
  const large = a1 - a0 > 180 ? 1 : 0;
  const s = pt(r, a0);
  const e = pt(r, a1);
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

// const TICKS = Array.from({ length: 9 }, (_, i) => -135 + i * (SWEEP / 8));

interface KnobProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  color?: string;
  label?: string;
  onChange: (value: number) => void;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const normalize = (v: number, min: number, max: number) =>
  max > min ? clamp((v - min) / (max - min), 0, 1) : 0;

export function Knob({
  value,
  min,
  max,
  step,
  defaultValue,
  label,
  onChange,
}: KnobProps) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; startPct: number } | null>(null);

  const snap = (v: number) => {
    if (step && step > 0) {
      return clamp(Math.round((v - min) / step) * step + min, min, max);
    }
    return clamp(v, min, max);
  };
  const commit = (v: number) => onChange(snap(v));

  const stepAmount =
    step && step > 0 ? step : (max - min) / 100 || 0.01;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      commit(value + (e.deltaY < 0 ? stepAmount : -stepAmount));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, min, max, stepAmount]);

  const pct = normalize(value, min, max);
  const angle = START + pct * SWEEP;
  const ind = pt(R_IND, angle);

  const d = pct <= 0.0001 ? "" : arcPath(R_TRACK, START, angle);

  return (
    <KnobContainer
      ref={ref}
      role="slider"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={String(value)}
      tabIndex={0}
      style={{ width: SIZE, height: SIZE }}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        drag.current = { startY: e.clientY, startPct: pct };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        const deg = (drag.current.startY - e.clientY) * ANGLE_PER_PX;
        const nextPct = clamp(drag.current.startPct + deg / SWEEP, 0, 1);
        commit(min + nextPct * (max - min));
      }}
      onPointerUp={(e) => {
        drag.current = null;
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
      onPointerCancel={(e) => {
        drag.current = null;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      }}
      onDoubleClick={() => {
        if (defaultValue !== undefined) commit(defaultValue);
      }}
      onKeyDown={(e) => {
        const key = e.key;
        let next: number | null = null;
        if (key === "ArrowUp" || key === "ArrowRight") next = value + stepAmount;
        else if (key === "ArrowDown" || key === "ArrowLeft") next = value - stepAmount;
        else if (key === "Home") next = min;
        else if (key === "End") next = max;
        if (next !== null) {
          e.preventDefault();
          commit(next);
        }
      }}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* {TICKS.map((a) => {
          const p0 = pt(R_TICK_IN, a);
          const p1 = pt(R_TICK_OUT, a);
          return (
            <line
              key={a}
              x1={p0.x}
              y1={p0.y}
              x2={p1.x}
              y2={p1.y}
              stroke={colors.muted}
              strokeOpacity="0.55"
              strokeWidth="1"
            />
          );
        })} */}
        {/* <circle
          cx={C}
          cy={C}
          r={R_TRACK}
          fill="none"
          stroke={colors.nodeBorder}
          strokeWidth="0"
        /> */}
        {d && (
          <path
            d={d}
            fill="none"
            stroke={colors.accent}
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}
        <circle cx={C} cy={C} r={R_BODY} fill="#191624" stroke={colors.nodeBorder} strokeWidth="1" />
        <line
          x1={C}
          y1={C}
          x2={ind.x}
          y2={ind.y}
          stroke="#f2f2f2"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </KnobContainer>
  );
}