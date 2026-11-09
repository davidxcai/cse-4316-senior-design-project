import { type ReactNode, useEffect, useRef } from "react";
import { IconAlertTriangle, IconArrowLeft, IconArrowRight, IconX } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import ProgressBar from "../../../components/ProgressBar";
import type { Lesson } from "../../../domain/curriculum";
import type { Step } from "../../../domain/lessonPlan";
import { useHotkeys } from "../../../hooks/useHotkeys";
import StepIndicator from "./StepIndicator";

type Props = {
  lesson: Lesson;
  steps: Step[];
  stepIndex: number;
  itemIndex: number;
  itemCount: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  /** saving the completion after the last item */
  completing: boolean;
  completeError: Error | null;
  children: ReactNode;
};

/**
 * Focus-mode chrome: exit, title, step indicator, n/m progress, prev/next [S.1–S.4].
 * ← / → keys mirror the buttons; → gets focus when it unlocks so Enter continues.
 */
export default function LessonFrame({ lesson, steps, stepIndex, itemIndex, itemCount, canPrev, canNext, onPrev, onNext, completing, completeError, children }: Props) {
  const nextEnabled = canNext && !completing;
  const nextRef = useRef<HTMLButtonElement>(null);
  const wasEnabled = useRef(nextEnabled);
  useEffect(() => {
    if (nextEnabled && !wasEnabled.current) nextRef.current?.focus({ preventScroll: true });
    wasEnabled.current = nextEnabled;
  }, [nextEnabled]);

  useHotkeys({
    ArrowLeft: () => canPrev && onPrev(),
    ArrowRight: () => nextEnabled && onNext(),
  });

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-4xl flex-col gap-4">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Link to="/unit/$unitId" params={{ unitId: String(lesson.unitId) }} className="btn btn-ghost btn-square" aria-label="Exit">
            <IconX size={22} />
          </Link>
          <div className="flex min-w-0 items-baseline gap-2">
            {lesson.label && <span className="font-semibold text-base-content/60">{lesson.label}</span>}
            <h1 className="truncate text-lg font-semibold">{lesson.title}</h1>
          </div>
        </div>
        <StepIndicator steps={steps} current={stepIndex} />
        <ProgressBar value={Math.min(itemIndex + 1, itemCount)} max={itemCount} showCount />
      </header>
      <div className="flex flex-1 flex-col items-center justify-center py-4">{children}</div>
      {completeError && (
        <div role="alert" className="alert alert-error alert-soft">
          <IconAlertTriangle size={20} aria-hidden />
          <span>Couldn't save</span>
        </div>
      )}
      <footer className="sticky bottom-0 z-10 flex justify-between bg-base-100 py-3">
        <button type="button" className="btn btn-ghost btn-square" onClick={onPrev} disabled={!canPrev} aria-label="Previous" aria-keyshortcuts="ArrowLeft">
          <IconArrowLeft size={22} />
        </button>
        <button ref={nextRef} type="button" className="btn btn-primary btn-square" onClick={onNext} disabled={!nextEnabled} aria-label="Next" aria-keyshortcuts="ArrowRight">
          {completing ? <span className="loading loading-spinner loading-sm" /> : <IconArrowRight size={22} />}
        </button>
      </footer>
    </div>
  );
}
