"""Extract per-frame landmarks for every video in data/subset.csv -> /Volumes/Extreme SSD/asl-landmarks/<video>.npz

One pass, everything saved, so feature choices (hands / pose / face) can change later
without re-extracting. Arrays per clip (T = number of frames, NaN where not detected):
  hands  [T, 2, 21, 3]   index 0 = MediaPipe "Left", 1 = "Right" (labels assume a mirrored image)
  pose   [T, 33, 4]      x, y, z, visibility
  face   [T, 478, 3]     face mesh incl. iris
  blend  [T, 52]         face blendshape scores (expressions: brows, mouth, ...)
x, y are normalized image coordinates, z is relative depth.
Resumable: clips that already have an .npz are skipped.

Usage: python extract.py [workers=8]
"""
import csv, sys, time
from multiprocessing import Pool
from pathlib import Path
import cv2
import numpy as np
from mediapipe import Image, ImageFormat
from mediapipe.tasks.python import BaseOptions, vision

ROOT = Path("/Volumes/Extreme SSD/ASL_Citizen.zip/ASL_Citizen/videos")
MODELS = Path("models")
OUT = Path("/Volumes/Extreme SSD/asl-landmarks")  # on the SSD: the internal disk is nearly full


def make_landmarkers():
    def base(name):
        return BaseOptions(model_asset_path=str(MODELS / name))
    mode = vision.RunningMode.VIDEO
    hand = vision.HandLandmarker.create_from_options(vision.HandLandmarkerOptions(
        base_options=base("hand_landmarker.task"), running_mode=mode, num_hands=2))
    pose = vision.PoseLandmarker.create_from_options(vision.PoseLandmarkerOptions(
        base_options=base("pose_landmarker_lite.task"), running_mode=mode))
    face = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(
        base_options=base("face_landmarker.task"), running_mode=mode, output_face_blendshapes=True))
    return hand, pose, face


def extract(path):
    hand, pose, face = make_landmarkers()  # fresh per video: VIDEO mode tracks across frames
    cap = cv2.VideoCapture(str(path))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    H, P, F, B = [], [], [], []
    i = 0
    while True:
        ok, bgr = cap.read()
        if not ok:
            break
        img = Image(ImageFormat.SRGB, cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
        ts = int(i * 1000 / fps)
        h = np.full((2, 21, 3), np.nan, np.float32)
        hr = hand.detect_for_video(img, ts)
        for lms, side in zip(hr.hand_landmarks, hr.handedness):
            h[0 if side[0].category_name == "Left" else 1] = [[p.x, p.y, p.z] for p in lms]
        p = np.full((33, 4), np.nan, np.float32)
        pr = pose.detect_for_video(img, ts)
        if pr.pose_landmarks:
            p[:] = [[q.x, q.y, q.z, q.visibility] for q in pr.pose_landmarks[0]]
        f = np.full((478, 3), np.nan, np.float32)
        b = np.full(52, np.nan, np.float32)
        fr = face.detect_for_video(img, ts)
        if fr.face_landmarks:
            f[:] = [[q.x, q.y, q.z] for q in fr.face_landmarks[0]]
            b[:] = [c.score for c in fr.face_blendshapes[0]]
        H.append(h); P.append(p); F.append(f); B.append(b)
        i += 1
    cap.release()
    return dict(hands=np.stack(H), pose=np.stack(P), face=np.stack(F), blend=np.stack(B))


def work(video):
    out = OUT / (Path(video).stem + ".npz")
    if out.exists():
        return video, None
    try:
        data = extract(ROOT / video)
        np.savez(out.with_suffix(".tmp.npz"), **data)  # write then rename: no half-written files
        out.with_suffix(".tmp.npz").rename(out)
        return video, len(data["hands"])
    except Exception as e:  # keep the batch going; failures are reported at the end
        return video, f"ERROR {e!r}"


if __name__ == "__main__":
    workers = int(sys.argv[1]) if len(sys.argv) > 1 else 8
    OUT.mkdir(parents=True, exist_ok=True)
    videos = [r["video"] for r in csv.DictReader(open("data/subset.csv", newline=""))]
    todo = [v for v in videos if not (OUT / (Path(v).stem + ".npz")).exists()]
    print(f"{len(videos)} clips, {len(videos) - len(todo)} done, {len(todo)} to do, {workers} workers", flush=True)
    t0, errors = time.time(), []
    with Pool(workers) as pool:
        for n, (video, res) in enumerate(pool.imap_unordered(work, todo), 1):
            if isinstance(res, str):
                errors.append((video, res))
            if n % 25 == 0 or n == len(todo):
                el = time.time() - t0
                print(f"{n}/{len(todo)}  {el/60:.1f} min elapsed  ~{el/n*(len(todo)-n)/60:.1f} min left", flush=True)
    print(f"finished; {len(errors)} errors")
    for v, e in errors:
        print(v, e)
