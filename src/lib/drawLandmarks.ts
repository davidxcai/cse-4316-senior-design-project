import { DrawingUtils, HandLandmarker } from "@mediapipe/tasks-vision";
import type { Detection } from "./landmarkers";

export function drawDetection(canvas: HTMLCanvasElement, d: Detection) {
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const draw = new DrawingUtils(ctx);
  for (const hand of d.hands) {
    draw.drawConnectors(hand, HandLandmarker.HAND_CONNECTIONS, { color: "#22c55e", lineWidth: 3 });
    draw.drawLandmarks(hand, { color: "#ffffff", radius: 2 });
  }
  if (d.shoulders) draw.drawLandmarks(d.shoulders, { color: "#3b82f6", radius: 5 });
}
