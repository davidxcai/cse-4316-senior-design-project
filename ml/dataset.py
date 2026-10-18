"""Phase 3: turn extracted landmark clips into fixed-size training tensors.

    ds = ClipDataset("train", groups=("hands", "pose"), train=True)
    x, y = ds[0]        # x: float32 [T, D], y: int class index

Pipeline per clip:
  1. load the .npz and keep only the requested feature groups
  2. normalize relative to the body (shoulder midpoint = origin, shoulder width = 1)
  3. trim idle frames before/after the sign (no hands visible)
  4. [train only] augment: rotate, scale, shift, mirror, jitter, random time crop
  5. resample to exactly T frames, replace missing values with 0 and add presence flags
  6. optionally append frame-to-frame velocity

Feature groups (choose any combination):
  hands  both hands, 21 points each
  pose   nose, shoulders, elbows, wrists
  face   lips + eyebrows from the face mesh
  blend  52 face blendshape scores (expression)
"""
import csv
from pathlib import Path

import numpy as np
import torch
from mediapipe.tasks.python.vision import FaceLandmarksConnections as FC
from torch.utils.data import Dataset

LANDMARK_DIR = Path("/Volumes/Extreme SSD/asl-landmarks")
SUBSET_CSV = Path(__file__).parent / "data" / "subset.csv"

POSE_IDX = [0, 11, 12, 13, 14, 15, 16]  # nose, shoulders, elbows, wrists
L_SHOULDER, R_SHOULDER = 11, 12


def _face_idx():
    pts = set()
    for name in ("LIPS", "LEFT_EYEBROW", "RIGHT_EYEBROW"):
        pts |= {p for c in getattr(FC, f"FACE_LANDMARKS_{name}") for p in (c.start, c.end)}
    return sorted(pts)


FACE_IDX = _face_idx()
GROUPS = ("hands", "pose", "face", "blend")


def load_labels(csv_path=SUBSET_CSV):
    """Sorted gloss list -> index. Built from the whole subset so all splits agree."""
    glosses = sorted({r["gloss"] for r in csv.DictReader(open(csv_path, newline=""))})
    return {g: i for i, g in enumerate(glosses)}


def load_clip(path, groups):
    """Return {'hands': [T,2,21,3], 'pose': [T,7,3], 'face': [T,K,3], 'blend': [T,52]} (subset of groups),
    body-normalized, plus 'present' [T] (any hand visible). NaN marks missing data."""
    z = np.load(path)
    hands, pose = z["hands"].copy(), z["pose"]
    T = len(hands)
    # body frame: shoulder midpoint + shoulder width, per frame; fall back to the clip median if pose is missing
    ls, rs = pose[:, L_SHOULDER, :3], pose[:, R_SHOULDER, :3]
    origin = (ls + rs) / 2
    width = np.linalg.norm((ls - rs)[:, :2], axis=1)
    if np.isnan(origin).all():  # no pose anywhere in the clip: unusable body frame, keep raw coords
        origin, width = np.zeros((T, 3), np.float32), np.ones(T, np.float32)
    origin = np.where(np.isnan(origin), np.nanmedian(origin, axis=0), origin)
    width = np.where(np.isnan(width) | (width < 1e-3), np.nanmedian(width), width)

    def norm(a):  # a: [T, ..., 3]
        shape = (T,) + (1,) * (a.ndim - 2)
        return (a - origin.reshape(shape + (3,))) / width.reshape(shape + (1,))

    out = {"present": (~np.isnan(hands).reshape(T, 2, -1).all(axis=2)).any(axis=1)}  # any hand visible
    if "hands" in groups:
        out["hands"] = norm(hands).astype(np.float32)
    if "pose" in groups:
        out["pose"] = norm(pose[:, POSE_IDX, :3]).astype(np.float32)
    if "face" in groups:
        out["face"] = norm(z["face"][:, FACE_IDX]).astype(np.float32)
    if "blend" in groups:
        out["blend"] = z["blend"].astype(np.float32)
    return out


def trim(clip, pad=3):
    """Cut to the span where a hand is visible (+pad frames). Keeps the clip if no hand is ever seen."""
    idx = np.flatnonzero(clip["present"])
    if len(idx) == 0:
        return clip
    s, e = max(idx[0] - pad, 0), idx[-1] + pad + 1
    return {k: v[s:e] for k, v in clip.items()}


