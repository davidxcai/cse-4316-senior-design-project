import { FilesetResolver, HandLandmarker, PoseLandmarker, type NormalizedLandmark } from "@mediapipe/tasks-vision";
import type { Frame, Point3 } from "../types/sign";

export interface Detection {
  frame: Frame;
  hands: NormalizedLandmark[][];
  shoulders: NormalizedLandmark[] | null;
}

export interface Landmarkers {
  detect(video: HTMLVideoElement, t: number, mirror: boolean): Detection;
}

const pt = (l: NormalizedLandmark): Point3 => [l.x, l.y, l.z];

/** Same models as ml/extract.py (hand_landmarker, pose_landmarker_lite), VIDEO mode, fed the raw unmirrored frame. */
export async function createLandmarkers(): Promise<Landmarkers> {
  const fileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
  const make = async (delegate: "GPU" | "CPU") => {
    const hand = await HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: "/mediapipe/hand_landmarker.task", delegate },
      runningMode: "VIDEO",
      numHands: 2,
    });
    const pose = await PoseLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: "/mediapipe/pose_landmarker_lite.task", delegate },
      runningMode: "VIDEO",
    });
    return { hand, pose };
  };
  let m;
  try {
    m = await make("GPU");
  } catch {
    m = await make("CPU");
  }

  return {
    detect(video, t, mirror) {
      const hr = m.hand.detectForVideo(video, t);
      const pr = m.pose.detectForVideo(video, t);
      const hands: Frame["hands"] = [null, null];
      hr.landmarks.forEach((lms, i) => {
        // "Mirror input" flips x and swaps the handedness label, as if the image were mirrored
        const left = hr.handedness[i][0].categoryName === "Left";
        const slot = (left ? 0 : 1) ^ (mirror ? 1 : 0);
        hands[slot] = lms.flatMap((l) => [mirror ? 1 - l.x : l.x, l.y, l.z]);
      });
      const pose = pr.landmarks[0];
      const flip = (p: Point3): Point3 => (mirror ? [1 - p[0], p[1], p[2]] : p);
      const shoulders: Frame["shoulders"] = pose ? [flip(pt(pose[11])), flip(pt(pose[12]))] : null;
      return { frame: { t, hands, shoulders }, hands: hr.landmarks, shoulders: pose ? [pose[11], pose[12]] : null };
    },
  };
}
