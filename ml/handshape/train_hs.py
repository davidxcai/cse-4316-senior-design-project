"""Train the static handshape classifier (letters A-Z, digits 1-9) on ASL-HG + ASL Citizen landmarks.

Data:
  ASL-HG stills (10 signers): all letters, digits 6-9. Its 1-5 are dropped: they are shown palm toward the camera,
    while fluent signers sign 1-5 palm toward themselves (ASL Citizen: 2 -> R, 3 -> U, 4 -> B when trained on them).
  ASL Citizen digit videos (data/digits.csv, fluent signers): train-split signers add frames for 0(=O), 1-4, 6-9;
    val+test-split signers are the held-out digit evaluation. It has no FIVE.
    ASL-HG 5 is kept (an open hand reads the same palm in or out); it has no fluent-signer check yet.

Classes: ASL-HG's 36 minus "0" (its 0 is a nonstandard two-handed sign; the app scores 0 with the O handshape,
which is the standard ASL 0). J and Z are static end-poses in ASL-HG; the app checks them with the motion check.

Features (mirrored exactly by src/lib/fingerspell/handshape.ts, keep in sync):
  points in height units (x, z scaled by aspect) -> mirror x if MediaPipe labels the hand "Left"
  -> subtract wrist -> divide by 2D wrist-to-middle-knuckle distance -> flatten 63 values
Orientation is kept on purpose: H/U, G/Q and K/P differ mostly in how the hand is turned.

Usage (from ml/): .venv/bin/python handshape/train_hs.py [--cv] [--export]
  --cv      leave-2-signers-out cross-validation (5 folds), prints per-class accuracy
  --export  train on all 10 signers and write ../public/model/handshape.onnx + handshape_labels.json
Always: evaluates on ASL Citizen digit videos (different signers, webcam) if data/digits.csv is extracted.
"""
import csv, json, sys
from pathlib import Path
import cv2
import numpy as np
import torch
import torch.nn as nn

DATA = Path("/Volumes/Extreme SSD/senior-design-asl/handshape/asl_hg.npz")
LANDMARKS = Path("/Volumes/Extreme SSD/asl-landmarks")
VIDEOS = Path("/Volumes/Extreme SSD/ASL_Citizen.zip/ASL_Citizen/videos")
OUT = Path("../public/model")
CLASSES = [c for c in "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789"]
HG_DROP = {"0", "1", "2", "3", "4"}  # 0 is two-handed, 1-4 palm out
CITIZEN = {"ZERO": "O", "ONE": "1", "TWO": "2", "THREE": "3", "FOUR": "4", "SIX": "6", "SEVEN": "7", "EIGHT": "8", "NINE": "9"}
SUBSAMPLE = 4  # burst frames are near-duplicates; keep every 4th
EPOCHS = 60


def features(pts, left):
    """pts [..., 21, 3] in height units; left [...] bool. Returns [..., 63]."""
    p = pts.copy()
    p[..., 0] = np.where(left[..., None], -p[..., 0], p[..., 0])
    p = p - p[..., :1, :]
    scale = np.linalg.norm(p[..., 9, :2], axis=-1)[..., None, None]
    return (p / np.maximum(scale, 1e-6)).reshape(*p.shape[:-2], 63).astype(np.float32)


def augment(x, rng):
    """In-plane rotation +-15 deg, scale +-10%, small jitter. x [B, 63] already normalized."""
    p = x.reshape(-1, 21, 3).copy()
    a = rng.uniform(-np.pi / 12, np.pi / 12, len(p))
    c, s = np.cos(a), np.sin(a)
    x0, y0 = p[..., 0].copy(), p[..., 1].copy()
    p[..., 0] = c[:, None] * x0 - s[:, None] * y0
    p[..., 1] = s[:, None] * x0 + c[:, None] * y0
    p *= rng.uniform(0.9, 1.1, (len(p), 1, 1))
    p += rng.normal(0, 0.02, p.shape)
    return p.reshape(-1, 63).astype(np.float32)


class MLP(nn.Module):
    def __init__(self, n):
        super().__init__()
        self.net = nn.Sequential(nn.Linear(63, 256), nn.GELU(), nn.Dropout(0.3), nn.Linear(256, 256), nn.GELU(),
                                 nn.Dropout(0.3), nn.Linear(256, n))

    def forward(self, x):
        return self.net(x)


def load():
    z = np.load(DATA)
    keep = ~np.isin(z["label"], list(HG_DROP)) & (z["frame"] % SUBSAMPLE == 0)
    X = features(z["X"][keep], z["left"][keep])
    y = np.array([CLASSES.index(l) for l in z["label"][keep]])
    return X, y, z["signer"][keep]


def aspect_of(video):
    cap = cv2.VideoCapture(str(VIDEOS / video))
    w, h = cap.get(cv2.CAP_PROP_FRAME_WIDTH), cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
    cap.release()
    return w / h if h else 16 / 9


def citizen_clips(splits):
    """[(features [n, 63] of the clip's middle-half dominant-hand frames, class index, participant)]"""
    out = []
    for r in csv.DictReader(open("data/digits.csv", newline="")):
        p = LANDMARKS / (Path(r["video"]).stem + ".npz")
        if r["split"] in splits and p.exists():
            f = clip_features(np.load(p)["hands"][..., :3], aspect_of(r["video"]))
            if f is not None:
                out.append((f, CLASSES.index(CITIZEN[r["gloss"]]), r["participant"]))
    return out


