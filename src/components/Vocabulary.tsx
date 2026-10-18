export function Vocabulary({ labels }: { labels: string[] }) {
  return (
    <div className="collapse collapse-arrow bg-base-100 border border-base-300">
      <input type="checkbox" />
      <div className="collapse-title font-semibold">Vocabulary ({labels.length} signs)</div>
      <div className="collapse-content flex flex-wrap gap-1">
        {labels.map((l) => (
          <span key={l} className="badge badge-outline">{l.toLowerCase()}</span>
        ))}
      </div>
    </div>
  );
}
