import type { drawDetection } from "../lib/drawLandmarks";
import type { HandshapeModel } from "../lib/handshapeModel";
import type { Landmarkers } from "../lib/landmarkers";
import type { SignModel } from "../lib/signModel";
import { checkMotionLetter } from "../lib/fingerspell/motionLetters";
import { preprocess } from "../lib/preprocess";
import { Segmenter } from "../lib/segmenter";
import type { Frame } from "../types/sign";
import { decideSign, HANDSHAPE_DECISION_DEFAULTS, type SignCandidate } from "./decide";
import {
  RecognizerError,
  type AttemptOptions,
  type AttemptPhase,
  type AttemptRequest,
  type AttemptResult,
  type Item,
  type RecognizerStatus,
  type StartOptions,
} from "./types";
import { handshapeLabelOf, isRecognizable, itemKey, labelsFor, motionLetterOf } from "./vocab";

interface Models {
  landmarkers: Landmarkers;
  sign: SignModel;
  draw: typeof drawDetection;
  handshape: HandshapeModel;
}

interface ActiveAttempt {
  seg: Segmenter;
  phase: AttemptPhase;
  setPhase(p: AttemptPhase): void;
  onClip(frames: Frame[]): void;
}

/** MediaPipe and ONNX are large; load them only when a page first needs the camera, and only once. */
let modelsPromise: Promise<Models> | null = null;
function loadModels(): Promise<Models> {
  modelsPromise ??= Promise.all([
    import("../lib/landmarkers").then((m) => m.createLandmarkers()),
    import("../lib/signModel").then((m) => m.loadSignModel()),
    import("../lib/drawLandmarks").then((m) => m.drawDetection),
    import("../lib/handshapeModel").then((m) => m.loadHandshapeModel()),
  ])
    .then(([landmarkers, sign, draw, handshape]) => ({ landmarkers, sign, draw, handshape }))
    .catch((e) => {
      modelsPromise = null; // allow a retry
      throw new RecognizerError("model-load", "Could not load the recognition models", { cause: e });
    });
  return modelsPromise;
}

function cameraError(e: unknown): RecognizerError {
  const name = e instanceof DOMException ? e.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return new RecognizerError("not-allowed", "Camera permission denied", { cause: e });
  if (name === "NotReadableError" || name === "AbortError") return new RecognizerError("in-use", "Camera is in use by another app", { cause: e });
  return new RecognizerError("not-found", "No usable camera found", { cause: e });
}

/**
 * Open the camera. With a deviceId, require that device; if it is gone (unplugged, or an id from another browser),
 * fall back to the default camera instead of failing.
 */
async function openCamera(deviceId: string | null): Promise<MediaStream> {
  if (!navigator.mediaDevices) throw new RecognizerError("not-found", "This browser has no camera access (needs HTTPS)");
  const base = { width: 640, height: 480 };
  const open = (video: MediaTrackConstraints) => navigator.mediaDevices.getUserMedia({ video, audio: false });
  try {
    return await open(deviceId ? { ...base, deviceId: { exact: deviceId } } : { ...base, facingMode: "user" });
  } catch (e) {
    const gone = e instanceof DOMException && (e.name === "OverconstrainedError" || e.name === "NotFoundError");
    if (!deviceId || !gone) throw cameraError(e);
    return open({ ...base, facingMode: "user" }).catch((e2) => {
      throw cameraError(e2);
    });
  }
}

const abortError = (signal: AbortSignal) => signal.reason ?? new DOMException("Attempt aborted", "AbortError");

/**
 * One per app (see RecognizerProvider). Owns the camera stream, the landmark loop and the models.
 * Landmarks are computed only while an attempt is running or an overlay canvas is set.
 */
export class Recognizer {
  private _status: RecognizerStatus = "idle";
  private _error: RecognizerError | null = null;
  private listeners = new Set<() => void>();

  private video: HTMLVideoElement | null = null;
  /** element the stream should play in (start() may be called again while still loading) */
  private target: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private models: Models | null = null;
  private mirror = false;
  /** camera requested by the caller (null = default); the stream follows it */
  private deviceId: string | null = null;
  private overlay: HTMLCanvasElement | null = null;
  private startPromise: Promise<void> | null = null;
  private generation = 0;
  private raf = 0;
  private lastVideoTime = -1;
  private lastT = 0;
  private active: ActiveAttempt | null = null;
  private cancelActive: (() => void) | null = null;

  get status() {
    return this._status;
  }
  get error() {
    return this._error;
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  };

