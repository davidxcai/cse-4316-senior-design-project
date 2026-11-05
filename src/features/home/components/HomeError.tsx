import { IconAlertTriangle } from "@tabler/icons-react";

export default function HomeError() {
  return (
    <div role="alert" className="alert alert-error alert-soft py-2">
      <IconAlertTriangle size={20} />
      <span>Couldn't load</span>
    </div>
  );
}
