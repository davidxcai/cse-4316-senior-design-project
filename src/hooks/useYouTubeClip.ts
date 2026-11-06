import { useCallback, useEffect, useRef, useState } from "react";
import type { Clip } from "../domain/signContent";

// Minimal typings for the parts of the YouTube IFrame Player API we use (no @types package installed).
interface YTPlayer {
  destroy(): void;
  playVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setPlaybackRate(rate: number): void;
  getCurrentTime(): number;
}
interface YTEvent {
  target: YTPlayer;
  data: number;
}
interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      host: string;
      videoId: string;
      width: string;
      height: string;
      playerVars: Record<string, number>;
      events: { onReady: (e: YTEvent) => void; onStateChange: (e: YTEvent) => void };
    },
  ) => YTPlayer;
  PlayerState: { ENDED: number };
}
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

/** Loads the IFrame API script once per page. */
function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  apiPromise ??= new Promise<YTNamespace>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      reject(new Error("YouTube API failed to load"));
    };
    document.head.append(script);
  });
  return apiPromise;
}

const LOOP_POLL_MS = 100;
const SLOW_RATE = 0.5;

/**
 * Plays `clip` muted in a loop between clip.start and clip.end. Attach `containerRef` to an empty element that
 * fills the frame; the player's iframe is created inside it. Returns replay and slow-motion controls.
 */
export function useYouTubeClip(clip: Clip | null) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [slow, setSlow] = useState(false);
  const slowRef = useRef(slow);

  const videoId = clip?.videoId;
  const start = clip?.start ?? 0;
  const end = clip?.end ?? 0;

  useEffect(() => {
    const container = containerRef.current;
    if (!videoId || !container) return;
    let cancelled = false;
    let timer: number | undefined;
    let player: YTPlayer | undefined;
    const host = document.createElement("div");
    container.replaceChildren(host);

    const restart = () => {
      player?.seekTo(start, true);
      player?.playVideo();
    };

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        player = new YT.Player(host, {
          host: "https://www.youtube-nocookie.com",
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1,
            mute: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            iv_load_policy: 3,
            start: Math.floor(start),
            end: Math.ceil(end),
          },
          events: {
            onReady: (e) => {
              playerRef.current = e.target;
              e.target.setPlaybackRate(slowRef.current ? SLOW_RATE : 1);
              restart();
              // Loop on a timer rather than the ENDED state, so the end screen never flashes. Slow motion needs no change: time is in video seconds.
              timer = window.setInterval(() => {
                if (player && player.getCurrentTime() >= end) restart();
              }, LOOP_POLL_MS);
            },
            onStateChange: (e) => {
              if (e.data === YT.PlayerState.ENDED) restart(); // fallback when `end` is the end of the video
            },
          },
        });
      })
      .catch(() => {}); // blocked or offline: the frame stays empty

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      playerRef.current = null;
      player?.destroy();
      container.replaceChildren();
    };
  }, [videoId, start, end]);

  const toggleSlow = useCallback(() => {
    setSlow((prev) => {
      const next = !prev;
      slowRef.current = next;
      playerRef.current?.setPlaybackRate(next ? SLOW_RATE : 1);
      return next;
    });
  }, []);

  const replay = useCallback(() => {
    playerRef.current?.seekTo(start, true);
    playerRef.current?.playVideo();
  }, [start]);

  return { containerRef, slow, toggleSlow, replay };
}
