import { IconSettings } from "@tabler/icons-react";
import SignOutButton from "../auth/SignOutButton";
import CameraSelect from "./components/CameraSelect";
import HandSelect from "./components/HandSelect";
import ProfileHeader from "./components/ProfileHeader";
import ResetProgress from "./components/ResetProgress";

export default function ProfilePage() {
  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <ProfileHeader />
      {/* TODO: R.3 StatsRow, needs progress tables */}
      <section className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <IconSettings size={20} />
          Settings
        </h2>
        <CameraSelect />
        <HandSelect />
        <ResetProgress />
      </section>
      <div>
        <SignOutButton />
      </div>
    </div>
  );
}
