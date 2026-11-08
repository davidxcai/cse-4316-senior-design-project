import ChoiceGrid from "./ChoiceGrid";
import SignVideo from "./SignVideo";
import type { RecognizeQuestion } from "../../domain/lessonPlan";
import { itemKey, signInfo } from "../../domain/signContent";
import type { Item } from "../../recognition";

type Props = {
  question: RecognizeQuestion;
  /** the choice already picked for this question, if any */
  answer: Item | null;
  onAnswer: (choice: Item) => void;
};

/** Sign video with the title covered, four label choices, then the right label outlined green (a wrong pick outlined red) [S.12–S.14]. */
export default function RecognizeStep({ question, answer, onAnswer }: Props) {
  const { item, choices } = question;
  const answerKey = answer ? itemKey(answer) : null;
  const picked = answerKey === null ? null : choices.findIndex((c) => itemKey(c) === answerKey);
  return (
    <div className="flex w-full max-w-2xl flex-col items-center gap-6">
      <SignVideo clip={signInfo(item).clip} hideTitle className="w-full" />
      <ChoiceGrid
        choices={choices.map((c) => signInfo(c).label)}
        picked={picked === -1 ? null : picked}
        answer={choices.findIndex((c) => itemKey(c) === itemKey(item))}
        onPick={(i) => onAnswer(choices[i])}
      />
    </div>
  );
}
