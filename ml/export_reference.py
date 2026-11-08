"""Export reference landmark clips for /dev/test: one gzipped JSON the page plays as an animated skeleton.

Usage (from ml/): .venv/bin/python export_reference.py [glosses.txt=data/unit1-2.txt] [out.json.gz]
  default out: ../dev-data/<glosses>.landmarks.json.gz (committed; /dev/test loads it automatically under `npm run dev`)

Each clip is exactly what training sees before resampling: dataset.load_clip (body-normalized: shoulder midpoint =
origin, shoulder width = 1) then dataset.trim. Per word: up to HELD_OUT test/val clips (signers the model never trained
on) and up to TRAIN train clips.

Derived from ASL Citizen landmarks; the team decided (2026-11-08) to commit it. It is fetched only by the dev server,
never imported, so it stays out of the production build.

Format:
  { "scale": 1000, "points": {"hands": 42, "pose": 7, "face": 0}, "edges": [[a, b], ...],
    "clips": [{ "key": "HELLO", "label": "HELLO", "split": "test", "frames": n,
                "xy": base64 of little-endian int16 [frames, 49, 2] (value * scale, missing = -32768) }] }
  Point order: hand slot 0 (21), hand slot 1 (21), pose (nose, L/R shoulder, L/R elbow, L/R wrist). Slots are
  MediaPipe's handedness labels, so colour them, don't name them. No face points: the page draws a stick-figure head
  oval at the nose instead, so the signers' faces aren't reproduced.
"""
import base64, csv, gzip, json, re, sys
from collections import defaultdict
from pathlib import Path

import numpy as np
from mediapipe.tasks.python.vision import HandLandmarksConnections as HC

from dataset import LANDMARK_DIR, SUBSET_CSV, load_clip, trim

HELD_OUT, TRAIN = 8, 4
SCALE, MISSING = 1000, -32768
GROUPS = ("hands", "pose")

glosses_file = Path(sys.argv[1] if len(sys.argv) > 1 else "data/unit1-2.txt")
out = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).parent.parent / "dev-data" / f"{glosses_file.stem}.landmarks.json.gz"
glosses = {l.strip() for l in open(glosses_file) if l.strip() and not l.startswith("#")}


def gloss_key(g):
    """Same as glossKey in src/recognition/vocab.ts: upper case, punctuation and variant suffix dropped."""
    return re.sub(r"\d+$", "", re.sub(r"[^A-Z0-9]", "", g.upper()))


def edges():
    hand = [(c.start, c.end) for c in HC.HAND_CONNECTIONS]
    e = [(a, b) for a, b in hand] + [(a + 21, b + 21) for a, b in hand]
    # pose: 42 nose, 43/44 shoulders, 45/46 elbows, 47/48 wrists (dataset.POSE_IDX order)
    e += [(43, 44), (43, 45), (45, 47), (44, 46), (46, 48)]
    return e


rows = defaultdict(list)  # gloss -> rows, test first, then val, then train
order = {"test": 0, "val": 1, "train": 2}
for r in sorted(csv.DictReader(open(SUBSET_CSV, newline="")), key=lambda r: order[r["split"]]):
    if r["gloss"] in glosses and (LANDMARK_DIR / (Path(r["video"]).stem + ".npz")).exists():
        rows[r["gloss"]].append(r)

clips = []
for gloss in sorted(rows):
    held = [r for r in rows[gloss] if r["split"] != "train"][:HELD_OUT]
    train = [r for r in rows[gloss] if r["split"] == "train"][:TRAIN]
    for r in held + train:
        c = trim(load_clip(LANDMARK_DIR / (Path(r["video"]).stem + ".npz"), GROUPS))
        n = len(c["present"])
        pts = np.concatenate([c["hands"].reshape(n, 42, 3), c["pose"]], axis=1)[..., :2]  # [n, 49, 2]
        q = np.where(np.isnan(pts), MISSING, np.clip(np.round(pts * SCALE), -32767, 32767)).astype("<i2")
        clips.append({"key": gloss_key(gloss), "label": gloss, "split": r["split"], "frames": n,
                      "xy": base64.b64encode(q.tobytes()).decode()})

missing = sorted(glosses - rows.keys())
out.parent.mkdir(parents=True, exist_ok=True)
with gzip.open(out, "wt") as f:
    json.dump({"scale": SCALE, "points": {"hands": 42, "pose": 7, "face": 0}, "edges": edges(), "clips": clips}, f)
print(f"{len(clips)} clips, {len(rows)} glosses -> {out} ({out.stat().st_size / 1e6:.1f} MB)")
if missing:
    print("no extracted clips:", " ".join(missing))
