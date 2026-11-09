import { IconCheck } from "@tabler/icons-react";
import type { WeekDay } from "../../../domain/streak";

const LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

function dayClass(d: WeekDay) {
  if (d.done && d.isToday) return "bg-primary text-primary-content ring-2 ring-primary ring-offset-2 ring-offset-base-100";
  if (d.done) return "bg-primary text-primary-content";
  if (d.isToday) return "border-2 border-primary text-primary";
  if (d.isFuture) return "bg-base-200 text-base-content/30";
  return "bg-base-200 text-base-content/60";
}

export default function WeekStrip({ week }: { week: WeekDay[] }) {
  return (
    <ol className="flex gap-3">
      {week.map((d, i) => (
        <li key={d.date} className="flex flex-col items-center gap-1.5">
          <span className="text-xs font-semibold text-base-content/60">{LETTERS[i]}</span>
          <span
            className={`flex size-8 items-center justify-center rounded-full ${dayClass(d)}`}
            aria-current={d.isToday ? "date" : undefined}
            aria-label={d.date}
          >
            {d.done && <IconCheck size={16} stroke={3} />}
          </span>
        </li>
      ))}
    </ol>
  );
}
