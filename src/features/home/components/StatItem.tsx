import type { Icon } from "@tabler/icons-react";

type Props = { icon: Icon; value: number; label: string; className?: string };

/** Icon + value only. `label` is for screen readers. */
export default function StatItem({ icon: StatIcon, value, label, className }: Props) {
  return (
    <div className="flex items-center gap-1.5 text-lg font-semibold" aria-label={`${label} ${value}`}>
      <StatIcon size={22} className={className} aria-hidden />
      <span>{value}</span>
    </div>
  );
}
