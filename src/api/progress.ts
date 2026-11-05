import { queryOptions } from "@tanstack/react-query";
import { findLesson } from "../domain/curriculum";
import { supabase } from "./supabase";

export type Completion = { lessonId: string; completedAt: Date };

type CompletionRow = { lesson_id: string; completed_at: string };

const COLUMNS = "lesson_id, completed_at";

/** PostgREST caps a response at max-rows (1000 by default), so read in pages. */
const PAGE_SIZE = 1000;

const toCompletion = (row: CompletionRow): Completion => ({
  lessonId: row.lesson_id,
  completedAt: new Date(row.completed_at),
});

/** Every completion of the user, oldest first. */
export async function fetchCompletions(userId: string): Promise<Completion[]> {
  const out: Completion[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("lesson_completions")
      .select(COLUMNS)
      .eq("user_id", userId)
      .order("completed_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
      .returns<CompletionRow[]>();
    if (error) throw error;
    out.push(...data.map(toCompletion));
    if (data.length < PAGE_SIZE) return out;
  }
}

/**
 * Records one completion for the signed-in user. Only lesson_id is sent: user_id and completed_at are filled
 * by the database (column grants in the migration). Invalidate `completionKeys.all` afterwards.
 */
export async function completeLesson(lessonId: string): Promise<Completion> {
  if (!findLesson(lessonId)) throw new Error(`Unknown lesson id: ${lessonId}`);
  const { data, error } = await supabase
    .from("lesson_completions")
    .insert({ lesson_id: lessonId })
    .select(COLUMNS)
    .single<CompletionRow>();
  if (error) throw error;
  return toCompletion(data);
}

export const completionKeys = {
  all: ["completions"] as const,
  list: (userId: string) => ["completions", userId] as const,
};

export const completionsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: completionKeys.list(userId),
    queryFn: () => fetchCompletions(userId),
    // Only this user's own completeLesson() changes it, and that invalidates.
    staleTime: 5 * 60 * 1000,
  });
