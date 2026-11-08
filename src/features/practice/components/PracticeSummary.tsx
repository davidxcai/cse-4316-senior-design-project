import { IconCheck, IconHandStop, IconRefresh } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import SessionSummary from "../../../components/SessionSummary";

type Props = { title: string; practiced: number; correct: number; onAgain: () => void };

/** Shown after Stop [P.9]: signs practiced and correct count. No missed list: practice only reinforces successes. */
export default function PracticeSummary({ title, practiced, correct, onAgain }: Props) {
  return (
    <SessionSummary
      title={title}
      stats={[
        { icon: IconHandStop, value: practiced, label: "Signs" },
        { icon: IconCheck, value: correct, label: "Correct" },
      ]}
    >
      <button type="button" className="btn btn-ghost" onClick={onAgain}>
        <IconRefresh size={20} />
        Again
      </button>
      <Link to="/practice" className="btn btn-primary">
        Done
      </Link>
    </SessionSummary>
  );
}
