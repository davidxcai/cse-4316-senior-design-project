import { IconCheck, IconRotate, IconX } from "@tabler/icons-react";
import type { AttemptResult } from "../../recognition";

/** ✓ / ✗, or a neutral try-again icon when the recognizer couldn't decide [S.19]. */
export default function VerdictIcon({ verdict }: { verdict: AttemptResult["verdict"] }) {
  if (verdict === "correct")
    return <IconCheck size={40} className="rounded-full bg-success p-2 text-success-content" aria-label="correct" />;
  if (verdict === "wrong")
    return <IconX size={40} className="rounded-full bg-error p-2 text-error-content" aria-label="incorrect" />;
  return <IconRotate size={40} className="rounded-full bg-neutral p-2 text-neutral-content" aria-label="try again" />;
}
