type Props = {
  choices: string[];
  /** index the learner picked; null until answered. Choices lock once set. */
  picked: number | null;
  /** index of the right choice; only revealed after `picked` is set */
  answer: number;
  onPick: (index: number) => void;
};

/** Four answer buttons in a 2×2 grid, correct outlined green, a wrong pick outlined red [S.13–14, S.25]. */
export default function ChoiceGrid({ choices, picked, answer, onPick }: Props) {
  const answered = picked !== null;
  const variant = (i: number) => {
    if (!answered) return "btn-outline";
    // dashed when the learner missed it: "this was the answer", not "you got it"
    // border-dashed is needed too: Tailwind's border-2 resets border-style to solid over daisyUI's btn-dash
    if (i === answer) return `${picked === answer ? "btn-outline" : "btn-dash border-dashed"} btn-success border-2`;
    if (i === picked) return "btn-outline btn-error border-2";
    return "btn-outline opacity-50";
  };
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="grid w-full grid-cols-2 gap-3" inert={answered}>
        {choices.map((label, i) => (
          <button
            key={i}
            type="button"
            className={`btn btn-lg h-auto min-h-14 py-3 ${variant(i)}`}
            onClick={(e) => {
              if (answered) return;
              e.currentTarget.blur(); // drop focus so the outline isn't masked by the focus fill
              onPick(i);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {answered && (
        <span className="sr-only" role="status">
          {picked === answer ? "correct" : `incorrect, ${choices[answer]}`}
        </span>
      )}
    </div>
  );
}
