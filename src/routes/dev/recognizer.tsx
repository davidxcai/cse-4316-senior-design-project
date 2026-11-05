import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { isRecognizable, useRecognizer, type AttemptPhase, type AttemptResult, type DominantHand, type Item } from "../../recognition";
import { glossKey, signLabels } from "../../recognition/vocab";

/** Every sign gloss the current model knows (variants merged), then the letters with a checker. */
const TARGETS: Item[] = [
  ...[...new Set(signLabels.map(glossKey))].sort().map((gloss): Item => ({ kind: "sign", gloss })),
  ...[..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((char): Item => ({ kind: "letter", char })),
  ...Array.from({ length: 10 }, (_, value): Item => ({ kind: "number", value })),
].filter(isRecognizable);
const SIGNS = TARGETS.filter((t) => t.kind === "sign");
const LETTERS = TARGETS.filter((t) => t.kind === "letter");
const NUMBERS = TARGETS.filter((t) => t.kind === "number");

const name = (i: Item | null) => (!i ? "—" : i.kind === "sign" ? i.gloss : i.kind === "letter" ? `letter ${i.char}` : String(i.value));
type Mode = "target" | "all";

const PHASE_BADGE: Record<AttemptPhase, string> = {
  waiting: "badge-ghost",
  recording: "badge-error",
  processing: "badge-warning",
};
const VERDICT_BADGE: Record<AttemptResult["verdict"], string> = {
  correct: "badge-success",
  wrong: "badge-error",
  rejected: "badge-neutral",
};

let nextRow = 0;
interface Row {
  id: number;
  r: AttemptResult;
}

function RecognizerDemo() {
  const { user } = useAuth();
  const { status, error, start, stop, attempt } = useRecognizer();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hand, setHand] = useState<DominantHand>(user?.dominantHand ?? "right");
  const [target, setTarget] = useState(0);
  const [mode, setMode] = useState<Mode>("all");
  const [phase, setPhase] = useState<AttemptPhase | null>(null);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (videoRef.current) start(videoRef.current, { dominantHand: hand, overlay: canvasRef.current }).catch(() => {}); // error shows via `error`
  }, [start, hand]);
  useEffect(() => stop, [stop]);

  const expect = TARGETS[target];
  // "all" = every recognizable item of the same kind (all signs, all letters, or all digits)
  const allowed = useMemo(
    () => (mode === "target" ? undefined : expect.kind === "sign" ? SIGNS : expect.kind === "letter" ? LETTERS : NUMBERS),
    [mode, expect],
  );

  // attempt after attempt while the page is open; a new target/mode cancels the one in flight
  useEffect(() => {
    if (status !== "ready") return;
    const ac = new AbortController();
    (async () => {
      while (!ac.signal.aborted) {
        try {
          const r = await attempt({ expect, allowed }, { signal: ac.signal, onPhase: setPhase });
          setRows((rs) => [{ id: nextRow++, r }, ...rs].slice(0, 10));
        } catch (e) {
          if ((e as Error).name !== "AbortError") throw e;
        }
      }
    })();
    return () => {
      ac.abort();
      setPhase(null);
    };
  }, [status, attempt, expect, allowed]);

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar gap-4 bg-base-100 px-4 shadow-sm">
        <span className="text-xl font-bold">Recognizer</span>
        <select className="select select-sm ml-auto w-48" value={target} onChange={(e) => setTarget(Number(e.target.value))}>
          {TARGETS.map((t, i) => (
            <option key={i} value={i}>
              {name(t)}
            </option>
          ))}
        </select>
        <select className="select select-sm w-40" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
          <option value="all">vs all of its kind</option>
          <option value="target">target only</option>
        </select>
        <label className="label cursor-pointer gap-2">
          Left-handed
          <input type="checkbox" className="toggle toggle-sm" checked={hand === "left"} onChange={(e) => setHand(e.target.checked ? "left" : "right")} />
        </label>
      </div>

      <main className="mx-auto grid max-w-5xl gap-4 p-4 md:grid-cols-2">
        {error && (
          <div role="alert" className="alert alert-error md:col-span-2">
            <span>
              {error.code}: {error.message}
            </span>
          </div>
        )}

        <div className="relative aspect-4/3 w-full overflow-hidden rounded-box bg-base-300">
          <video ref={videoRef} className="absolute inset-0 size-full -scale-x-100 object-cover" playsInline muted />
          <canvas ref={canvasRef} className="absolute inset-0 size-full -scale-x-100 object-cover" />
          <div className="absolute left-3 top-3 flex gap-2">
            {status === "loading" && (
              <span className="badge badge-neutral gap-2">
                <span className="loading loading-spinner loading-xs" />
                loading
              </span>
            )}
            {phase && <span className={`badge ${PHASE_BADGE[phase]}`}>{phase}</span>}
          </div>
        </div>

        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title">Sign: {name(expect)}</h2>
            <ul className="list">
              {rows.map(({ id, r }) => (
                <li key={id} className="list-row items-center">
                  <span className={`badge ${VERDICT_BADGE[r.verdict]}`}>{r.verdict}</span>
                  <span className="list-col-grow">
                    {name(r.predicted)}
                    {r.reason && <span className="text-base-content/60"> · {r.reason}</span>}
                  </span>
                  <span className="tabular-nums text-sm">{(r.confidence * 100).toFixed(0)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

// Dev-only test page for the ML session. No guard, not linked from the app.
export const Route = createFileRoute("/dev/recognizer")({
  component: RecognizerDemo,
});
