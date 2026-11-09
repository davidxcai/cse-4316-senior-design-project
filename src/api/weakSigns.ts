import { queryOptions } from "@tanstack/react-query";
import type { Item } from "../recognition";
import { itemFromKey, itemKey } from "../domain/signContent";
import { supabase } from "./supabase";

/** An item the user missed (or needed the hint for) in a Sign step (public.weak_signs) [S.23]. */
export type WeakSign = { item: Item; misses: number; correctStreak: number; updatedAt: Date };

type Row = { item_key: string; misses: number; correct_streak: number; updated_at: string };

/** Every weak item of the user, most recently missed/updated first. Rows with unknown keys are skipped. */
export async function fetchWeakSigns(userId: string): Promise<WeakSign[]> {
  const { data, error } = await supabase
    .from("weak_signs")
    .select("item_key, misses, correct_streak, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .returns<Row[]>();
  if (error) throw error;
  return data.flatMap((row) => {
    const item = itemFromKey(row.item_key);
    return item ? [{ item, misses: row.misses, correctStreak: row.correct_streak, updatedAt: new Date(row.updated_at) }] : [];
  });
}

/** A Sign miss: adds the item, or counts one more miss and resets its correct streak (atomic, in SQL). */
export async function recordWeakMiss(item: Item): Promise<void> {
  const { error } = await supabase.rpc("record_weak_miss", { p_item_key: itemKey(item) });
  if (error) throw error;
}

export const weakSignKeys = {
  all: ["weakSigns"] as const,
  list: (userId: string) => ["weakSigns", userId] as const,
};

export const weakSignsQueryOptions = (userId: string) =>
  queryOptions({ queryKey: weakSignKeys.list(userId), queryFn: () => fetchWeakSigns(userId) });
