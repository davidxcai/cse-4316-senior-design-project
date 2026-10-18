import * as ort from "onnxruntime-web/wasm";
import type { Prediction } from "../types/sign";
import { FEATURE_DIM, T } from "./preprocess";

// Absolute URL so Vite doesn't try to transform the dynamic import of the .mjs in public/
ort.env.wasm.wasmPaths = `${window.location.origin}/ort/`;
ort.env.wasm.numThreads = 1; // multi-thread needs cross-origin isolation headers; the model is tiny

export interface SignModel {
  labels: string[];
  predict(input: Float32Array, topK?: number): Promise<Prediction[]>;
}

export async function loadSignModel(): Promise<SignModel> {
  const [session, labels] = await Promise.all([
    ort.InferenceSession.create("/model/sign_gru.onnx"),
    fetch("/model/labels.json").then((r) => r.json() as Promise<string[]>),
  ]);
  return {
    labels,
    async predict(input, topK = 5) {
      const out = await session.run({ x: new ort.Tensor("float32", input, [1, T, FEATURE_DIM]) });
      const logits = out.logits.data as Float32Array;
      const max = Math.max(...logits);
      const exps = Array.from(logits, (l) => Math.exp(l - max));
      const sum = exps.reduce((a, b) => a + b, 0);
      return exps
        .map((e, i) => ({ label: labels[i], prob: e / sum }))
        .sort((a, b) => b.prob - a.prob)
        .slice(0, topK);
    },
  };
}