def train(X, y, seed=0):
    torch.manual_seed(seed)
    rng = np.random.default_rng(seed)
    m = MLP(len(CLASSES))
    opt = torch.optim.AdamW(m.parameters(), lr=2e-3, weight_decay=1e-2)
    steps = EPOCHS * int(np.ceil(len(X) / 128))
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=2e-3, total_steps=steps)
    for _ in range(EPOCHS):
        m.train()
        for b in np.array_split(rng.permutation(len(X)), int(np.ceil(len(X) / 128))):
            loss = nn.functional.cross_entropy(m(torch.from_numpy(augment(X[b], rng))), torch.from_numpy(y[b]), label_smoothing=0.1)
            opt.zero_grad(); loss.backward(); opt.step(); sched.step()
    return m.eval()


@torch.no_grad()
def probs(m, X):
    return torch.softmax(m(torch.from_numpy(X)), 1).numpy()


def cv(X, y, signers):
    names = sorted(set(signers), key=lambda s: int(s[1:]))
    correct = np.zeros(len(CLASSES)); total = np.zeros(len(CLASSES)); confusions = {}
    for k in range(0, len(names), 2):
        test = np.isin(signers, names[k:k + 2])
        m = train(X[~test], y[~test])
        pred = probs(m, X[test]).argmax(1)
        acc = (pred == y[test]).mean()
        print(f"fold test={names[k:k+2]}  acc {acc:.3f}", flush=True)
        for t, p in zip(y[test], pred):
            total[t] += 1; correct[t] += t == p
            if t != p:
                confusions[(CLASSES[t], CLASSES[p])] = confusions.get((CLASSES[t], CLASSES[p]), 0) + 1
    print(f"\nCV accuracy (unseen signers) {correct.sum() / total.sum():.3f}")
    print("per class:", "  ".join(f"{c}:{correct[i]/total[i]:.2f}" for i, c in enumerate(CLASSES)))
    print("top confusions (true->pred: count):", ", ".join(f"{a}->{b}:{n}" for (a, b), n in sorted(confusions.items(), key=lambda kv: -kv[1])[:15]))


def clip_features(hands, aspect):
    """Features of the middle half of the frames showing the dominant hand, [n, 63], or None.
    hands [T, 2, 21, 3] raw MediaPipe coords, slot 0 = "Left". Same selection as clipFeatures in handshape.ts."""
    slot = int(np.argmax([np.isfinite(hands[:, s, 0, 0]).sum() for s in (0, 1)]))
    h = hands[:, slot]
    h = h[np.isfinite(h[:, 0, 0])]
    if len(h) == 0:
        return None
    h = h[len(h) // 4: max(len(h) // 4 + 1, 3 * len(h) // 4)]
    return features(h * np.array([aspect, 1, aspect], np.float32), np.full(len(h), slot == 0))


def eval_citizen_digits(m, clips):
    """Held-out fluent signers, one clip = one attempt, probabilities averaged over the clip like the app."""
    allowed = [CLASSES.index(c) for c in "O123456789"]  # a digit lesson: 0 is scored as O
    res = {}
    for f, y, _ in clips:
        pr = probs(m, f).mean(0)
        pred_digit = allowed[int(pr[allowed].argmax())]
        res.setdefault(CLASSES[y], []).append((pred_digit == y, CLASSES[int(pr.argmax())]))
    print(f"\nASL Citizen digits, held-out signers ({len(clips)} clips), lesson masked to digits (O = 0):")
    tot = sum(len(v) for v in res.values()); ok = sum(c for v in res.values() for c, _ in v)
    for g, v in sorted(res.items()):
        wrong = [p for c, p in v if not c]
        print(f"  {g}  {sum(c for c, _ in v)}/{len(v)}   unmasked top-1 when wrong: {' '.join(wrong)}")
    print(f"  overall {ok}/{tot} = {ok/tot:.3f}")


if __name__ == "__main__":
    X, y, signers = load()
    cit_train = citizen_clips({"train"})
    cit_test = citizen_clips({"val", "test"})
    Xc = np.concatenate([f for f, _, _ in cit_train]); yc = np.concatenate([np.full(len(f), c) for f, c, _ in cit_train])
    sc = np.concatenate([np.full(len(f), "C" + p) for f, _, p in cit_train])
    X, y, signers = np.concatenate([X, Xc]), np.concatenate([y, yc]), np.concatenate([signers.astype(str), sc])
    print(f"{len(X)} samples ({len(Xc)} from {len(cit_train)} ASL Citizen clips), {len(CLASSES)} classes, "
          f"{len(set(signers))} signers; held-out digit clips {len(cit_test)}")
    if "--cv" in sys.argv:
        hg = np.char.startswith(signers, "P")
        cv(X[hg], y[hg], signers[hg])  # letters + 6-9 on ASL-HG signers
    m = train(X, y)
    eval_citizen_digits(m, cit_test)
    if "--export" in sys.argv:
        OUT.mkdir(parents=True, exist_ok=True)
        torch.onnx.export(m, torch.zeros(1, 63), str(OUT / "handshape.onnx"), input_names=["x"], output_names=["logits"],
                          dynamic_axes={"x": {0: "n"}, "logits": {0: "n"}}, opset_version=17, dynamo=False)
        json.dump(CLASSES, open(OUT / "handshape_labels.json", "w"))
        print("wrote", OUT / "handshape.onnx")