  private set(status: RecognizerStatus, error: RecognizerError | null = null) {
    this._status = status;
    this._error = error;
    this.listeners.forEach((fn) => fn());
  }

  /**
   * Start the camera into `video` and load the models (first call only). Safe to call again: with a new video
   * element it moves the stream there; with a different deviceId it switches cameras; other options just apply.
   * Rejects with RecognizerError.
   */
  start = (video: HTMLVideoElement, opts: StartOptions): Promise<void> => {
    this.mirror = opts.dominantHand === "left"; // the models are trained mostly on right-handed signers
    this.setOverlay(opts.overlay ?? null);
    this.target = video;
    const deviceId = opts.deviceId ?? null;
    if (this.startPromise) {
      if (deviceId !== this.deviceId) {
        this.deviceId = deviceId;
        this.startPromise = this.switchCamera(this.startPromise, this.generation);
      } else if (this.stream && this.video !== video) void this.attach(video);
      return this.startPromise;
    }
    this.deviceId = deviceId;
    const gen = ++this.generation;
    this.set("loading");
    this.startPromise = (async () => {
      const camera = openCamera(deviceId);
      const [stream, models] = await Promise.all([camera, loadModels()]).catch(async (e) => {
        (await camera.catch(() => null))?.getTracks().forEach((t) => t.stop());
        throw e;
      });
      if (gen !== this.generation) {
        stream.getTracks().forEach((t) => t.stop()); // stop() was called meanwhile
        return;
      }
      this.stream = stream;
      this.models = models;
      await this.attach(this.target!);
      this.loop();
      this.set("ready");
    })().catch((e) => {
      if (gen === this.generation) {
        this.startPromise = null;
        this.set("error", e instanceof RecognizerError ? e : new RecognizerError("model-load", String(e), { cause: e }));
      }
      throw e;
    });
    return this.startPromise;
  };

  /** After `after` settles, replace the stream with one from the current deviceId (attempts wait for it). */
  private switchCamera(after: Promise<void>, gen: number): Promise<void> {
    const p = after.then(async () => {
      if (gen !== this.generation) return;
      const stream = await openCamera(this.deviceId);
      if (gen !== this.generation) return void stream.getTracks().forEach((t) => t.stop());
      this.stream?.getTracks().forEach((t) => t.stop());
      this.stream = stream;
      await this.attach(this.target!);
    });
    p.catch((e) => {
      if (gen === this.generation && this.startPromise === p) {
        this.stop();
        this.set("error", e instanceof RecognizerError ? e : new RecognizerError("not-found", String(e), { cause: e }));
      }
    });
    return p;
  }

  /** Release the camera. Cancels a running attempt. Models stay cached for the next start(). */
  stop = () => {
    this.generation++;
    this.cancelActive?.();
    cancelAnimationFrame(this.raf);
    this.stream?.getTracks().forEach((t) => t.stop());
    if (this.video) this.video.srcObject = null;
    this.setOverlay(null);
    this.stream = null;
    this.video = null;
    this.target = null;
    this.startPromise = null;
    if (this._status !== "idle") this.set("idle");
  };

  /**
   * Wait for the learner to sign once, then judge it. Resolves when one clip has been captured (hands appear, then
   * drop out of view). Rejects with the signal's reason when aborted, and when a newer attempt replaces it.
   * Throws if `expect` is not recognizable (check isRecognizable first).
   */
  attempt = async (req: AttemptRequest, opts: AttemptOptions = {}): Promise<AttemptResult> => {
    if (!isRecognizable(req.expect)) throw new Error(`attempt(): ${itemKey(req.expect)} is not recognizable yet`);
    if (!this.startPromise) throw new Error("attempt(): call start() first");
    await this.startPromise;
    if (this._status !== "ready") throw new DOMException("Recognizer stopped", "AbortError");
    const { signal, onPhase } = opts;
    signal?.throwIfAborted();
    this.cancelActive?.();

    const frames = await new Promise<Frame[]>((resolve, reject) => {
      const attempt: ActiveAttempt = {
        seg: new Segmenter(),
        phase: "waiting",
        setPhase: (p) => {
          if (attempt.phase !== p) onPhase?.((attempt.phase = p));
        },
        onClip: (f) => {
          done();
          resolve(f);
        },
      };
      const onAbort = () => {
        done();
        reject(abortError(signal!));
      };
      const done = () => {
        if (this.active === attempt) {
          this.active = null;
          this.cancelActive = null;
        }
        signal?.removeEventListener("abort", onAbort);
      };
      this.cancelActive = () => {
        done();
        reject(new DOMException("Attempt cancelled", "AbortError"));
      };
      signal?.addEventListener("abort", onAbort, { once: true });
      this.active = attempt;
      onPhase?.("waiting");
    });

    onPhase?.("processing");
    const result = await this.judge(frames, req);
    signal?.throwIfAborted();
    return result;
  };

