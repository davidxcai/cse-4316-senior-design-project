import type { LessonPlan } from "../../../domain/lessonPlan";
import { itemKey } from "../../../domain/signContent";
import type { useLessonSession } from "../../../hooks/useLessonSession";
import CultureStep from "./CultureStep";
import LearnStep from "./LearnStep";
import RecognizeStep from "./RecognizeStep";
import SignStep from "./SignStep";
import WatchStep from "./WatchStep";

type Props = { plan: LessonPlan; session: ReturnType<typeof useLessonSession> };

/**
 * Picks the component for the session's current step and item. Watch/Recognize/Culture remount per item;
 * Learn and Sign do not (they own the camera).
 */
export default function StepContent({ plan, session }: Props) {
  const step = plan.steps[session.stepIndex];
  if (!step) return null;

  switch (step.kind) {
    case "learn": {
      const task = step.tasks[session.itemIndex];
      return task ? (
        <LearnStep
          task={task}
          reps={session.learnReps}
          onResult={session.recordLearn}
          onWatch={session.switchToWatch}
        />
      ) : null;
    }
    case "watch": {
      const item = step.items[session.itemIndex];
      return item ? <WatchStep key={itemKey(item)} item={item} /> : null;
    }
    case "recognize": {
      const question = step.questions[session.itemIndex];
      return question ? (
        <RecognizeStep
          key={itemKey(question.item)}
          question={question}
          answer={session.recognizeAnswer}
          onAnswer={session.answerRecognize}
        />
      ) : null;
    }
    case "sign": {
      const task = step.tasks[session.itemIndex];
      return task ? (
        <SignStep
          task={task}
          record={session.signRecord}
          onResult={session.recordSign}
          onHint={session.showSignHint}
          onWatch={session.switchToWatch}
        />
      ) : null;
    }
    case "culture":
      return <CultureStep key={step.note.title} note={step.note} />;
  }
}