def augment(clip, rng, mirror_p=0.3):
    """Geometric + temporal augmentation in body-normalized space."""
    c = {k: v.copy() for k, v in clip.items()}
    ang = np.deg2rad(rng.uniform(-10, 10))
    R = np.array([[np.cos(ang), -np.sin(ang)], [np.sin(ang), np.cos(ang)]], np.float32)
    scale = rng.uniform(0.9, 1.1)
    shift = rng.normal(0, 0.05, size=3).astype(np.float32)
    flip = rng.random() < mirror_p  # left-dominant signers exist: mirror x and swap hand identity
    for k in ("hands", "pose", "face"):
        if k not in c:
            continue
        a = c[k]
        a[..., :2] = a[..., :2] @ R.T
        a *= scale
        a += shift
        a += rng.normal(0, 0.005, size=a.shape).astype(np.float32)  # per-point jitter
        if flip:
            a[..., 0] *= -1
        if flip and k == "hands":
            c[k] = a[:, ::-1]
        elif flip and k == "pose":
            c[k] = a[:, [0, 2, 1, 4, 3, 6, 5]]  # swap L/R shoulders, elbows, wrists (face brows left unswapped: minor)
    # random temporal crop (speed/length variation); the resample step stretches it back
    n = len(c["present"])
    if n > 16:
        s = rng.integers(0, max(1, int(0.1 * n)) + 1)
        e = n - rng.integers(0, max(1, int(0.1 * n)) + 1)
        c = {k: v[s:e] for k, v in c.items()}
    return c


def to_tensor(clip, groups, T=64, velocity=True):
    n = len(clip["present"])
    sel = np.linspace(0, n - 1, T).round().astype(int)  # nearest-frame resample to exactly T
    parts = []
    if "hands" in groups:
        h = clip["hands"][sel]  # [T,2,21,3]
        flags = (~np.isnan(h).reshape(T, 2, -1).any(axis=2)).astype(np.float32)  # [T,2] hand present
        parts += [np.nan_to_num(h.reshape(T, -1)), flags]
    for k in ("pose", "face"):
        if k in groups:
            a = clip[k][sel].reshape(T, -1)
            parts.append(np.nan_to_num(a))
    if "blend" in groups:
        parts.append(np.nan_to_num(clip["blend"][sel]))
    x = np.concatenate(parts, axis=1)
    if velocity:
        v = np.diff(x, axis=0, prepend=x[:1])
        x = np.concatenate([x, v], axis=1)
    return torch.from_numpy(x.astype(np.float32))


class ClipDataset(Dataset):
    """All clips of one split from data/subset.csv. Clips without an extracted .npz are skipped."""

    def __init__(self, split, groups=("hands", "pose"), train=False, T=64, velocity=True,
                 mirror_p=0.3, labels=None, seed=0):
        assert split in ("train", "val", "test") and set(groups) <= set(GROUPS)
        self.groups, self.train, self.T, self.velocity, self.mirror_p = tuple(groups), train, T, velocity, mirror_p
        self.labels = labels or load_labels()
        self.rng = np.random.default_rng(seed)
        self.clips, self.y, self.videos, missing = [], [], [], 0
        for r in csv.DictReader(open(SUBSET_CSV, newline="")):
            if r["split"] != split:
                continue
            p = LANDMARK_DIR / (Path(r["video"]).stem + ".npz")
            if not p.exists():
                missing += 1
                continue
            self.clips.append(trim(load_clip(p, self.groups)))  # trimmed + normalized once, kept in memory
            self.y.append(self.labels[r["gloss"]])
            self.videos.append(r["video"])
        if missing:
            print(f"[{split}] warning: {missing} clips not extracted yet, skipped")

    @property
    def feature_dim(self):
        return self[0][0].shape[1]

    def __len__(self):
        return len(self.clips)

    def __getitem__(self, i):
        c = augment(self.clips[i], self.rng, self.mirror_p) if self.train else self.clips[i]
        return to_tensor(c, self.groups, self.T, self.velocity), self.y[i]
