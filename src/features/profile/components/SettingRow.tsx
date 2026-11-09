import type { ComponentType, ReactNode } from "react";

/** Icon + label + control. Shared by every row in Settings. */
export default function SettingRow({ Icon, label, children }: { Icon: ComponentType<{ size?: number }>; label: string; children: ReactNode }) {
  return (
    <label className="flex items-center gap-3">
      <Icon size={20} />
      <span className="w-20">{label}</span>
      {children}
    </label>
  );
}
