import { useAuth } from "../../hooks/useAuth";
import StreakBanner from "./components/StreakBanner";
import UnitList from "./components/UnitList";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col gap-8">
      {user && <h1 className="text-2xl font-bold">Welcome back, {user.name}!</h1>}
      <StreakBanner />
      <UnitList />
    </div>
  );
}
