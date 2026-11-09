import { IconBook2, IconHandStop, IconListCheck, IconPlayerPlay, IconWorld, type Icon } from "@tabler/icons-react";
import type { Step } from "../../../domain/lessonPlan";

const STEPS: Record<Step["kind"], { label: string; icon: Icon }> = {
  learn: { label: "Learn", icon: IconBook2 },
  watch: { label: "Watch", icon: IconPlayerPlay },
  recognize: { label: "Recognize", icon: IconListCheck },
  sign: { label: "Sign", icon: IconHandStop },
  culture: { label: "Culture", icon: IconWorld },
};

/** daisyUI steps over the plan's actual steps [S.2]. */
export default function StepIndicator({ steps, current }: { steps: Step[]; current: number }) {
  return (
    <ul className="steps w-full">
      {steps.map((step, i) => {
        const { label, icon: StepIcon } = STEPS[step.kind];
        return (
          <li key={step.kind} className={`step ${i <= current ? "step-primary" : ""}`} aria-current={i === current ? "step" : undefined}>
            <span className="step-icon">
              <StepIcon size={16} aria-hidden />
            </span>
            {label}
          </li>
        );
      })}
    </ul>
  );
}
