import StreakBanner from "./components/StreakBanner";
import UnitList from "./components/UnitList";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      <StreakBanner />
      <UnitList />
    </div>
  );
}
