import type { ReactNode } from "react";
import { IconHandStop } from "@tabler/icons-react";

type Props = {
  /** e.g. "1/2" in sign-up */
  step?: string;
  children: ReactNode;
};

export default function AuthCard({ step, children }: Props) {
  return (
    <div className="flex justify-center p-4">
      <div className="card bg-base-100 w-full max-w-sm shadow-md">
        <div className="card-body gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xl font-bold">
              <IconHandStop size={26} aria-hidden />
              signify
            </div>
            {step && <span className="font-mono">{step}</span>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
