import {
  IconHandStop,
  IconHome,
  IconId,
  IconRun,
  IconBook2,
  IconUsers,
  type Icon,
} from "@tabler/icons-react";

type UnitStyle = { icon: Icon; tile: string; bar: string };

// Full class strings so Tailwind can see them. daisyUI theme colors only.
export const UNIT_STYLES: Record<number, UnitStyle> = {
  1: { icon: IconHandStop, tile: "bg-primary text-primary-content", bar: "progress-primary" },
  2: { icon: IconId, tile: "bg-secondary text-secondary-content", bar: "progress-secondary" },
  3: { icon: IconHome, tile: "bg-accent text-accent-content", bar: "progress-accent" },
  4: { icon: IconUsers, tile: "bg-info text-info-content", bar: "progress-info" },
  5: { icon: IconRun, tile: "bg-success text-success-content", bar: "progress-success" },
  6: { icon: IconBook2, tile: "bg-warning text-warning-content", bar: "progress-warning" },
};

export const FALLBACK_UNIT_STYLE: UnitStyle = UNIT_STYLES[1];

export const unitStyle = (unitId: number): UnitStyle => UNIT_STYLES[unitId] ?? FALLBACK_UNIT_STYLE;
