import { IconCircle, IconCircleCheckFilled } from "@tabler/icons-react";
import SignVideo from "../../../components/signing/SignVideo";
import type { LearnTask } from "../../../domain/lessonPlan";
import { LEARN_REPS, type AttemptVerdict } from "../../../domain/lessonSession";
import { signInfo } from "../../../domain/signContent";
import { useSignCamera } from "../../../hooks/useSignCamera";
import { useSignAttempts } from "../../../hooks/useSignAttempts";
import LessonCamera from "../../../components/signing/LessonCamera";
import SignCaption from "./SignCaption";

type Props = {
  task: LearnTask;
  /** correct signs so far on this card */
  reps: number;
  onResult: (verdict: AttemptVerdict) => void;
  onWatch: () => void;
};

/**
 * Watch the clip and sign along: reference video beside the camera, caption, and one dot per correct sign
 * (LEARN_REPS unlock the frame's Next; attempts keep looping after that so the learner can keep repeating).
 * A card without a recognizer is watch-only; the camera stays mounted but hidden so its stream survives.
 * Mounted once per Learn step, not per card, so the camera keeps running between signs.
 */
export default function LearnStep({ task, reps, onResult, onWatch }: Props) {
  const camera = useSignCamera();
  const { item, allowed } = task;
  const watchOnly = allowed === null;
  const { phase, verdict } = useSignAttempts({ camera, task: allowed ? { item, allowed } : null, active: true, onResult });

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className={`grid w-full items-start gap-4 ${watchOnly ? "max-w-2xl" : "md:grid-cols-2"}`}>
        <SignVideo clip={signInfo(item).clip} className="w-full" />
        <div className={watchOnly ? "hidden" : ""}>
          <LessonCamera camera={camera} phase={phase} verdict={verdict} onWatch={onWatch} />
        </div>
      </div>
      <SignCaption item={item} />
      {!watchOnly && (
        <div className="flex gap-1 text-success" aria-label={`${Math.min(reps, LEARN_REPS)}/${LEARN_REPS}`}>
          {Array.from({ length: LEARN_REPS }, (_, i) =>
            i < reps ? <IconCircleCheckFilled key={i} size={28} aria-hidden /> : <IconCircle key={i} size={28} className="text-base-content/30" aria-hidden />,
          )}
        </div>
      )}
    </div>
  );
}
