import { useState } from "react";
import ChoiceGrid from "../../../components/signing/ChoiceGrid";
import type { CultureNote } from "../../../domain/curriculum";

/** Reading plus one quiz question [S.24–S.26]. The "draft" badge is the one approved badge, shown while the note is unreviewed. */
export default function CultureStep({ note }: { note: CultureNote }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">{note.title}</h2>
          {note.draft && <span className="badge badge-ghost badge-sm">draft</span>}
        </div>
        <p className="whitespace-pre-line text-base-content/80">{note.body}</p>
      </div>
      <div className="flex flex-col items-center gap-4">
        <p className="self-start font-semibold">{note.question.prompt}</p>
        <ChoiceGrid choices={note.question.choices} picked={picked} answer={note.question.answer} onPick={setPicked} />
      </div>
    </div>
  );
}
