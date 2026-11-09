import { IconLogout } from "@tabler/icons-react";
import { useAuth } from "../../hooks/useAuth";
import { useAsyncAction } from "../../hooks/useAsyncAction";

export default function SignOutButton() {
  const { signOut } = useAuth();
  const { run, pending } = useAsyncAction();
  return (
    <button type="button" className="btn" disabled={pending} onClick={() => void run(signOut)}>
      {pending ? <span className="loading loading-spinner loading-sm" /> : <IconLogout size={20} aria-hidden />}
      Sign out
    </button>
  );
}
