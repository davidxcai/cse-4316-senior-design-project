import { IconBulb } from "@tabler/icons-react";
import SignVideo from "./SignVideo";
import type { SignTask } from "../../domain/lessonPlan";
import type { AttemptVerdict, SignRecord } from "../../domain/lessonSession";
import { signInfo } from "../../domain/signContent";
import { useSignCamera } from "../../hooks/useSignCamera";
import { useSignAttempts } from "../../hooks/useSignAttempts";
import LessonCamera from "./LessonCamera";

type Props = {
  task: SignTask;
  record: SignRecord | null;
  onResult: (verdict: AttemptVerdict) => void;
  onHint: () => void;
  onWatch: () => void;
};

/**
 * Recall: the word and the camera, with the clip behind Hint [S.15–S.20]. Attempts loop until one is correct; tries
 * are unlimited. The clip also appears once the sign is correct. Mounted once per Sign step, not per task, so the
 * camera keeps running between signs and stops when the step or page is left (useSignCamera).
 */
export default function SignStep({ task, record, onResult, onHint, onWatch }: Props) {
  const camera = useSignCamera();
  const done = record?.correct === true;
  const showClip = done || record?.hinted === true;
  const { phase, verdict } = useSignAttempts({ camera, task, active: !done, onResult });
  const info = signInfo(task.item);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className={`grid w-full items-start gap-4 ${showClip ? "md:grid-cols-[2fr_1fr]" : "max-w-2xl"}`}>
        <LessonCamera camera={camera} phase={phase} verdict={verdict ?? (done ? "correct" : null)} onWatch={onWatch} />
        {showClip && <SignVideo clip={info.clip} />}
      </div>
      <h2 className="text-3xl font-bold">{info.label}</h2>
      {!showClip && (
        <button type="button" className="btn btn-ghost" onClick={onHint}>
          <IconBulb size={20} />
          Hint
        </button>
      )}
    </div>
  );
}
