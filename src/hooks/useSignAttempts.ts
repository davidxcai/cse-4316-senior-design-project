import { useEffect, useRef, useState } from "react";
import { itemKey } from "../domain/signContent";
import type { AttemptVerdict } from "../domain/lessonSession";
import type { SignCamera } from "./useSignCamera";
import type { AttemptPhase, Item } from "../recognition";

/** How long a verdict stays on screen before the next attempt starts. */
const FEEDBACK_MS = 1200;

type Args = {
  camera: SignCamera;
  /** null = nothing to judge (watch-only card); no attempts run */
  task: { item: Item; allowed: Item[] } | null;
  /** attempts loop while true; false stops after the current verdict */
  active: boolean;
  onResult: (verdict: AttemptVerdict) => void;
};

/**
 * Runs recognizer attempts back to back for the current item while the camera is ready: attempt, show the verdict
 * for FEEDBACK_MS, start the next one. There is no Retry: the learner just signs again. Survives item changes without
 * restarting the camera.
 */
export function useSignAttempts({ camera, task, active, onResult }: Args) {
  const { status, attempt } = camera;
  const key = task ? itemKey(task.item) : null;
  const [phase, setPhase] = useState<AttemptPhase | null>(null);
  const [shown, setShown] = useState<{ key: string; verdict: AttemptVerdict } | null>(null);
  const [round, setRound] = useState(0);
  // latest callback/task live in refs so a new object for the same item never restarts an attempt mid-recording
  const onResultRef = useRef(onResult);
  const taskRef = useRef(task);
  useEffect(() => {
    onResultRef.current = onResult;
    taskRef.current = task;
  });

  useEffect(() => {
    const t = taskRef.current;
    if (status !== "ready" || !active || !t || !key) return;
    const ac = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    attempt({ expect: t.item, allowed: t.allowed }, { signal: ac.signal, onPhase: setPhase })
      .then((r) => {
        setPhase(null);
        setShown({ key, verdict: r.verdict });
        onResultRef.current(r.verdict);
        timer = setTimeout(() => {
          setShown(null);
          setRound((n) => n + 1);
        }, FEEDBACK_MS);
      })
      .catch((e: unknown) => {
        if ((e as Error).name !== "AbortError") throw e;
      });
    return () => {
      ac.abort();
      clearTimeout(timer);
      setPhase(null);
    };
  }, [status, active, key, round, attempt]);

  return { phase, verdict: shown && shown.key === key ? shown.verdict : null };
}
