import type { ReactNode } from "react";
import type { Icon } from "@tabler/icons-react";

/** Icon + a few words for not-found / error / empty states. Optional action below. */
export default function Notice({ icon: NoticeIcon, text, children }: { icon: Icon; text: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-base-content/70" role="status">
      <NoticeIcon size={48} aria-hidden />
      <span className="text-lg font-semibold">{text}</span>
      {children}
    </div>
  );
}
