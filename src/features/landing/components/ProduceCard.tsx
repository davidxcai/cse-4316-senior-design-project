import type { RefObject } from "react";
import { IconCheck, IconRotate, IconX } from "@tabler/icons-react";
import type { AttemptPhase, AttemptResult, RecognizerError, RecognizerStatus } from "../../../recognition";
import CameraError from "./CameraError";
import StartCameraButton from "./StartCameraButton";

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  status: RecognizerStatus;
  error: RecognizerError | null;
  phase: AttemptPhase | null;
  verdict: AttemptResult["verdict"] | null;
  onStart: () => void;
}

/** Live camera frame (mirrored) with the hand-landmark overlay. Phase and ✓/✗ sit on top of the video. */
export default function ProduceCard({ videoRef, canvasRef, status, error, phase, verdict, onStart }: Props) {
  const idle = status === "idle" || status === "error";
  return (
    <div className="card bg-base-100 shadow-sm overflow-hidden">
      <div className="relative aspect-video w-full bg-base-300">
        <video ref={videoRef} className="absolute inset-0 size-full -scale-x-100 object-cover" playsInline muted />
        {/* Landmark overlay drawn by the recognizer; same transform + object-fit as the video so points stay on the hands. */}
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 size-full -scale-x-100 object-cover" aria-hidden />
        {status === "loading" && (
          <div className="absolute inset-0 grid place-items-center">
            <span className="loading loading-spinner loading-lg" />
          </div>
        )}
        {idle && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
            {error && <CameraError code={error.code} />}
            <StartCameraButton onClick={onStart} />
          </div>
        )}
        {phase && !verdict && (
          <div className="absolute left-3 top-3 flex items-center gap-2 rounded-box bg-base-100/80 px-3 py-1">
            {phase === "recording" && <span className="status status-error animate-pulse" />}
            {phase === "processing" && <span className="loading loading-spinner loading-xs" />}
            <span className="text-sm">{phase}</span>
          </div>
        )}
        {verdict && (
          <div className="absolute right-3 top-3">
            {verdict === "correct" && (
              <IconCheck size={40} className="rounded-full bg-success p-2 text-success-content" aria-label="correct" />
            )}
            {verdict === "wrong" && (
              <IconX size={40} className="rounded-full bg-error p-2 text-error-content" aria-label="incorrect" />
            )}
            {verdict === "rejected" && (
              <IconRotate size={40} className="rounded-full bg-neutral p-2 text-neutral-content" aria-label="try again" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
