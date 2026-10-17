import { CameraStage } from "./components/CameraStage";
import { History } from "./components/History";
import { Predictions } from "./components/Predictions";
import { Vocabulary } from "./components/Vocabulary";
import { useSignRecognizer } from "./hooks/useSignRecognizer";

export default function App() {
  const r = useSignRecognizer();
  const shown = r.live ?? r.history[0]?.top ?? null;

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-sm">
        <span className="px-4 text-xl font-bold">ASL sign demo</span>
        <label className="label ml-auto cursor-pointer gap-2 px-4">
          Mirror input
          <input type="checkbox" className="toggle toggle-sm" checked={r.mirror} onChange={(e) => r.setMirror(e.target.checked)} />
        </label>
      </div>

      <main className="mx-auto grid max-w-5xl gap-4 p-4 md:grid-cols-2">
        {r.status === "error" && (
          <div role="alert" className="alert alert-error md:col-span-2">
            <span>{r.error}</span>
          </div>
        )}
        <CameraStage videoRef={r.videoRef} canvasRef={r.canvasRef} status={r.status} recording={r.recording} />

        <div className="flex flex-col gap-4">
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">{r.recording ? "Listening…" : "Result"}</h2>
              <Predictions top={shown} live={r.recording} />
            </div>
          </div>
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="card-title">History</h2>
              <History items={r.history} />
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <Vocabulary labels={r.labels} />
        </div>
      </main>
    </div>
  );
}
