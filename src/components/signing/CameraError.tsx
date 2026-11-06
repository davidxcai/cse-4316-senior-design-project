import type { ComponentType } from "react";
import { IconAlertTriangle, IconCameraExclamation, IconLock, IconRefresh, IconVideoOff } from "@tabler/icons-react";
import type { RecognizerErrorCode } from "../../recognition";

const ERRORS: Record<RecognizerErrorCode, { Icon: ComponentType<{ size?: number }>; text: string; detail?: string }> = {
  "not-found": { Icon: IconVideoOff, text: "No webcam detected", detail: "A webcam is required" },
  "not-allowed": { Icon: IconLock, text: "Camera blocked" },
  "in-use": { Icon: IconCameraExclamation, text: "Camera in use" },
  "model-load": { Icon: IconAlertTriangle, text: "Model failed to load" },
};

/** C.1–C.3 (+ model load). Camera in use offers Retry [C.3]. */
export default function CameraError({ code, onRetry }: { code: RecognizerErrorCode; onRetry: () => void }) {
  const { Icon, text, detail } = ERRORS[code];
  return (
    <div role="alert" className="alert alert-error alert-soft">
      <Icon size={20} />
      <div className="flex flex-col">
        <span>{text}</span>
        {detail && <span className="text-sm opacity-80">{detail}</span>}
      </div>
      {code === "in-use" && (
        <button type="button" className="btn btn-sm" onClick={onRetry}>
          <IconRefresh size={16} />
          Retry
        </button>
      )}
    </div>
  );
}
