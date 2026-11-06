import { Fragment, type ComponentType } from "react";
import { IconArrowRight, IconBook, IconHandStop, IconScan } from "@tabler/icons-react";

const STEPS: { Icon: ComponentType<{ size?: number }>; label: string }[] = [
  { Icon: IconBook, label: "Learn" },
  { Icon: IconScan, label: "Recognize" },
  { Icon: IconHandStop, label: "Sign" },
];

export default function HowItWorksSection() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8">
      <h2 className="mb-6 text-2xl font-bold">How it works</h2>
      <div className="flex items-center justify-center gap-4 sm:gap-8">
        {STEPS.map(({ Icon, label }, i) => (
          <Fragment key={label}>
            {i > 0 && <IconArrowRight size={24} className="text-base-content/50" />}
            <div className="flex flex-col items-center gap-2">
              <span className="grid size-16 place-items-center rounded-box bg-primary text-primary-content">
                <Icon size={32} />
              </span>
              <span className="font-semibold">{label}</span>
            </div>
          </Fragment>
        ))}
      </div>
    </section>
  );
}
