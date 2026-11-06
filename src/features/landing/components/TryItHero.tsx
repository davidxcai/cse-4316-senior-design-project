import { Link } from "@tanstack/react-router";
import { IconArrowRight, IconRefresh } from "@tabler/icons-react";
import CameraView from "../../../components/signing/CameraView";
import SignVideo from "../../../components/signing/SignVideo";
import { useTryItDemo } from "../hooks/useTryItDemo";
import { HELLO_CLIP } from "../tryItConfig";

export default function TryItHero() {
  const demo = useTryItDemo();
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8">
      <div className="grid gap-4 md:grid-cols-2">
        <SignVideo clip={HELLO_CLIP} />
        <CameraView camera={demo.camera} phase={demo.phase} verdict={demo.verdict} />
      </div>
      <div className="mt-6 flex flex-col items-center gap-4">
        <h1 className="text-3xl font-bold">HELLO</h1>
        {demo.verdict && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {demo.verdict === "correct" && <span className="text-xl font-semibold">Nice job!</span>}
            <button type="button" className="btn btn-ghost" onClick={demo.retry}>
              <IconRefresh size={20} />
              Retry
            </button>
            {demo.verdict === "correct" && (
              <Link to="/sign-up" className="btn btn-primary">
                Learn more
                <IconArrowRight size={20} />
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
