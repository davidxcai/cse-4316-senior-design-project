"""Extract hand + shoulder landmarks from isolated letter videos for evaluating the J/Z motion check.

Sources (validation only, not training data; see memory/notes on why):
  SignAlphaSet ASL_dynamic/<A-Z>/*.avi    (10 clips per letter, 1-2 signers, some labels doubtful)
  WLASL letter clips  <letter>__<source>__<id>.mp4  (2 per letter, no C/L/X/Y/Z, private research use only)

Output: one JSON file whose clips use the web app's Frame layout (src/types/sign.ts), so the TypeScript
checker runs on exactly what it would see in the browser:
  {"clips": [{"id", "label", "source", "aspect", "frames": [{"t", "hands": [63 floats | null, ...], "shoulders"}]}]}
Hand slot 0 = MediaPipe "Left", 1 = "Right", fed the raw unmirrored frame (same as ml/extract.py and landmarkers.ts).

Usage (from ml/): .venv/bin/python extract_motion_eval.py [workers=6]
"""
import json, sys
from multiprocessing import Pool
from pathlib import Path
import cv2
from mediapipe import Image, ImageFormat
from mediapipe.tasks.python import BaseOptions, vision

DATA = Path("/Volumes/Extreme SSD/senior-design-asl")
SIGNALPHA = DATA / "SignAlphaSet/extracted/ASL_dynamic"
WLASL = DATA / "WLASL-letters-numbers/videos"
OUT = DATA / "motion-eval/landmarks.json"
MODELS = Path("models")


def clips():
    for d in sorted(SIGNALPHA.iterdir()):
        if d.is_dir() and len(d.name) == 1:
            for v in sorted(d.glob("*.avi")):
                yield v, d.name, "signalphaset"
    for v in sorted(WLASL.glob("*.mp4")):
        letter = v.name.split("__")[0]
        if len(letter) == 1:
            yield v, letter.upper(), "wlasl"


def extract(job):
    path, label, source = job
    mode = vision.RunningMode.VIDEO
    hand = vision.HandLandmarker.create_from_options(vision.HandLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=str(MODELS / "hand_landmarker.task")), running_mode=mode, num_hands=2))
    pose = vision.PoseLandmarker.create_from_options(vision.PoseLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=str(MODELS / "pose_landmarker_lite.task")), running_mode=mode))
    cap = cv2.VideoCapture(str(path))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    w, h = cap.get(cv2.CAP_PROP_FRAME_WIDTH), cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
    frames, i = [], 0
    while True:
        ok, bgr = cap.read()
        if not ok:
            break  # also stops at undecodable frames (one SignAlphaSet I clip has one)
        img = Image(ImageFormat.SRGB, cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
        t = int(i * 1000 / fps)
        hands = [None, None]
        hr = hand.detect_for_video(img, t)
        for lms, side in zip(hr.hand_landmarks, hr.handedness):
            hands[0 if side[0].category_name == "Left" else 1] = [round(c, 5) for p in lms for c in (p.x, p.y, p.z)]
        pr = pose.detect_for_video(img, t)
        sh = None
        if pr.pose_landmarks:
            q = pr.pose_landmarks[0]
            sh = [[round(q[k].x, 5), round(q[k].y, 5), round(q[k].z, 5)] for k in (11, 12)]
        frames.append({"t": t, "hands": hands, "shoulders": sh})
        i += 1
    cap.release()
    return {"id": path.stem, "label": label, "source": source, "aspect": w / h if h else 4 / 3, "frames": frames}


if __name__ == "__main__":
    workers = int(sys.argv[1]) if len(sys.argv) > 1 else 6
    jobs = list(clips())
    print(f"{len(jobs)} clips", flush=True)
    out = []
    with Pool(workers) as pool:
        for n, c in enumerate(pool.imap_unordered(extract, jobs), 1):
            out.append(c)
            if n % 25 == 0 or n == len(jobs):
                print(f"{n}/{len(jobs)}", flush=True)
    out.sort(key=lambda c: (c["label"], c["source"], c["id"]))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"clips": out}))
    print(f"wrote {OUT}")
