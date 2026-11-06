import { IconAlertTriangle, IconError404, IconInbox, IconX } from "@tabler/icons-react";
import { Link, Navigate } from "@tanstack/react-router";
import Notice from "../../components/Notice";
import { findLesson } from "../../domain/curriculum";
import { useLessonSession } from "../../hooks/useLessonSession";
import LessonComplete from "./components/LessonComplete";
import LessonFrame from "./components/LessonFrame";
import StepContent from "./components/StepContent";

export default function LessonPage({ lessonId }: { lessonId: string }) {
  const session = useLessonSession(lessonId);
  const unitId = findLesson(lessonId)?.unitId;

  switch (session.status) {
    case "loading":
      return <div className="skeleton mx-auto aspect-video w-full max-w-2xl" />;
    case "locked":
      return unitId ? <Navigate to="/unit/$unitId" params={{ unitId: String(unitId) }} replace /> : <Navigate to="/home" replace />;
    case "not-found":
      return <Notice icon={IconError404} text="Not found" />;
    case "error":
      return <Notice icon={IconAlertTriangle} text="Couldn't load" />;
  }

  const plan = session.plan;
  if (!plan) return <Notice icon={IconAlertTriangle} text="Couldn't load" />;
  const { lesson } = plan;

  if (plan.steps.length === 0)
    return (
      <Notice icon={IconInbox} text="Empty">
        <Link to="/unit/$unitId" params={{ unitId: String(lesson.unitId) }} className="btn btn-ghost btn-square" aria-label="Exit">
          <IconX size={22} />
        </Link>
      </Notice>
    );

  if (session.completed) return <LessonComplete lesson={lesson} stats={session.completed} onRedo={session.redo} />;

  return (
    <LessonFrame
      lesson={lesson}
      steps={plan.steps}
      stepIndex={session.stepIndex}
      itemIndex={session.itemIndex}
      itemCount={session.itemCount}
      canPrev={session.canPrev}
      canNext={session.canNext}
      onPrev={session.prev}
      onNext={session.next}
      completing={session.completing}
      completeError={session.completeError}
    >
      <StepContent plan={plan} session={session} />
    </LessonFrame>
  );
}
