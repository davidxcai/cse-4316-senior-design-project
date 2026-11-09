import { useCallback, useSyncExternalStore } from "react";

const KEY = "signify.cameraId";
const listeners = new Set<() => void>();

function read(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY || e.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** The camera chosen on the profile page, per browser. null = default camera. */
export function useCameraPreference(): [string | null, (deviceId: string | null) => void] {
  const deviceId = useSyncExternalStore(subscribe, read, () => null);
  const setDeviceId = useCallback((next: string | null) => {
    try {
      if (next) localStorage.setItem(KEY, next);
      else localStorage.removeItem(KEY);
    } catch {
      // storage unavailable: the choice just doesn't persist
    }
    listeners.forEach((l) => l());
  }, []);
  return [deviceId, setDeviceId];
}
