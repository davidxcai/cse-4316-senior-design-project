import { queryOptions } from "@tanstack/react-query";
import type { LessonMode } from "../domain/lessonPlan";
import { parseAnswers, serializeAnswers, type SessionAnswers } from "../domain/lessonSession";
import { supabase } from "./supabase";

/**
 * Resume point of an unfinished lesson (public.lesson_progress). `mode` is the layout the position refers to, kept in
 * the answers jsonb; null for rows saved before it existed.
 */
export type LessonProgress = { stepIndex: number; itemIndex: number; seed: number; mode: LessonMode | null; answers: SessionAnswers };

type Row = { step_index: number; item_index: number; seed: number; answers: unknown };

/** The user's saved position in a lesson, or null when there is none. */
export async function fetchLessonProgress(userId: string, lessonId: string): Promise<LessonProgress | null> {
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("step_index, item_index, seed, answers")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle<Row>();
  if (error) throw error;
  return data ? { stepIndex: data.step_index, itemIndex: data.item_index, seed: data.seed, ...parseAnswers(data.answers) } : null;
}

/** Insert or overwrite the signed-in user's row for this lesson. user_id and updated_at are set by the database. */
export async function saveLessonProgress(lessonId: string, p: LessonProgress & { mode: LessonMode }): Promise<void> {
  const { error } = await supabase.from("lesson_progress").upsert(
    {
      lesson_id: lessonId,
      step_index: p.stepIndex,
      item_index: p.itemIndex,
      seed: p.seed,
      answers: serializeAnswers(p.answers, p.mode),
    },
    { onConflict: "user_id,lesson_id" },
  );
  if (error) throw error;
}

/** Forget the resume point (on completion or Redo). RLS limits it to the user's own row. */
export async function clearLessonProgress(lessonId: string): Promise<void> {
  const { error } = await supabase.from("lesson_progress").delete().eq("lesson_id", lessonId);
  if (error) throw error;
}

export const lessonProgressKeys = {
  all: ["lessonProgress"] as const,
  one: (userId: string, lessonId: string) => ["lessonProgress", userId, lessonId] as const,
};

export const lessonProgressQueryOptions = (userId: string, lessonId: string) =>
  queryOptions({
    queryKey: lessonProgressKeys.one(userId, lessonId),
    queryFn: () => fetchLessonProgress(userId, lessonId),
    // Read once when the lesson opens; the session owns the live position after that.
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