  private setOverlay(canvas: HTMLCanvasElement | null) {
    if (this.overlay && this.overlay !== canvas) this.overlay.getContext("2d")?.clearRect(0, 0, this.overlay.width, this.overlay.height);
    this.overlay = canvas;
  }

  private async attach(video: HTMLVideoElement) {
    if (this.video && this.video !== video) this.video.srcObject = null;
    this.video = video;
    this.lastVideoTime = -1;
    video.muted = true;
    video.playsInline = true;
    video.srcObject = this.stream;
    try {
      await video.play();
    } catch {
      // autoplay of a muted inline video is allowed; a failure here means the element was detached
    }
  }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    const video = this.video;
    const a = this.active;
    const overlay = this.overlay;
    if ((!a && !overlay) || !video || !this.models || video.readyState < 2 || video.currentTime === this.lastVideoTime) return;
    this.lastVideoTime = video.currentTime;
    const t = Math.max(Math.round(performance.now()), this.lastT + 1); // MediaPipe needs increasing timestamps
    this.lastT = t;
    const det = this.models.landmarkers.detect(video, t, this.mirror);
    if (overlay) {
      if (overlay.width !== video.videoWidth || overlay.height !== video.videoHeight) {
        overlay.width = video.videoWidth;
        overlay.height = video.videoHeight;
      }
      this.models.draw(overlay, det);
    }
    if (!a) return;
    const frame = det.frame;

    const state = a.seg.push(frame);
    if (state === "recording") a.setPhase("recording");
    else if (state === "done") {
      const { frames, enoughHands } = a.seg;
      a.seg.reset();
      if (enoughHands) a.onClip(frames);
      else a.setPhase("waiting"); // a stray detection, keep waiting
    }
  };

  private async judge(frames: Frame[], req: AttemptRequest): Promise<AttemptResult> {
    const { expect } = req;
    const rejected = (reason: AttemptResult["reason"]): AttemptResult => ({ verdict: "rejected", expected: expect, predicted: null, confidence: 0, reason });

    const v = this.video;
    const aspect = v && v.videoHeight ? v.videoWidth / v.videoHeight : 4 / 3;
    const { sign, handshape } = this.models!;
    const candidates = (indicesOf: (item: Item) => number[]) => {
      const cand = (item: Item): SignCandidate | null => {
        const indices = indicesOf(item).filter((i) => i >= 0);
        return indices.length ? { item, indices } : null;
      };
      const expected = cand(expect);
      if (!expected) throw new Error(`attempt(): the loaded model has no label for ${itemKey(expect)}`);
      return { expected, allowed: (req.allowed ?? []).map(cand).filter((c): c is SignCandidate => c !== null) };
    };

    // J, Z: handshape + traced path
    const letter = motionLetterOf(expect);
    if (letter) {
      const check = checkMotionLetter(frames, letter, aspect);
      if (check.verdict === "no-hand") return rejected("no-hand");
      if (check.verdict !== "ok") return { verdict: "wrong", expected: expect, predicted: null, confidence: 0, reason: check.verdict };
      // pathCost <= maxPathCost (0.2) when ok; map 0 -> 1, 0.2 -> 0.5
      return { verdict: "correct", expected: expect, predicted: expect, confidence: Math.max(0, 1 - check.pathCost / 0.4) };
    }

    // other letters and digits 0-9: static handshape, judged against the allowed letters/digits only
    if (expect.kind !== "sign") {
      const logp = await handshape.clipLogProbs(frames, aspect);
      if (!logp) return rejected("no-hand");
      const { expected, allowed } = candidates((item) => {
        const l = handshapeLabelOf(item);
        return l === undefined ? [] : [handshape.labels.indexOf(l)];
      });
      return decideSign(logp, expected, allowed, HANDSHAPE_DECISION_DEFAULTS);
    }

    // signs
    const input = preprocess(frames);
    if (!input) return rejected("no-hand");
    const { expected, allowed } = candidates((item) => (item.kind === "sign" ? labelsFor(item.gloss).map((l) => sign.labels.indexOf(l)) : []));
    return decideSign(await sign.logits(input), expected, allowed);
  }
}
