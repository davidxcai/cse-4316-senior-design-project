"""Evaluate a checkpoint the way lessons use it: verdicts from src/recognition/decide.ts, not plain top-1.

Every clip of signer S signing Y is replayed as an attempt in every lesson, for every target X in that lesson:
  Y == X           -> should be "correct"            (accept rate)
  Y in lesson, != X -> must not be "correct"          (confusion: a classmate sign accepted as X)
  Y not in lesson  -> must not be "correct"; ideally "rejected"  (out-of-set accepted as X)
"Out-of-set" uses clips of trained non-lesson glosses (the distractor classes) and, if extracted, clips of
glosses the model never saw (data/unseen.csv), which is the realistic case of a learner signing something random.

Thresholds (temperature, minAllowedMass, minShare) are swept on val and the chosen ones reported on test.

Usage: python eval_lessons.py [run=unit12_hands_rev]
"""
import collections, csv, itertools, re, sys
from pathlib import Path
import numpy as np
import torch
from dataset import LANDMARK_DIR, REVERSIBLE, ClipDataset, load_clip, reverse, to_tensor, trim
from train import SignGRU

run = sys.argv[1] if len(sys.argv) > 1 else "unit12_hands_rev"
ck = torch.load(Path("runs") / run / "best.pt", map_location="cpu")
labels = ck["labels"]
names = [g for g, _ in sorted(labels.items(), key=lambda kv: kv[1])]
model = SignGRU(ck["in_dim"], len(labels))
model.load_state_dict(ck["model"])
model.eval()

key = lambda g: re.sub(r"\d+$", "", re.sub(r"[^A-Z0-9]", "", g.upper()))  # = glossKey in vocab.ts

# M1 vocabulary per lesson, from curriculum.md (ASL is not in ASL Citizen)
LESSONS = {
    "1.1": "HELLO NICE MEET NAME MY YOUR DEAF HEARING YES NO THANKYOU PLEASE SORRY",
    "1.4": "SAME DIFFERENT CIRCLE SQUARE TRIANGLE RED BLUE GREEN YELLOW BLACK WHITE",
    "2.1": "WHO MAN WOMAN BOY GIRL FRIEND TEACHER STUDENT LEARN SIGN INTERPRETER",
    "2.3": "LIKE DONTLIKE WANT MOVIE READ SWIM RUN COOK PLAY TRAVEL",
}
LESSONS = {k: v.split() for k, v in LESSONS.items()}
idx_of = {}
for i, n in enumerate(names):
    idx_of.setdefault(key(n), []).append(i)
for L, words in LESSONS.items():
    missing = [w for w in words if w not in idx_of]
    assert not missing, f"lesson {L}: model has no label for {missing}"


@torch.no_grad()
def logits_for(split):
    """(logits [N, C], sign key per clip) for one split of data/subset.csv, plus data/unseen.csv clips (key '?')."""
    ds = ClipDataset(split, ck["groups"], labels=labels)
    out = [model(torch.stack([ds[i][0] for i in range(s, min(s + 256, len(ds)))])).numpy() for s in range(0, len(ds), 256)]
    keys = [key(names[y]) for y in ds.y]
    unseen = Path("data/unseen.csv")
    if unseen.exists():
        xs = []
        for r in csv.DictReader(open(unseen, newline="")):
            p = LANDMARK_DIR / (Path(r["video"]).stem + ".npz")
            if r["split"] == split and p.exists():
                xs.append(to_tensor(trim(load_clip(p, tuple(ck["groups"]))), tuple(ck["groups"])))
        if xs:
            out.append(model(torch.stack(xs)).numpy())
            keys += ["?"] * len(xs)
    return np.concatenate(out), keys


def verdicts(logits, temp, min_mass, min_share, lesson, target):
    """decideSign for every clip at once. Returns array of 'c' (correct), 'w' (wrong), 'r' (rejected)."""
    z = logits / temp
    p = np.exp(z - z.max(1, keepdims=True))
    p /= p.sum(1, keepdims=True)
    cand = [target] + [w for w in lesson if w != target]
    probs = np.stack([p[:, idx_of[w]].sum(1) for w in cand], 1)  # [N, len(cand)]
    mass = probs.sum(1)
    best = probs.argmax(1)
    share = probs.max(1) / np.maximum(mass, 1e-12)
    return np.where(mass < min_mass, "r", np.where(share < min_share, "r", np.where(best == 0, "c", "w")))


