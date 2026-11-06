import { useEffect, useRef } from "react";

/** Maps `KeyboardEvent.key` ("ArrowLeft", " ", …) to a handler. */
export type HotkeyMap = Partial<Record<string, () => void>>;

/** True when the key should go to the focused element instead of a page shortcut. */
function belongsToTarget(e: KeyboardEvent): boolean {
  const el = e.target as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable || el.closest("input, textarea, select")) return true;
  // Space/Enter on a focused button or link activate it natively.
  return (e.key === " " || e.key === "Enter") && !!el.closest("button, a, [role='button']");
}

/**
 * Window-level shortcuts. Skips modified keys, auto-repeat, and keys the focused field or button owns.
 * The map is read through a ref, so a new object each render doesn't re-subscribe.
 */
export function useHotkeys(map: HotkeyMap, enabled = true) {
  const mapRef = useRef(map);
  mapRef.current = map;

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (belongsToTarget(e)) return;
      const handler = mapRef.current[e.key];
      if (!handler) return;
      e.preventDefault();
      handler();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}
