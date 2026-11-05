import { IconPlayerPlay } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { useResumeTarget } from "../hooks/useResumeTarget";

/** Hidden when there is nothing to resume. */
export default function ResumeButton() {
  const target = useResumeTarget();
  if (!target) return null;
  return (
    <Link to="/lesson/$lessonId" params={{ lessonId: target.lessonId }} className="btn btn-primary">
      <IconPlayerPlay size={20} />
      Resume Unit {target.unitId}
    </Link>
  );
}
