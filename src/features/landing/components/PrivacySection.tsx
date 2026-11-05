import { IconShieldLock } from "@tabler/icons-react";

export default function PrivacySection() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8">
      <div role="alert" className="alert">
        <IconShieldLock size={24} />
        <span>Camera video stays in your browser and is never uploaded.</span>
      </div>
    </section>
  );
}
