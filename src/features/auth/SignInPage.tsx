import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { IconLogin } from "@tabler/icons-react";
import { useAuth } from "../../hooks/useAuth";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import AuthCard from "./AuthCard";
import AuthError from "./AuthError";
import CredentialFields from "./CredentialFields";

export default function SignInPage() {
  const { signIn } = useAuth();
  const { run, pending, error } = useAsyncAction();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void run(() => signIn(email.trim(), password));
  };

  return (
    <AuthCard>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <CredentialFields
          mode="sign-in"
          email={email}
          password={password}
          onEmail={setEmail}
          onPassword={setPassword}
        />
        <AuthError message={error} />
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? <span className="loading loading-spinner loading-sm" /> : <IconLogin size={20} aria-hidden />}
          Sign in
        </button>
      </form>
      <Link to="/sign-up" className="link text-center">
        Sign up
      </Link>
    </AuthCard>
  );
}
