import { IconAlertTriangle } from "@tabler/icons-react";

export default function SaveError() {
  return (
    <div role="alert" className="alert alert-error alert-soft py-2">
      <IconAlertTriangle size={20} />
      <span>Couldn't save</span>
    </div>
  );
}
