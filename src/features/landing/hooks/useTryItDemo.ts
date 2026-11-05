import { useCallback, useEffect, useRef, useState } from "react";
import { useCameraPreference } from "../../../hooks/useCameraPreference";
import { isRecognizable, useRecognizer } from "../../../recognition";
import type { AttemptPhase, AttemptResult } from "../../../recognition";
import { HELLO } from "../tryItConfig";

/** State machine of the landing "try it" demo. Nothing loads until `startCamera` is called. */
export function useTryItDemo() {
  const { status, error, start, stop, attempt } = useRecognizer();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<AttemptPhase | null>(null);
  const [verdict, setVerdict] = useState<AttemptResult["verdict"] | null>(null);
  const [deviceId] = useCameraPreference();
  const canRecognize = isRecognizable(HELLO);

  const startCamera = useCallback(() => {
    if (videoRef.current) start(videoRef.current, { dominantHand: "right", overlay: canvasRef.current, deviceId }).catch(() => {}); // surfaces via `error`
  }, [start, deviceId]);

  const retry = useCallback(() => setVerdict(null), []);

  useEffect(() => stop, [stop]);

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

  return { videoRef, canvasRef, status, error, phase, verdict, canRecognize, startCamera, retry };
}
