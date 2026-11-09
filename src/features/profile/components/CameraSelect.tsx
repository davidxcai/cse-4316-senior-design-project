import { IconCamera } from "@tabler/icons-react";
import { useCameraDevices } from "../../../hooks/useCameraDevices";
import { useCameraPreference } from "../../../hooks/useCameraPreference";
import SettingRow from "./SettingRow";

export default function CameraSelect() {
  const devices = useCameraDevices();
  const [cameraId, setCameraId] = useCameraPreference();
  const value = devices.some((d) => d.deviceId && d.deviceId === cameraId) ? cameraId! : "";
  return (
    <SettingRow Icon={IconCamera} label="Camera">
      <select className="select" value={value} onChange={(e) => setCameraId(e.target.value || null)}>
        <option value="">Default</option>
        {devices.map((d, i) => (
          // before permission, browsers may hide deviceIds; those can't be chosen
          <option key={d.deviceId || i} value={d.deviceId} disabled={!d.deviceId}>
            {d.label}
          </option>
        ))}
      </select>
    </SettingRow>
  );
}
