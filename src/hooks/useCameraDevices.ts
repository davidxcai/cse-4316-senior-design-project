import { useEffect, useState } from "react";

export type CameraDevice = { deviceId: string; label: string };

async function listCameras(): Promise<CameraDevice[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  const all = await navigator.mediaDevices.enumerateDevices();
  return all
    .filter((d) => d.kind === "videoinput")
    .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Camera ${i + 1}` }));
}

/**
 * Video input devices, refreshed on 'devicechange'. Never requests camera permission, so labels are
 * empty (shown as "Camera N") and deviceIds may be empty until the user has granted access elsewhere.
 */
export function useCameraDevices(): CameraDevice[] {
  const [devices, setDevices] = useState<CameraDevice[]>([]);

  useEffect(() => {
    let alive = true;
    const refresh = () =>
      listCameras()
        .then((d) => alive && setDevices(d))
        .catch(() => alive && setDevices([]));
    void refresh();
    navigator.mediaDevices?.addEventListener("devicechange", refresh);
    return () => {
      alive = false;
      navigator.mediaDevices?.removeEventListener("devicechange", refresh);
    };
  }, []);

  return devices;
}
