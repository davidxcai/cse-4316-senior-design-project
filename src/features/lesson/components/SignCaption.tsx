import { IconHandStop } from "@tabler/icons-react";
import { flags } from "../../../config/flags";
import { signInfo } from "../../../domain/signContent";
import type { Item } from "../../../recognition";

/** Gloss, meaning and (behind the flag) handshape note under a teaching clip [S.9–S.11]. */
export default function SignCaption({ item }: { item: Item }) {
  const info = signInfo(item);
  return (
    <div className="flex flex-col items-center gap-2">
      <h2 className="text-3xl font-bold">{info.label}</h2>
      {info.meaning && <p className="text-lg text-base-content/70">{info.meaning}</p>}
      {flags.showHandshapeNotes && info.handshape && (
        <p className="flex items-center gap-2 text-base-content/70">
          <IconHandStop size={18} aria-hidden />
          {info.handshape}
        </p>
      )}
    </div>
  );
}
