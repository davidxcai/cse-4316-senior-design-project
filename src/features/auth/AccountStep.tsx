import type { FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { IconArrowRight } from "@tabler/icons-react";
import CredentialFields from "./CredentialFields";

type Props = {
  email: string;
  password: string;
  onEmail: (v: string) => void;
  onPassword: (v: string) => void;
  onNext: () => void;
};

export default function AccountStep({ email, password, onEmail, onPassword, onNext }: Props) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <CredentialFields mode="sign-up" email={email} password={password} onEmail={onEmail} onPassword={onPassword} />
        <button type="submit" className="btn btn-primary">
          <IconArrowRight size={20} aria-hidden />
          Next
        </button>
      </form>
      <Link to="/sign-in" className="link text-center">
        Sign in
      </Link>
    </>
  );
}
