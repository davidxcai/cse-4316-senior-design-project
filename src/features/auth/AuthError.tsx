import { IconAlertCircle } from "@tabler/icons-react";

export default function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="alert alert-error">
      <IconAlertCircle size={20} aria-hidden />
      <span>{message}</span>
    </div>
  );
}
