import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profileKeys, updateProfile, type ProfileUpdate } from "../../../api/profiles";
import { useAuth } from "../../../hooks/useAuth";

/**
 * Saves name / dominant hand. Not optimistic: `isPending` stays true until the profile query has refetched,
 * so when it clears, `useAuth().user` (and the sidebar name) already show the new value.
 */
export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: ProfileUpdate) => {
      if (!user) throw new Error("Not signed in");
      return updateProfile(user.id, patch);
    },
    onSuccess: () => {
      if (user) return queryClient.invalidateQueries({ queryKey: profileKeys.detail(user.id) });
    },
  });
}
