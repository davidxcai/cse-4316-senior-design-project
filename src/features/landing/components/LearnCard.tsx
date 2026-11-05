import type { LearnClip } from "../tryItConfig";

function embedUrl({ videoId, start, end }: LearnClip) {
  const params = new URLSearchParams({ start: String(start), end: String(end), rel: "0" });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
}

export default function LearnCard({ clip }: { clip: LearnClip }) {
  return (
    <div className="card bg-base-100 shadow-sm overflow-hidden">
      {clip.videoId ? (
        <iframe
          className="aspect-video w-full"
          src={embedUrl(clip)}
          title="HELLO"
          allow="encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <div className="skeleton aspect-video w-full rounded-none" />
      )}
    </div>
  );
}
