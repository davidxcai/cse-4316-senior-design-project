import { IconAlertTriangle, IconError404, IconInbox, IconX } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import Notice from "../../components/Notice";
import RecognizeStep from "../../components/signing/RecognizeStep";
import SignStep from "../../components/signing/SignStep";
import { itemKey } from "../../domain/signContent";
import PracticeFrame from "./components/PracticeFrame";
import PracticeSummary from "./components/PracticeSummary";
import { usePracticeSession } from "./hooks/usePracticeSession";

/**
 * One unit's practice session [4b]. Recognize cards remount per card; SignStep stays mounted through a Sign block
 * so the camera keeps running between signs.
 */
export default function PracticeSessionPage({ unitId }: { unitId: number }) {
  const session = usePracticeSession(unitId);
  const { unit, card } = session;

  switch (session.status) {
    case "not-found":
      return <Notice icon={IconError404} text="Not found" />;
    case "error":
      return <Notice icon={IconAlertTriangle} text="Couldn't load" />;
    case "loading":
      return <div className="skeleton mx-auto aspect-video w-full max-w-2xl" />;
    case "empty":
      return (
        <Notice icon={IconInbox} text="Empty">
          <Link to="/practice" className="btn btn-ghost btn-square" aria-label="Exit">
            <IconX size={22} />
          </Link>
        </Notice>
      );
  }

  if (!unit || !card) return null;
  if (session.stopped)
    return <PracticeSummary title={unit.title} practiced={session.practiced} correct={session.correct} onAgain={session.restart} />;

  return (
    <PracticeFrame title={unit.title} correct={session.correct} canNext={session.canNext} onNext={session.next} onStop={session.stop}>
      {card.kind === "recognize" ? (
        <RecognizeStep
          key={`${session.index}-${itemKey(card.question.item)}`}
          question={card.question}
          answer={session.answer}
          onAnswer={session.answerRecognize}
        />
      ) : (
        <SignStep
          task={card.task}
          record={session.signRecord}
          onResult={session.recordSign}
          onHint={session.showSignHint}
          onWatch={session.switchToWatch}
        />
      )}
    </PracticeFrame>
  );
}
