# useCameraDevices / useCameraPreference

- `useCameraDevices()` lists `videoinput` devices via `enumerateDevices()` and refreshes on `devicechange`. It never calls `getUserMedia`, so it can't trigger a permission prompt. Before permission is granted browsers return empty labels (shown as "Camera N") and often empty `deviceId`s; the profile page disables those options.
- `useCameraPreference()` returns `[deviceId | null, setDeviceId]`, stored in `localStorage` under `signify.cameraId`. `null` = default camera. Built on `useSyncExternalStore` so every consumer in the tab (and other tabs, via `storage`) stays in sync. All storage access is in try/catch.
- Camera pages pass the preference to the recognizer's `start()` once it accepts `deviceId`. A stored id that is no longer plugged in is kept in storage (the device may return) but the picker shows "Default".
