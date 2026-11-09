import { IconList } from "@tabler/icons-react";

type Props = { expanded: boolean; onToggle: () => void };

export default function ViewAllToggle({ expanded, onToggle }: Props) {
  return (
    <button type="button" className={`btn btn-sm ${expanded ? "btn-active" : "btn-ghost"}`} aria-pressed={expanded} onClick={onToggle}>
      <IconList size={18} />
      All
    </button>
  );
}
