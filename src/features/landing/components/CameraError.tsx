import type { ComponentType } from "react";
import { IconAlertTriangle, IconCameraExclamation, IconLock, IconVideoOff } from "@tabler/icons-react";
import type { RecognizerErrorCode } from "../../../recognition";

const ERRORS: Record<RecognizerErrorCode, { Icon: ComponentType<{ size?: number }>; text: string }> = {
  "not-found": { Icon: IconVideoOff, text: "No webcam detected" },
  "not-allowed": { Icon: IconLock, text: "Camera blocked" },
  "in-use": { Icon: IconCameraExclamation, text: "Camera in use" },
  "model-load": { Icon: IconAlertTriangle, text: "Model failed to load" },
};

export default function CameraError({ code }: { code: RecognizerErrorCode }) {
  const { Icon, text } = ERRORS[code];
  return (
    <div role="alert" className="alert alert-error alert-soft">
      <Icon size={20} />
      <span>{text}</span>
    </div>
  );
}
