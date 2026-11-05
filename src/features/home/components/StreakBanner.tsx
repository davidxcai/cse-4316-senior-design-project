import { IconFlame, IconStar } from "@tabler/icons-react";
import { useStreak } from "../../../hooks/useStreak";
import HomeError from "./HomeError";
import ResumeButton from "./ResumeButton";
import StatItem from "./StatItem";
import WeekStrip from "./WeekStrip";

export default function StreakBanner() {
  const { data, isPending, error } = useStreak();

  if (error) return <HomeError />;
  if (isPending || !data) return <div className="skeleton h-36 w-full" />;

  return (
    <div className="card card-border bg-base-100">
      <div className="card-body gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <WeekStrip week={data.week} />
          <div className="flex items-center gap-5">
            <StatItem icon={IconFlame} value={data.current} label="Current streak" className="text-warning" />
            <StatItem icon={IconStar} value={data.best} label="Best streak" className="text-primary" />
          </div>
        </div>
        <div className="card-actions justify-end">
          <ResumeButton />
        </div>
      </div>
    </div>
  );
}
