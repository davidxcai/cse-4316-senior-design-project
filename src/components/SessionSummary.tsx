import type { ReactNode } from "react";
import { IconCircleCheck, type Icon } from "@tabler/icons-react";
import StatItem from "./StatItem";

export type SummaryStat = { icon: Icon; value: string | number; label: string };

/** Big ✓, a title, stats as icon + value, and the actions [S.27–29, P.9]. Shared by LessonComplete and PracticeSummary. */
export default function SessionSummary({ title, stats, children }: { title: ReactNode; stats: SummaryStat[]; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <IconCircleCheck size={80} className="text-success" aria-hidden />
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="flex flex-wrap justify-center gap-6">
        {stats.map((stat) => (
          <StatItem key={stat.label} {...stat} />
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-3">{children}</div>
    </div>
  );
}
