import type { Prediction } from "../types/sign";

export function Predictions({ top, live }: { top: Prediction[] | null; live: boolean }) {
  if (!top) return <p className="text-base-content/60">Sign something, then drop your hands. The result appears here.</p>;
  return (
    <ul className="flex flex-col gap-2">
      {top.map((p, i) => (
        <li key={p.label} className="flex items-center gap-3">
          <span className={`w-28 truncate text-right ${i === 0 ? "font-bold" : ""}`}>{p.label.toLowerCase()}</span>
          <progress className={`progress flex-1 ${i === 0 ? (live ? "progress-warning" : "progress-success") : ""}`} value={p.prob * 100} max={100} />
          <span className="w-12 text-sm tabular-nums">{(p.prob * 100).toFixed(0)}%</span>
        </li>
      ))}
    </ul>
  );
}
