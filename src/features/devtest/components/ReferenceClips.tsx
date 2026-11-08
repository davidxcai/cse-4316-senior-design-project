import { IconFileUpload, IconMovie, IconPhoto } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import type { Item } from "../../../recognition";
import { useReferenceFile } from "../hooks/useReferenceFile";
import { clipsFor, type Split } from "../referenceClips";
import { SkeletonPlayer } from "./SkeletonPlayer";
import { TrainCountBadges } from "./TrainCountBadges";

const SPLIT_BADGE: Record<Split, string> = { test: "badge-success", val: "badge-info", train: "badge-ghost" };

/**
 * Reference clips of `item` as skeletons, from a locally picked landmark file (ml/export_reference.py; only `scope`'s
 * words are kept), plus how much data its classifier trained on.
 */
export function ReferenceClips({ item, scope }: { item: Item | null; scope: readonly Item[] }) {
  const { set, loading, error, pick } = useReferenceFile(scope);
  const clips = useMemo(() => (set && item ? clipsFor(set, item) : []), [set, item]);
  const [i, setI] = useState(0);
  const clip = clips[Math.min(i, clips.length - 1)];

  useEffect(() => setI(0), [clips]);

  return (
    <div className="card bg-base-100 shadow-sm">
      <div className="card-body gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="card-title mr-auto">
            <IconMovie size={20} />
            Reference
          </h2>
          {item && <TrainCountBadges item={item} />}
          <label className="btn btn-sm btn-square btn-ghost" aria-label="Pick landmark file">
            {loading ? <span className="loading loading-spinner loading-xs" /> : <IconFileUpload size={18} />}
            <input type="file" className="hidden" accept=".gz,.json" onChange={(e) => void pick(e.target.files?.[0])} />
          </label>
        </div>

        {(set || error) && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {set && <span className="badge badge-ghost">{set.total} clips</span>}
            {error && <span className="badge badge-error">{error}</span>}
          </div>
        )}

        {set && clip ? (
          <SkeletonPlayer set={set} clip={clip} />
        ) : (
          <div className="flex aspect-4/3 w-full items-center justify-center gap-2 rounded-box bg-base-200 text-base-content/60">
            {set ? (
              <>
                <IconPhoto size={20} />
                missing
              </>
            ) : (
              <IconFileUpload size={28} />
            )}
          </div>
        )}

        {clips.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {clips.map((c, n) => (
              <button
                key={n}
                type="button"
                className={`btn btn-xs ${n === i ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setI(n)}
              >
                {n + 1}
                <span className={`badge badge-xs ${SPLIT_BADGE[c.split]}`}>{c.split}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
