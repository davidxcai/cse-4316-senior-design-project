"""Extract hand landmarks from ASL-HG stills (36 classes A-Z, 0-9; 10 signers x 100 burst frames each).

Output: /Volumes/Extreme SSD/senior-design-asl/handshape/asl_hg.npz with
  X       [N, 21, 3]  MediaPipe image landmarks of the chosen hand (x, y in image units, z), x scaled by aspect
  label   [N]         "A".."Z", "0".."9"
  signer  [N]         "P1".."P10"
  frame   [N]         burst index (for subsampling near-duplicates)
  left    [N]         MediaPipe handedness label == "Left" (used to canonicalize chirality, same as the web app)
Images with no detected hand are dropped (counts printed). When two hands are found, the larger one is kept.

Usage (from ml/): .venv/bin/python handshape/extract_hg.py [workers=8]
"""
import os, re, sys
from multiprocessing import Pool
from pathlib import Path
import cv2
import numpy as np
from mediapipe import Image, ImageFormat
from mediapipe.tasks.python import BaseOptions, vision

SRC = Path("/Volumes/Extreme SSD/senior-design-asl/ASL-HG/extracted_raw/asl_dataset")
OUT = Path("/Volumes/Extreme SSD/senior-design-asl/handshape/asl_hg.npz")
MODEL = str(Path("models/hand_landmarker.task").resolve())
_hand = None


def work(path):
    global _hand
    if _hand is None:
        _hand = vision.HandLandmarker.create_from_options(vision.HandLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=MODEL), running_mode=vision.RunningMode.IMAGE, num_hands=2))
    bgr = cv2.imread(str(path))
    if bgr is None:
        return path, None
    h, w = bgr.shape[:2]
    r = _hand.detect(Image(ImageFormat.SRGB, cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)))
    if not r.hand_landmarks:
        return path, None
    def size(lms):
        xs, ys = [p.x * w for p in lms], [p.y * h for p in lms]
        return (max(xs) - min(xs)) * (max(ys) - min(ys))
    k = max(range(len(r.hand_landmarks)), key=lambda i: size(r.hand_landmarks[i]))
    a = w / h
    pts = np.array([[p.x * a, p.y, p.z * a] for p in r.hand_landmarks[k]], np.float32)
    return path, (pts, r.handedness[k][0].category_name == "Left")


if __name__ == "__main__":
    workers = int(sys.argv[1]) if len(sys.argv) > 1 else 8
    jobs = sorted(p for d in SRC.iterdir() if d.is_dir() for p in d.glob("*.jpg"))
    print(f"{len(jobs)} images", flush=True)
    X, label, signer, frame, left, miss = [], [], [], [], [], {}
    with Pool(workers) as pool:
        for n, (p, res) in enumerate(pool.imap_unordered(work, jobs, chunksize=32), 1):
            m = re.match(r"(P\d+)_([A-Z0-9])_(\d+)\.jpg", p.name)
            if res is None:
                miss[m.group(2)] = miss.get(m.group(2), 0) + 1
            else:
                X.append(res[0]); left.append(res[1])
                signer.append(m.group(1)); label.append(m.group(2)); frame.append(int(m.group(3)))
            if n % 2000 == 0:
                print(f"{n}/{len(jobs)}", flush=True)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(OUT, X=np.stack(X), label=np.array(label), signer=np.array(signer), frame=np.array(frame), left=np.array(left))
    print(f"kept {len(X)}; no hand: {sum(miss.values())} {dict(sorted(miss.items()))}")
    print("wrote", OUT)
