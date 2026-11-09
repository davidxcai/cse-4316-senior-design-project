import type { Prediction } from "../types/sign";
import { ort } from "./ort";
import { FEATURE_DIM, T } from "./preprocess";

export interface SignModel {
  labels: string[];
  /** raw model outputs, one per label (before softmax) */
  logits(input: Float32Array): Promise<Float32Array>;
  predict(input: Float32Array, topK?: number): Promise<Prediction[]>;
}

export async function loadSignModel(): Promise<SignModel> {
  const [session, labels] = await Promise.all([
    ort.InferenceSession.create("/model/sign_gru.onnx"),
    fetch("/model/labels.json").then((r) => r.json() as Promise<string[]>),
  ]);
  const logits = async (input: Float32Array) => {
    const out = await session.run({ x: new ort.Tensor("float32", input, [1, T, FEATURE_DIM]) });
    return out.logits.data as Float32Array;
  };
  return {
    labels,
    logits,
    async predict(input, topK = 5) {
      const raw = await logits(input);
      const max = Math.max(...raw);
      const exps = Array.from(raw, (l) => Math.exp(l - max));
      const sum = exps.reduce((a, b) => a + b, 0);
      return exps
        .map((e, i) => ({ label: labels[i], prob: e / sum }))
        .sort((a, b) => b.prob - a.prob)
        .slice(0, topK);
    },
  };
}
