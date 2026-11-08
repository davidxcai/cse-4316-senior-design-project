import { IconPlayerPauseFilled, IconPlayerPlayFilled } from "@tabler/icons-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RefClip, RefSet } from "../referenceClips";

const FPS = 30;
const W = 640;
const H = 480;

/** Stick-figure head in body units (shoulder width = 1): an oval centred a little above the nose. */
const HEAD = { rx: 0.26, ry: 0.34, lift: 0.06 };

/** Bounding box of every visible hand/pose point and the head oval, padded and widened to the canvas aspect. */
function fit(set: RefSet, clip: RefClip) {
  const { points, groups } = set;
  const drawn = groups.hands + groups.pose; // face points in older files are ignored
  const nose = groups.hands;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let f = 0; f < clip.frames; f++) {
    for (let p = 0; p < drawn; p++) {
      const i = (f * points + p) * 2;
      const x = clip.xy[i], y = clip.xy[i + 1];
      if (Number.isNaN(x) || Number.isNaN(y)) continue;
      const [rx, ry, cy] = p === nose ? [HEAD.rx, HEAD.ry, y - HEAD.lift] : [0, 0, y];
      x0 = Math.min(x0, x - rx); x1 = Math.max(x1, x + rx);
      y0 = Math.min(y0, cy - ry); y1 = Math.max(y1, cy + ry);
    }
  }
  if (!Number.isFinite(x0)) return { s: 100, ox: W / 2, oy: H / 2 };
  const pad = 0.15;
  const s = Math.min(W / ((x1 - x0) * (1 + 2 * pad)), H / ((y1 - y0) * (1 + 2 * pad)));
  return { s, ox: W / 2 - ((x0 + x1) / 2) * s, oy: H / 2 - ((y0 + y1) / 2) * s };
}

const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "gray";

/**
 * Plays a reference clip as a stick figure: two hands, shoulders/arms, and an oval head at the nose (no face points,
 * so the signer's face isn't reproduced). Drawn as the signer is seen (not
 * mirrored), like a video. Custom canvas because no daisyUI component draws landmarks.
 */
export function SkeletonPlayer({ set, clip }: { set: RefSet; clip: RefClip }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [slow, setSlow] = useState(false);
  const view = useMemo(() => fit(set, clip), [set, clip]);

  useEffect(() => setFrame(0), [clip]);

  // advance frames while playing
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const tick = (now: number) => {
      acc += ((now - last) / 1000) * FPS * (slow ? 0.5 : 1);
      last = now;
      if (acc >= 1) {
        const step = Math.floor(acc);
        acc -= step;
        setFrame((f) => (f + step) % clip.frames);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, slow, clip]);

  // draw the current frame
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { points, groups, edges } = set;
    const base = (Math.min(frame, clip.frames - 1) * points) * 2;
    const px = (p: number) => clip.xy[base + p * 2] * view.s + view.ox;
    const py = (p: number) => clip.xy[base + p * 2 + 1] * view.s + view.oy;
    const ok = (p: number) => !Number.isNaN(clip.xy[base + p * 2]);
    const handEnd = groups.hands / 2;
    const drawn = groups.hands + groups.pose;
    const [nose, lSh, rSh] = [groups.hands, groups.hands + 1, groups.hands + 2];
    const color = (p: number) =>
      p < handEnd ? cssVar("--color-primary")
      : p < groups.hands ? cssVar("--color-secondary")
      : cssVar("--color-base-content");

    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = "round";

    // head and neck
    ctx.strokeStyle = cssVar("--color-base-content");
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 2;
    if (ok(nose)) {
      const cx = px(nose), cy = py(nose) - HEAD.lift * view.s;
      ctx.beginPath();
      ctx.ellipse(cx, cy, HEAD.rx * view.s, HEAD.ry * view.s, 0, 0, Math.PI * 2);
      ctx.stroke();
      if (ok(lSh) && ok(rSh)) {
        ctx.beginPath();
        ctx.moveTo(cx, cy + HEAD.ry * view.s);
        ctx.lineTo((px(lSh) + px(rSh)) / 2, (py(lSh) + py(rSh)) / 2);
        ctx.stroke();
      }
    }

    for (const [a, b] of edges) {
      if (a >= drawn || b >= drawn || !ok(a) || !ok(b)) continue;
      const hand = a < groups.hands;
      ctx.strokeStyle = color(a);
      ctx.globalAlpha = hand ? 1 : 0.45;
      ctx.lineWidth = hand ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(px(a), py(a));
      ctx.lineTo(px(b), py(b));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    for (let p = 0; p < groups.hands; p++) {
      if (!ok(p)) continue;
      ctx.fillStyle = color(p);
      ctx.beginPath();
      ctx.arc(px(p), py(p), 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [set, clip, frame, view]);

  return (
    <div className="flex flex-col gap-2">
      <canvas ref={canvasRef} width={W} height={H} className="aspect-4/3 w-full rounded-box bg-base-200" />
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn btn-sm btn-square btn-ghost"
          aria-label={playing ? "Pause" : "Play"}
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? <IconPlayerPauseFilled size={16} /> : <IconPlayerPlayFilled size={16} />}
        </button>
        <input
          type="range"
          className="range range-xs flex-1"
          aria-label="Frame"
          min={0}
          max={clip.frames - 1}
          value={Math.min(frame, clip.frames - 1)}
          onChange={(e) => {
            setPlaying(false);
            setFrame(Number(e.target.value));
          }}
        />
        <button type="button" className={`btn btn-xs ${slow ? "btn-primary" : "btn-ghost"}`} onClick={() => setSlow((s) => !s)}>
          ½×
        </button>
      </div>
    </div>
  );
}
