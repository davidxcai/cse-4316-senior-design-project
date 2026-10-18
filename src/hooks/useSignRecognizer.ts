import { useEffect, useRef, useState } from "react";
import { createLandmarkers } from "../lib/landmarkers";
import { drawDetection } from "../lib/drawLandmarks";
import { preprocess } from "../lib/preprocess";
import { Segmenter } from "../lib/segmenter";
import { loadSignModel } from "../lib/signModel";
import type { Frame, Prediction } from "../types/sign";

export type Status = "loading" | "ready" | "error";
export interface HistoryItem {
  id: number;
  top: Prediction[];
}

const LIVE_EVERY_MS = 300;

/** Webcam -> landmarks -> segmenter -> preprocess -> ONNX model. Components only read the returned state. */
export function useSignRecognizer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mirrorRef = useRef(false);

  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [live, setLive] = useState<Prediction[] | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [mirror, setMirrorState] = useState(false);

  const setMirror = (v: boolean) => {
    mirrorRef.current = v;
    setMirrorState(v);
  };

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    let stream: MediaStream | undefined;

    (async () => {
      try {
        const [model, landmarkers, cam] = await Promise.all([
          loadSignModel(),
          createLandmarkers(),
          navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" }, audio: false }),
        ]);
        stream = cam;
        if (cancelled) return cam.getTracks().forEach((t) => t.stop());
        const video = videoRef.current!;
        video.srcObject = cam;
        await video.play();
        setLabels(model.labels);
        setStatus("ready");

        const seg = new Segmenter();
        let lastTime = -1;
        let lastInfer = 0;
        let busy = false;
        let wasRecording = false;
        let nextId = 1;

        const finish = async (frames: Frame[]) => {
          const input = preprocess(frames);
          if (!input) return;
          const top = await model.predict(input);
          setHistory((h) => [{ id: nextId++, top }, ...h].slice(0, 8));
        };

        const tick = () => {
          raf = requestAnimationFrame(tick);
          if (video.readyState < 2 || video.currentTime === lastTime) return;
          lastTime = video.currentTime;
          const t = Math.round(performance.now());
          const det = landmarkers.detect(video, t, mirrorRef.current);
          const canvas = canvasRef.current;
          if (canvas) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            drawDetection(canvas, det);
          }

          const state = seg.push(det.frame);
          if (state === "done") {
            const frames = seg.frames;
            const ok = seg.enoughHands;
            seg.reset();
            wasRecording = false;
            setRecording(false);
            setLive(null);
            if (ok) finish(frames);
          } else if (state === "recording") {
            if (!wasRecording) setRecording((wasRecording = true));
            if (!busy && seg.enoughHands && t - lastInfer > LIVE_EVERY_MS) {
              lastInfer = t;
              busy = true;
              const input = preprocess(seg.frames);
              if (input) model.predict(input).then(setLive).finally(() => (busy = false));
              else busy = false;
            }
          }
        };
        tick();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { videoRef, canvasRef, status, error, recording, live, history, labels, mirror, setMirror };
}