def score(logits, keys, temp, min_mass, min_share):
    keys = np.array(keys)
    acc, conf, oos_c, oos_r, unseen_c, unseen_r = [], [], [], [], [], []
    for lesson in LESSONS.values():
        for X in lesson:
            v = verdicts(logits, temp, min_mass, min_share, lesson, X)
            same = keys == X
            classmate = np.isin(keys, lesson) & ~same
            outside = ~np.isin(keys, lesson) & (keys != "?")
            unseen = keys == "?"
            acc.append((v[same] == "c").mean())
            conf.append((v[classmate] == "c").mean())
            oos_c.append((v[outside] == "c").mean())
            oos_r.append((v[outside] == "r").mean())
            if unseen.any():
                unseen_c.append((v[unseen] == "c").mean())
                unseen_r.append((v[unseen] == "r").mean())
    m = lambda a: float(np.mean(a)) if a else float("nan")
    return dict(accept=m(acc), worst_accept=min(acc), classmate_as_X=m(conf), outside_as_X=m(oos_c),
                outside_rejected=m(oos_r), unseen_as_X=m(unseen_c), unseen_rejected=m(unseen_r))


def show(tag, s):
    print(f"{tag:<34} accept {s['accept']:.3f} (worst sign {s['worst_accept']:.2f})  "
          f"false-accept: classmate {s['classmate_as_X']:.4f}  outside {s['outside_as_X']:.4f}  unseen {s['unseen_as_X']:.4f}  |  "
          f"rejected: outside {s['outside_rejected']:.2f}  unseen {s['unseen_rejected']:.2f}")


val, vkeys = logits_for("val")
test, tkeys = logits_for("test")
print(f"{run}: {len(names)} classes, val {len(vkeys)} clips, test {len(tkeys)} clips "
      f"({tkeys.count('?')} unseen-gloss test clips)\n")

lesson_keys = {w for ws in LESSONS.values() for w in ws}
for split, lg, ks in (("val", val, vkeys), ("test", test, tkeys)):
    sel = [i for i, k in enumerate(ks) if k in lesson_keys]
    top1 = np.mean([key(names[lg[i].argmax()]) == ks[i] for i in sel])
    print(f"{split}: plain top-1 on lesson-sign clips (variants merged, all {len(names)} classes) = {top1:.3f}")
print()

show("app defaults T=1 mass=.30 share=.50", score(test, tkeys, 1.0, 0.3, 0.5))
print("\nsweep on val (target: false accepts <= 2%, maximize accept):")
grid = list(itertools.product([1.0, 1.5, 2.0], [0.1, 0.2, 0.3, 0.4, 0.5], [0.4, 0.5, 0.6]))
rows = [(cfg, score(val, vkeys, *cfg)) for cfg in grid]
ok = [r for r in rows if max(r[1]["classmate_as_X"], r[1]["outside_as_X"], np.nan_to_num(r[1]["unseen_as_X"])) <= 0.02]
for cfg, s in sorted(ok or rows, key=lambda r: -r[1]["accept"])[:6]:
    show(f"val  T={cfg[0]} mass={cfg[1]} share={cfg[2]}", s)
best = max(ok or rows, key=lambda r: r[1]["accept"])[0]
print()
show(f"TEST T={best[0]} mass={best[1]} share={best[2]}", score(test, tkeys, *best))

# weakest signs on test at the chosen thresholds (accept rate when asked in their own lesson)
keys_t = np.array(tkeys)
per = []
for L, lesson in LESSONS.items():
    for X in lesson:
        v = verdicts(test, *best, lesson, X)[keys_t == X]
        per.append((float((v == "c").mean()), L, X, int((v == "w").sum()), int((v == "r").sum()), len(v)))
print("\nweakest signs on test (accept, lesson, sign, #wrong, #rejected, #clips):")
for row in sorted(per)[:8]:
    print(f"  {row[0]:.2f}  {row[1]}  {row[2]:<12} wrong {row[3]:>2}  rejected {row[4]:>2}  of {row[5]}")

# REVERSIBLE signs (dataset.py) are correct in either direction. Held-out clips played backwards stand in for the
# direction the dataset rarely shows; other signs' clips must still not pass as the reversible sign.
if REVERSIBLE:
    print("\nreversible signs on test, other direction = held-out clips played backwards:")
    ds = ClipDataset("test", ck["groups"], labels=labels)
    for g in sorted(REVERSIBLE):
        idx = [i for i, y in enumerate(ds.y) if names[y] == g]
        if not idx:
            continue
        with torch.no_grad():
            back = model(torch.stack([to_tensor(reverse(ds.clips[i]), tuple(ck["groups"])) for i in idx])).numpy()
        X = key(g)
        for L, lesson in LESSONS.items():
            if X not in lesson:
                continue
            fwd = verdicts(test, *best, lesson, X)
            vb = verdicts(back, *best, lesson, X)
            others = (keys_t != X) & (keys_t != "?")
            tops = collections.Counter(names[j] for j in back.argmax(1))
            print(f"  {L}  {g:<8} forward accept {(fwd[keys_t == X] == 'c').mean():.2f}  "
                  f"backwards accept {(vb == 'c').mean():.2f} ({len(idx)} clips)  "
                  f"other signs accepted as {X} {(fwd[others] == 'c').mean():.4f}  backwards top-1: {dict(tops.most_common(3))}")
