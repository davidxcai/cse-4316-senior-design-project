import { useEffect, useState } from "react";

/**
 * Whether the device has a camera: null while checking. Uses enumerateDevices, which lists a `videoinput` entry
 * (without a label) before permission is granted, so this never prompts. No mediaDevices at all (insecure context,
 * old browser) = false. If enumeration fails we assume a camera, since camera is the preferred layout.
 */
export function useCameraAvailable(): boolean | null {
  const [available, setAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    const devices = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
    if (!devices?.enumerateDevices) {
      setAvailable(false);
      return;
    }
    let live = true;
    const check = () =>
      devices
        .enumerateDevices()
        .then((list) => live && setAvailable(list.some((d) => d.kind === "videoinput")))
        .catch(() => live && setAvailable(true));
    void check();
    devices.addEventListener("devicechange", check);
    return () => {
      live = false;
      devices.removeEventListener("devicechange", check);
    };
  }, []);
  return available;
}
