import { IconPlayerPlay } from "@tabler/icons-react";
import CameraView from "./CameraView";
import type { AttemptVerdict } from "../../domain/lessonSession";
import type { SignCamera } from "../../hooks/useSignCamera";
import type { AttemptPhase } from "../../recognition";

type Props = {
  camera: SignCamera;
  phase: AttemptPhase | null;
  verdict: AttemptVerdict | null;
  /** switch the lesson to the watch layout */
  onWatch: () => void;
};

/**
 * CameraView as lessons use it. A miss shows the neutral try-again icon, never ✗: lessons only reinforce
 * successes. A camera error offers Watch, which continues the lesson without the camera.
 */
export default function LessonCamera({ camera, phase, verdict, onWatch }: Props) {
  return (
    <CameraView
      camera={camera}
      phase={phase}
      verdict={verdict === "wrong" ? "rejected" : verdict}
      errorAction={
        <button type="button" className="btn btn-ghost" onClick={onWatch}>
          <IconPlayerPlay size={20} />
          Watch
        </button>
      }
    />
  );
}
