import { useCallback, useEffect, useState } from "react";
import { useSignCamera } from "../../../hooks/useSignCamera";
import { isRecognizable } from "../../../recognition";
import type { AttemptPhase, AttemptResult } from "../../../recognition";
import { HELLO } from "../tryItConfig";

/** State machine of the landing "try it" demo. Nothing loads until `camera.startCamera` is called. */
export function useTryItDemo() {
  const camera = useSignCamera();
  const { status, attempt } = camera;
  const [phase, setPhase] = useState<AttemptPhase | null>(null);
  const [verdict, setVerdict] = useState<AttemptResult["verdict"] | null>(null);
  const canRecognize = isRecognizable(HELLO);

  const retry = useCallback(() => setVerdict(null), []);

  // one attempt per pass; a verdict ends it, retry() clears the verdict and the effect runs again
  useEffect(() => {
    if (status !== "ready" || !canRecognize || verdict) return;
    const ac = new AbortController();
    attempt({ expect: HELLO }, { signal: ac.signal, onPhase: setPhase })
      .then((r) => setVerdict(r.verdict))
      .catch((e: unknown) => {
        if ((e as Error).name !== "AbortError") throw e;
      });
    return () => {
      ac.abort();
      setPhase(null);
    };
  }, [status, canRecognize, verdict, attempt]);

  return { camera, phase, verdict, canRecognize, retry };
}
