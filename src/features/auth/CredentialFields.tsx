import { IconLock, IconMail } from "@tabler/icons-react";

export const MIN_PASSWORD_LENGTH = 6;

type Props = {
  email: string;
  password: string;
  onEmail: (v: string) => void;
  onPassword: (v: string) => void;
  /** sign-in reuses a saved password; sign-up creates a new one */
  mode: "sign-in" | "sign-up";
};

export default function CredentialFields({ email, password, onEmail, onPassword, mode }: Props) {
  const isNew = mode === "sign-up";
  return (
    <fieldset className="fieldset">
      <label className="input w-full">
        <IconMail size={18} aria-hidden />
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="Email"
          aria-label="Email"
          value={email}
          onChange={(e) => onEmail(e.target.value)}
        />
      </label>
      <label className="input w-full">
        <IconLock size={18} aria-hidden />
        <input
          type="password"
          name="password"
          required
          minLength={isNew ? MIN_PASSWORD_LENGTH : undefined}
          autoComplete={isNew ? "new-password" : "current-password"}
          placeholder="Password"
          aria-label="Password"
          value={password}
          onChange={(e) => onPassword(e.target.value)}
        />
      </label>
    </fieldset>
  );
}
