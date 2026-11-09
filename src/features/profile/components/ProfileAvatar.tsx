import { initials } from "../../../domain/initials";

// Same look as the sidebar UserCard avatar.

export default function ProfileAvatar({ name }: { name: string }) {
  return (
    <div className="avatar avatar-placeholder">
      <div className="w-16 rounded-full bg-neutral text-neutral-content">
        <span className="text-xl">{initials(name)}</span>
      </div>
    </div>
  );
}
