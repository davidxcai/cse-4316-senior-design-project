import { queryOptions } from "@tanstack/react-query";
import { supabase } from "./supabase";

export type DominantHand = "left" | "right";

export type Profile = { id: string; name: string; dominantHand: DominantHand };

export type ProfileUpdate = Partial<Pick<Profile, "name" | "dominantHand">>;

type ProfileRow = { id: string; name: string; dominant_hand: string };

const COLUMNS = "id, name, dominant_hand";

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    dominantHand: row.dominant_hand === "left" ? "left" : "right",
  };
}

/** Returns null when the row doesn't exist (or RLS hides it). */
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(COLUMNS)
    .eq("id", userId)
    .maybeSingle<ProfileRow>();
  if (error) throw error;
  return data ? toProfile(data) : null;
}

/** Only name and dominant_hand are writable (column grants in the migration). */
export async function updateProfile(userId: string, patch: ProfileUpdate): Promise<Profile> {
  const row: Partial<Omit<ProfileRow, "id">> = {};
  if (patch.name !== undefined) row.name = patch.name.trim();
  if (patch.dominantHand !== undefined) row.dominant_hand = patch.dominantHand;

  const { data, error } = await supabase
    .from("profiles")
    .update(row)
    .eq("id", userId)
    .select(COLUMNS)
    .single<ProfileRow>();
  if (error) throw error;
  return toProfile(data);
}

export const profileKeys = {
  all: ["profile"] as const,
  detail: (userId: string) => ["profile", userId] as const,
};

/** Use `profileKeys.detail(userId)` to invalidate after an edit. */
export const profileQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: profileKeys.detail(userId),
    queryFn: () => fetchProfile(userId),
    staleTime: 5 * 60 * 1000,
    // Auth status waits on this query; don't sit through the default 3 retries.
    retry: 1,
  });
