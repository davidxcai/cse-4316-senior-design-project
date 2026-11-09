import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { completionsQueryOptions, type Completion } from "../api/progress";
import { useAuth } from "./useAuth";

/** The signed-in user's completions, oldest first. Stays pending while signed out (query disabled). */
export function useCompletions(): UseQueryResult<Completion[]> {
  const { user } = useAuth();
  return useQuery({ ...completionsQueryOptions(user?.id ?? ""), enabled: !!user });
}
