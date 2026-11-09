import { IconPlayerPlay, IconRepeat } from "@tabler/icons-react";
import { useHotkeys } from "../../hooks/useHotkeys";
import { useYouTubeClip } from "../../hooks/useYouTubeClip";
import type { Clip } from "../../domain/signContent";

type Props = {
  clip: Clip | null;
  /** Covers YouTube's title bar so it can't reveal the answer in Recognize (S.12). */
  hideTitle?: boolean;
  className?: string;
};

/** Looping reference clip with replay (also Space) and ½× controls [S.7–8]. A null clip renders a skeleton frame. */
export default function SignVideo({ clip, hideTitle = false, className = "" }: Props) {
  const { containerRef, slow, toggleSlow, replay } = useYouTubeClip(clip);
  useHotkeys({ " ": replay }, clip !== null);
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="card relative aspect-video w-full overflow-hidden bg-base-300 shadow-sm">
        {clip ? (
          <>
            <div ref={containerRef} className="absolute inset-0 [&>iframe]:size-full" />
            {/* swallows clicks so the embed can't be paused or opened on YouTube */}
            <div className="absolute inset-0" aria-hidden />
            {hideTitle && <div className="absolute inset-x-0 top-0 h-14 bg-base-300" aria-hidden />}
          </>
        ) : (
          <div className="skeleton absolute inset-0 rounded-none" />
        )}
      </div>
      <div className="flex justify-center gap-2">
        <button type="button" className="btn btn-ghost btn-sm btn-circle" onClick={replay} disabled={!clip} aria-label="Replay" aria-keyshortcuts="Space">
          <IconRepeat size={20} />
        </button>
        <button
          type="button"
          className={`btn btn-ghost btn-sm ${slow ? "btn-active" : ""}`}
          onClick={toggleSlow}
          disabled={!clip}
          aria-label="Slow motion"
          aria-pressed={slow}
        >
          <IconPlayerPlay size={16} />
          ½×
        </button>
      </div>
    </div>
  );
}
