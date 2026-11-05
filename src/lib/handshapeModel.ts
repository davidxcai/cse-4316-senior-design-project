import { clipFeatures, HANDSHAPE_DIM, meanLogProbs } from "./fingerspell/handshape";
import type { Frame } from "../types/sign";
import { ort } from "./ort";

export interface HandshapeModel {
  labels: string[];
  /** log of the clip-averaged class probabilities, or null if no hand was seen */
  clipLogProbs(frames: Frame[], aspect: number): Promise<Float32Array | null>;
}

export async function loadHandshapeModel(): Promise<HandshapeModel> {
  const [session, labels] = await Promise.all([
    ort.InferenceSession.create("/model/handshape.onnx"),
    fetch("/model/handshape_labels.json").then((r) => r.json() as Promise<string[]>),
  ]);
  return {
    labels,
    async clipLogProbs(frames, aspect) {
      const f = clipFeatures(frames, aspect);
      if (!f) return null;
      const out = await session.run({ x: new ort.Tensor("float32", f.data, [f.n, HANDSHAPE_DIM]) });
      return meanLogProbs(out.logits.data as Float32Array, f.n, labels.length);
    },
  };
}
