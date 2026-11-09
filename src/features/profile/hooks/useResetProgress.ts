import { useMutation, useQueryClient } from "@tanstack/react-query";
import { lessonProgressKeys } from "../../../api/lessonProgress";
import { completionKeys, resetProgress } from "../../../api/progress";
import { weakSignKeys } from "../../../api/weakSigns";

/**
 * Deletes all progress. Not optimistic: `isPending` lasts until completions and weak signs have refetched.
 * Cached resume points are dropped (they are read once per lesson with staleTime Infinity).
 */
export function useResetProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resetProgress,
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: lessonProgressKeys.all });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: completionKeys.all }),
        queryClient.invalidateQueries({ queryKey: weakSignKeys.all }),
      ]);
    },
  });
}
