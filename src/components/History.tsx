import type { HistoryItem } from "../hooks/useSignRecognizer";

export function History({ items }: { items: HistoryItem[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="list">
      {items.map((it) => (
        <li key={it.id} className="list-row items-center">
          <span className="badge badge-primary badge-lg">{it.top[0].label.toLowerCase()}</span>
          <span className="list-col-grow text-sm text-base-content/60">
            {(it.top[0].prob * 100).toFixed(0)}% · also: {it.top.slice(1, 3).map((p) => p.label.toLowerCase()).join(", ")}
          </span>
        </li>
      ))}
    </ul>
  );
}
