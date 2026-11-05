import type { Item } from "../../recognition";

/** The one sign the landing demo teaches and checks. */
export const HELLO: Item = { kind: "sign", gloss: "HELLO" };

/** Reference clip for LearnCard: a YouTube video of a fluent signer, plus start/end seconds. */
export interface LearnClip {
  videoId: string | null;
  start: number;
  end: number;
}

// TODO: fluent-signer HELLO clip
export const HELLO_CLIP: LearnClip = { videoId: null, start: 0, end: 0 };
