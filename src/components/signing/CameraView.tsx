import type { ReactNode } from "react";
import type { AttemptPhase, AttemptResult } from "../../recognition";
import type { SignCamera } from "../../hooks/useSignCamera";
import CameraError from "./CameraError";
import PhaseCue from "./PhaseCue";
import StartCameraButton from "./StartCameraButton";
import VerdictIcon from "./VerdictIcon";

type Props = {
  camera: SignCamera;
  phase: AttemptPhase | null;
  verdict: AttemptResult["verdict"] | null;
  /** shown with the camera error, e.g. a way to continue without the camera */
  errorAction?: ReactNode;
};

/**
 * Live camera frame (mirrored) with the hand-landmark overlay [S.15, LP.4]. Phase cue and verdict sit on top.
 * Custom markup because no daisyUI component covers a video with a stacked canvas.
 */
export default function CameraView({ camera, phase, verdict, errorAction }: Props) {
  const { videoRef, canvasRef, status, error, startCamera } = camera;
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
            {error && <CameraError code={error.code} onRetry={startCamera} />}
            {error?.code !== "in-use" && <StartCameraButton onClick={startCamera} />}
            {error && errorAction}
          </div>
        )}
        {phase && !verdict && (
          <div className="absolute left-3 top-3">
            <PhaseCue phase={phase} />
          </div>
        )}
        {verdict && (
          <div className="absolute right-3 top-3">
            <VerdictIcon verdict={verdict} />
          </div>
        )}
      </div>
    </div>
  );
}
