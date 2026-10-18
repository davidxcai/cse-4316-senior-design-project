import type { RefObject } from "react";
import type { Status } from "../hooks/useSignRecognizer";

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  status: Status;
  recording: boolean;
}

/** Webcam preview with landmark overlay. Display is mirrored (selfie view); the model input is not. */
export function CameraStage({ videoRef, canvasRef, status, recording }: Props) {
  return (
    <div className="relative aspect-4/3 w-full overflow-hidden rounded-box bg-base-300">
      <video ref={videoRef} className="absolute inset-0 size-full -scale-x-100 object-cover" playsInline muted />
      <canvas ref={canvasRef} className="absolute inset-0 size-full -scale-x-100 object-cover" />
      <div className="absolute left-3 top-3">
        {status === "loading" && <span className="badge badge-neutral gap-2"><span className="loading loading-spinner loading-xs" />Loading models…</span>}
        {status === "ready" && !recording && <span className="badge badge-ghost">Show your hands to start a sign</span>}
        {recording && <span className="badge badge-error gap-2"><span className="status status-neutral animate-pulse" />Recording sign</span>}
      </div>
    </div>
  );
}
