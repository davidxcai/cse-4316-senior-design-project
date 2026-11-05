import { resumeTarget } from "../../../domain/progress";
import { useUnitOverview } from "../../../hooks/useUnitOverview";

/** Where "Resume" goes, derived from the unit overview. null while loading or when nothing to resume. */
export function useResumeTarget() {
  const { data } = useUnitOverview();
  return data ? resumeTarget(data) : null;
}
