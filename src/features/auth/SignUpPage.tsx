import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import type { AuthUser } from "../../auth/AuthProvider";
import AuthCard from "./AuthCard";
import AccountStep from "./AccountStep";
import ProfileStep from "./ProfileStep";

export default function SignUpPage() {
  const { signUp } = useAuth();
  const { run, pending, error } = useAsyncAction();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [hand, setHand] = useState<AuthUser["dominantHand"]>("right");

  const submit = () =>
    void run(() => signUp({ email: email.trim(), password, name: name.trim(), dominantHand: hand }));

  return (
    <AuthCard step={`${step}/2`}>
      {step === 1 ? (
        <AccountStep
          email={email}
          password={password}
          onEmail={setEmail}
          onPassword={setPassword}
          onNext={() => setStep(2)}
        />
      ) : (
        <ProfileStep
          name={name}
          hand={hand}
          pending={pending}
          error={error}
          onName={setName}
          onHand={setHand}
          onBack={() => setStep(1)}
          onSubmit={submit}
        />
      )}
    </AuthCard>
  );
}
