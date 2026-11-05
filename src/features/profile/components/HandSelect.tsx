import { IconArrowsLeftRight } from "@tabler/icons-react";
import type { DominantHand } from "../../../api/profiles";
import { useAuth } from "../../../hooks/useAuth";
import { useUpdateProfile } from "../hooks/useUpdateProfile";
import SaveError from "./SaveError";
import SettingRow from "./SettingRow";

export default function HandSelect() {
  const { user } = useAuth();
  const { mutate, isPending, isError, variables } = useUpdateProfile();
  if (!user) return null;
  // while saving, show the chosen value on the disabled control; on error it falls back to the saved one
  const value = isPending && variables?.dominantHand ? variables.dominantHand : user.dominantHand;
  return (
    <div className="flex flex-col gap-2">
      <SettingRow Icon={IconArrowsLeftRight} label="Hand">
        <select
          className="select"
          value={value}
          disabled={isPending}
          onChange={(e) => mutate({ dominantHand: e.target.value as DominantHand })}
        >
          <option value="right">Right</option>
          <option value="left">Left</option>
        </select>
      </SettingRow>
      {isError && <SaveError />}
    </div>
  );
}
