import { useCallback, useEffect, useState } from "react";
import type { Item } from "../../../recognition";
import { DEV_REFERENCE_URL, loadReference, type RefSet } from "../referenceClips";

/**
 * Reference landmark clips, keeping only `scope`'s words. Under `npm run dev` the committed file in dev-data/ loads on
 * its own; `pick` loads another file (e.g. a newer export, or on a build where dev-data/ isn't served).
 */
export function useReferenceFile(scope: readonly Item[]) {
  const [set, setSet] = useState<RefSet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (get: () => Promise<Blob>, signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const next = await loadReference(await get(), scope);
        if (!signal?.aborted) setSet(next);
      } catch (e) {
        if (!signal?.aborted) setError((e as Error).message);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [scope],
  );

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const ac = new AbortController();
    void load(async () => {
      const res = await fetch(DEV_REFERENCE_URL, { signal: ac.signal });
      if (!res.ok) throw new Error(`reference ${res.status}`);
      return res.blob();
    }, ac.signal);
    return () => ac.abort();
  }, [load]);

  const pick = useCallback((file: File | undefined) => (file ? load(async () => file) : Promise.resolve()), [load]);

  return { set, loading, error, pick };
}
