import { IconCamera } from "@tabler/icons-react";

export default function StartCameraButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="btn btn-primary" onClick={onClick}>
      <IconCamera size={20} />
      Start camera
    </button>
  );
}
