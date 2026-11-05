import { unitStyle } from "../unitStyle";

export default function UnitTile({ unitId }: { unitId: number }) {
  const { icon: TileIcon, tile } = unitStyle(unitId);
  return (
    <div className={`flex size-16 shrink-0 flex-col items-center justify-center rounded-box ${tile}`}>
      <span className="text-xs font-semibold opacity-80">{String(unitId).padStart(2, "0")}</span>
      <TileIcon size={26} aria-hidden />
    </div>
  );
}
