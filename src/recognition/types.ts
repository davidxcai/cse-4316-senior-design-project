/** Public types of the recognition API (see index.ts). Field names are a contract with the UI; change with care. */

/** Something a learner can be asked to produce. */
export type Item =
  | { kind: "sign"; gloss: string }
  | { kind: "letter"; char: string }
  | { kind: "number"; value: number };

export type DominantHand = "left" | "right";

export interface StartOptions {
  dominantHand: DominantHand;
  /**
   * Canvas to draw the tracked hands on, every frame. It is sized to the video's pixels, so lay it exactly over the
   * <video> with the same object-fit and the same CSS mirroring. Omit or pass null to stop drawing and clear it.
   */
  overlay?: HTMLCanvasElement | null;
  /**
   * Camera to use (MediaDeviceInfo.deviceId from navigator.mediaDevices.enumerateDevices()). Omit or null = default.
   * If the device is gone, the default camera is used instead. A different id on a later start() switches cameras.
   */
  deviceId?: string | null;
}

export interface AttemptRequest {
  /** what the learner was asked to sign */
  expect: Item;
  /**
   * the lesson/game subset the answer is judged against (expect is always added). Signs outside this list never
   * come back as `predicted`; a clip that looks like none of them is `rejected`. Omitted = just `[expect]`.
   */
  allowed?: Item[];
}

/** waiting = camera ready, no hands yet; recording = capturing the attempt; processing = judging it */
export type AttemptPhase = "waiting" | "recording" | "processing";

export interface AttemptOptions {
  signal?: AbortSignal;
  onPhase?: (phase: AttemptPhase) => void;
}

/**
 * Why an attempt was rejected or judged wrong.
 *  out-of-set       the clip resembles none of the allowed items (rejected)
 *  unsure           it resembles several allowed items about equally (rejected)
 *  no-hand          no usable hand was tracked (rejected)
 *  wrong-handshape  J/Z: the handshape was never held (wrong)
 *  no-motion        J/Z: the hand did not trace the letter (wrong; e.g. a static I)
 *  wrong-path       J/Z: the hand moved, but not in the letter's shape (wrong)
 */
export type AttemptReason = "out-of-set" | "unsure" | "no-hand" | "wrong-handshape" | "no-motion" | "wrong-path";

export interface AttemptResult {
  /** correct = it was `expected`; wrong = it was confidently something else; rejected = no confident answer */
  verdict: "correct" | "wrong" | "rejected";
  expected: Item;
  /** best match among the allowed items; null when rejected or when the checker cannot name an alternative */
  predicted: Item | null;
  /** 0..1, how sure the recognizer is of `predicted` (or of `expected` for J/Z). Not calibrated yet; don't gate mastery on it. */
  confidence: number;
  reason?: AttemptReason;
}

export type RecognizerErrorCode = "not-found" | "not-allowed" | "in-use" | "model-load";

export class RecognizerError extends Error {
  readonly code: RecognizerErrorCode;
  constructor(code: RecognizerErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "RecognizerError";
    this.code = code;
  }
}

/** idle = not started; loading = camera/models starting; ready = attempts can run; error = see `error` */
export type RecognizerStatus = "idle" | "loading" | "ready" | "error";
