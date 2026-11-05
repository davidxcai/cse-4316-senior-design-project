/**
 * Recognition API for lessons and games. The UI imports only from here.
 *
 *   <RecognizerProvider> at the app root
 *   const { status, error, start, stop, attempt } = useRecognizer()
 *   await start(videoEl, { dominantHand: "right" })          // camera + models, on demand
 *   const r = await attempt({ expect, allowed }, { signal, onPhase })
 *   r.verdict: "correct" | "wrong" | "rejected"
 *   isRecognizable(item)                                      // sync; false = skip the produce step
 */
export { RecognizerProvider, useRecognizer } from "./context";
export { isRecognizable } from "./vocab";
export { RecognizerError } from "./types";
export type {
  AttemptOptions,
  AttemptPhase,
  AttemptReason,
  AttemptRequest,
  AttemptResult,
  DominantHand,
  Item,
  RecognizerErrorCode,
  RecognizerStatus,
  StartOptions,
} from "./types";
