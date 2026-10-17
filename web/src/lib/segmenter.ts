import type { Frame } from "../types/sign";

const END_GAP_MS = 700; // no hands for this long = the sign is over
const MAX_MS = 6000; // safety cut-off
const MIN_HAND_FRAMES = 8; // fewer than this is a stray detection, not a sign

export type SegmentState = "idle" | "recording" | "done";

/** Cuts the continuous webcam stream into isolated-sign clips: starts when a hand appears, ends when hands drop out. */
export class Segmenter {
  frames: Frame[] = [];
  private lastHandT = 0;
  private startT = 0;
  private handFrames = 0;

  get recording() {
    return this.frames.length > 0;
  }

  get enoughHands() {
    return this.handFrames >= MIN_HAND_FRAMES;
  }

  push(f: Frame): SegmentState {
    const hasHand = f.hands[0] !== null || f.hands[1] !== null;
    if (!this.recording) {
      if (!hasHand) return "idle";
      this.startT = f.t;
    }
    this.frames.push(f);
    if (hasHand) {
      this.lastHandT = f.t;
      this.handFrames++;
    }
    return f.t - this.lastHandT > END_GAP_MS || f.t - this.startT > MAX_MS ? "done" : "recording";
  }

  reset() {
    this.frames = [];
    this.handFrames = 0;
  }
}
