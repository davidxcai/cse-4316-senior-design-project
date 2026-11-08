import { IconArrowsExchange, IconCode, IconMovie, IconPhoto, IconUsers } from "@tabler/icons-react";
import type { Item } from "../../../recognition";
import { trainCount } from "../referenceClips";

/** How much training data the item's classifier saw (trainCounts.json, from ml/train_counts.py). */
export function TrainCountBadges({ item }: { item: Item }) {
  const c = trainCount(item);
  if (!c) return <span className="badge badge-warning">missing</span>;
  if (c.kind === "rule")
    return (
      <span className="badge badge-ghost gap-1">
        <IconCode size={14} />
        rule
      </span>
    );
  return (
    <>
      <span className="badge badge-ghost gap-1" title="training videos">
        <IconMovie size={14} />
        {c.videos}
      </span>
      {c.kind === "sign" && c.variants > 1 && <span className="badge badge-ghost">{c.variants} variants</span>}
      {c.kind === "sign" && c.reversed && (
        <span className="badge badge-ghost gap-1" title="also trained reversed">
          <IconArrowsExchange size={14} />
        </span>
      )}
      {c.kind === "handshape" && c.photos > 0 && (
        <>
          <span className="badge badge-ghost gap-1" title="ASL-HG photos">
            <IconPhoto size={14} />
            {c.photos}
          </span>
          <span className="badge badge-ghost gap-1" title="ASL-HG signers">
            <IconUsers size={14} />
            {c.signers}
          </span>
        </>
      )}
    </>
  );
}
