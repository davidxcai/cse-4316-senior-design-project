import { useCallback, useEffect, useRef } from "react";
import { useRecognizer } from "../recognition";
import { useAuth } from "./useAuth";
import { useCameraPreference } from "./useCameraPreference";

/**
 * Everything a camera view needs from the shared recognizer: the video and landmark-canvas refs, status/error,
 * `startCamera` (the only thing that starts the camera and downloads models) and `attempt`.
 * Stops the camera when the component using it unmounts.
 */
export function useSignCamera() {
  const { status, error, start, stop, attempt } = useRecognizer();
  const { user } = useAuth();
  const [deviceId] = useCameraPreference();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dominantHand = user?.dominantHand ?? "right";

  const startCamera = useCallback(() => {
    if (videoRef.current) {
      start(videoRef.current, { dominantHand, overlay: canvasRef.current, deviceId }).catch(() => {}); // surfaces via `error`
    }
  }, [start, dominantHand, deviceId]);

  useEffect(() => stop, [stop]);

  return { videoRef, canvasRef, status, error, attempt, startCamera };
}

export type SignCamera = ReturnType<typeof useSignCamera>;
