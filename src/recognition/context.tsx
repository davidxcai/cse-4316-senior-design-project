import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { Recognizer } from "./recognizer";

const RecognizerContext = createContext<Recognizer | null>(null);

/** Wrap the app once. All pages share one camera stream and one set of loaded models. */
export function RecognizerProvider({ children }: { children: ReactNode }) {
  const [recognizer] = useState(() => new Recognizer());
  useEffect(() => () => recognizer.stop(), [recognizer]);
  return <RecognizerContext.Provider value={recognizer}>{children}</RecognizerContext.Provider>;
}

/**
 * The shared recognizer: `status`/`error` re-render the component on change; `start`, `stop`, `attempt` are stable.
 * Typical use: start(videoEl, { dominantHand }) when the practice view mounts, then attempt({ expect, allowed }).
 */
export function useRecognizer() {
  const r = useContext(RecognizerContext);
  if (!r) throw new Error("useRecognizer() needs a <RecognizerProvider> above it");
  const status = useSyncExternalStore(r.subscribe, () => r.status);
  const error = useSyncExternalStore(r.subscribe, () => r.error);
  return { status, error, start: r.start, stop: r.stop, attempt: r.attempt };
}
