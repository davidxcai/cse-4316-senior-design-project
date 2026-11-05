import * as ort from "onnxruntime-web/wasm";

// Absolute URL so Vite doesn't try to transform the dynamic import of the .mjs in public/
ort.env.wasm.wasmPaths = `${window.location.origin}/ort/`;
ort.env.wasm.numThreads = 1; // multi-thread needs cross-origin isolation headers; the models are tiny

/** onnxruntime-web, configured. Import ort from here, not from the package, so the settings apply before any session. */
export { ort };
