import { IconDots, IconHandStop } from "@tabler/icons-react";
import type { AttemptPhase } from "../../recognition";

/** S.18: Ready (waiting for hands) → Watching (signing) → Checking (processing). Words are user-specified. */
export default function PhaseCue({ phase }: { phase: AttemptPhase }) {
  return (
    <div className="flex items-center gap-2 rounded-box bg-base-100/80 px-3 py-1 text-sm" role="status">
      {phase === "waiting" && <IconHandStop size={16} aria-hidden />}
      {phase === "recording" && <span className="status status-error animate-pulse" aria-hidden />}
      {phase === "processing" && <IconDots size={16} aria-hidden />}
      {phase === "waiting" ? "Ready" : phase === "recording" ? "Watching" : "Checking"}
    </div>
  );
}
