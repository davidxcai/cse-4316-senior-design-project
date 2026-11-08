import { type ReactNode, useEffect, useRef } from "react";
import { IconArrowRight, IconCheck, IconPlayerStop } from "@tabler/icons-react";
import StatItem from "../../../components/StatItem";
import { useHotkeys } from "../../../hooks/useHotkeys";

type Props = {
  title: string;
  correct: number;
  canNext: boolean;
  onNext: () => void;
  onStop: () => void;
  children: ReactNode;
};

/**
 * Focus-mode chrome for practice: Stop, title, ✓ tally, Next [4b]. No ✗ tally: practice only counts successes.
 * → mirrors Next and takes focus when it unlocks so Enter continues (same as LessonFrame).
 */
export default function PracticeFrame({ title, correct, canNext, onNext, onStop, children }: Props) {
  const nextRef = useRef<HTMLButtonElement>(null);
  const wasEnabled = useRef(canNext);
  useEffect(() => {
    if (canNext && !wasEnabled.current) nextRef.current?.focus({ preventScroll: true });
    wasEnabled.current = canNext;
  }, [canNext]);

  useHotkeys({ ArrowRight: () => canNext && onNext() });

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-4xl flex-col gap-4">
      <header className="flex items-center gap-3">
        <button type="button" className="btn btn-ghost" onClick={onStop}>
          <IconPlayerStop size={20} />
          Stop
        </button>
        <h1 className="min-w-0 flex-1 truncate text-lg font-semibold">{title}</h1>
        <StatItem icon={IconCheck} value={correct} label="Correct" className="text-success" />
      </header>
      <div className="flex flex-1 flex-col items-center justify-center py-4">{children}</div>
      <footer className="sticky bottom-0 z-10 flex justify-end bg-base-100 py-3">
        <button
          ref={nextRef}
          type="button"
          className="btn btn-primary btn-square"
          onClick={onNext}
          disabled={!canNext}
          aria-label="Next"
          aria-keyshortcuts="ArrowRight"
        >
          <IconArrowRight size={22} />
        </button>
      </footer>
    </div>
  );
}
