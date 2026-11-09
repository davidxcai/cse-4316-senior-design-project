import type { FormEvent } from "react";
import { IconArrowLeft, IconArrowRight, IconArrowsLeftRight, IconUser } from "@tabler/icons-react";
import type { AuthUser } from "../../auth/AuthProvider";
import AuthError from "./AuthError";

type Hand = AuthUser["dominantHand"];

type Props = {
  name: string;
  hand: Hand;
  pending: boolean;
  error: string | null;
  onName: (v: string) => void;
  onHand: (v: Hand) => void;
  onBack: () => void;
  onSubmit: () => void;
};

export default function ProfileStep({ name, hand, pending, error, onName, onHand, onBack, onSubmit }: Props) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <fieldset className="fieldset">
        <label className="input w-full">
          <IconUser size={18} aria-hidden />
          <input
            type="text"
            name="name"
            required
            maxLength={50}
            autoComplete="name"
            placeholder="Name"
            aria-label="Name"
            value={name}
            onChange={(e) => onName(e.target.value)}
          />
        </label>
      </fieldset>
      <div className="flex items-center gap-2">
        <IconArrowsLeftRight size={20} aria-hidden />
        <div className="join flex-1" role="radiogroup" aria-label="Dominant hand">
          {/* Left on the left, Right on the right (user decision; overrides the wireframe's Right/Left order). */}
          <input
            type="radio"
            name="dominantHand"
            className="join-item btn flex-1"
            aria-label="Left"
            checked={hand === "left"}
            onChange={() => onHand("left")}
          />
          <input
            type="radio"
            name="dominantHand"
            className="join-item btn flex-1"
            aria-label="Right"
            checked={hand === "right"}
            onChange={() => onHand("right")}
          />
        </div>
      </div>
      <AuthError message={error} />
      <div className="flex gap-2">
        <button type="button" className="btn btn-ghost" onClick={onBack} disabled={pending} aria-label="Back">
          <IconArrowLeft size={20} aria-hidden />
        </button>
        <button type="submit" className="btn btn-primary flex-1" disabled={pending}>
          {pending ? <span className="loading loading-spinner loading-sm" /> : <IconArrowRight size={20} aria-hidden />}
          Start
        </button>
      </div>
    </form>
  );
}
