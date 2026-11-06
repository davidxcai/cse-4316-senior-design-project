"""Tune the letter/digit rejection thresholds (HANDSHAPE_DECISION_DEFAULTS in src/recognition/decide.ts).

Replays attempts the way lesson 1.2 (alphabet) and 1.3 (numbers) make them, with the same decision rule as
decide.ts on clip-averaged handshape probabilities:
  positives  letters: held-out ASL-HG signers (leave-2-signers-out folds), burst frames grouped into 10-frame clips
             digits:  held-out ASL Citizen signers (val+test split), real webcam clips
  classmates clips of another item in the same lesson -> must not be "correct"
  outside    clips of random signs (data/unseen.csv + val/test clips of data/subset.csv), never trained on by the
             handshape model -> should be "rejected", must rarely be "correct"
Thresholds are chosen on folds 1-3 (letters) / val signers (digits) and reported on the rest.

Usage (from ml/): .venv/bin/python handshape/eval_thresholds.py
"""
import csv, itertools
from pathlib import Path
import numpy as np
from train_hs import (CLASSES, CITIZEN, DATA, LANDMARKS, SUBSAMPLE, HG_DROP, aspect_of, citizen_clips, clip_features,
                      features, probs, train)

LESSONS = {
    "letters A-Z": list("ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
    "fist letters": list("ASTMNE"),
    "digits 1-9": list("123456789"),
}
CLIP = 10
SAME_KIND = False


def hg_clips():
    """ASL-HG pseudo-clips: (features [CLIP, 63], class, signer). Every burst frame, consecutive groups of CLIP."""
    z = np.load(DATA)
    keep = ~np.isin(z["label"], list(HG_DROP))
    X, lab, sig, fr = features(z["X"][keep], z["left"][keep]), z["label"][keep], z["signer"][keep], z["frame"][keep]
    out = []
    for s in np.unique(sig):
        for c in np.unique(lab):
            idx = np.where((sig == s) & (lab == c))[0]
            idx = idx[np.argsort(fr[idx])]
            for k in range(0, len(idx) - CLIP + 1, CLIP):
                out.append((X[idx[k:k + CLIP]], CLASSES.index(c), s))
    return out


def outside_clips():
    """Random signs: (features, -1, participant) for val/test clips of unseen.csv and subset.csv."""
    out = []
    for f in ("data/unseen.csv", "data/subset.csv"):
        for r in csv.DictReader(open(f, newline="")):
            p = LANDMARKS / (Path(r["video"]).stem + ".npz")
            if r["split"] in ("val", "test") and p.exists():
                ft = clip_features(np.load(p)["hands"][..., :3], aspect_of(r["video"]))
                if ft is not None:
                    out.append((ft, -1, r["participant"]))
    return out


def train_data(hg_signers):
    """Training set like train_hs.py main(), restricted to the given ASL-HG signers (subsampled bursts)."""
    z = np.load(DATA)
    keep = ~np.isin(z["label"], list(HG_DROP)) & (z["frame"] % SUBSAMPLE == 0) & np.isin(z["signer"], hg_signers)
    X = features(z["X"][keep], z["left"][keep])
    y = np.array([CLASSES.index(l) for l in z["label"][keep]])
    ct = citizen_clips({"train"})
    return np.concatenate([X] + [f for f, _, _ in ct]), np.concatenate([y] + [np.full(len(f), c) for f, c, _ in ct])


def logp(m, clips):
    return np.stack([np.log(np.maximum(probs(m, f).mean(0), 1e-12)) for f, _, _ in clips]), np.array([c for _, c, _ in clips])


def verdicts(L, temp, min_mass, min_share, lesson, target):
    z = L / temp
    if SAME_KIND:  # drop the other kind's classes (lessons never mix letters and digits)
        letters = lesson[0].isalpha()
        z = np.where(np.array([c.isalpha() == letters for c in CLASSES]), z, -np.inf)
    p = np.exp(z - z.max(1, keepdims=True)); p /= p.sum(1, keepdims=True)
    cand = [target] + [c for c in lesson if c != target]
    pr = p[:, [CLASSES.index(c) for c in cand]]
    mass, best = pr.sum(1), pr.argmax(1)
    share = pr.max(1) / np.maximum(mass, 1e-12)
    return np.where(mass < min_mass, "r", np.where(share < min_share, "r", np.where(best == 0, "c", "w")))


def score(pos, out, cfg, lesson):
    """pos = (logp, y) for in-domain clips; out = logp of outside clips."""
    Lp, y = pos
    acc, mate, oc, orj = [], [], [], []
    for X in lesson:
        xi = CLASSES.index(X)
        if X in "JZ" or not (y == xi).any():  # J/Z use the motion check; 5 has no held-out fluent clips
            continue
        v = verdicts(Lp, *cfg, lesson, X)
        acc.append((v[y == xi] == "c").mean())
        mates = np.isin(y, [CLASSES.index(c) for c in lesson]) & (y != xi)
        mate.append((v[mates] == "c").mean())
        vo = verdicts(out, *cfg, lesson, X)
        oc.append((vo == "c").mean()); orj.append((vo == "r").mean())
    return dict(accept=np.mean(acc), worst=min(acc), mate=np.mean(mate), out_c=np.mean(oc), out_r=np.mean(orj))


def show(tag, s):
    print(f"  {tag:<28} accept {s['accept']:.3f} (worst {s['worst']:.2f})  false-accept: classmate {s['mate']:.4f}  "
          f"random sign {s['out_c']:.4f}  |  random sign rejected {s['out_r']:.2f}")


GRID = list(itertools.product([1.0, 1.5, 2.0], [0.2, 0.3, 0.4, 0.5, 0.6, 0.7], [0.4, 0.5, 0.6, 0.7]))
DEFAULT = (1.0, 0.2, 0.4)


def pick(rows, budget=0.02):
    ok = [r for r in rows if max(r[1]["mate"], r[1]["out_c"]) <= budget]
    return max(ok or rows, key=lambda r: r[1]["accept"])


if __name__ == "__main__":
    hg = hg_clips()
    outside = outside_clips()
    signers = sorted({s for _, _, s in hg}, key=lambda s: int(s[1:]))
    print(f"{len(hg)} ASL-HG pseudo-clips, {len(outside)} random-sign clips")

    # letters: 5 folds; fold models never saw their 2 test signers or any outside clip
    fold_pos, fold_out = [], []
    for k in range(0, len(signers), 2):
        test = signers[k:k + 2]
        m = train(*train_data([s for s in signers if s not in test]))
        fold_pos.append(logp(m, [c for c in hg if c[2] in test]))
        fold_out.append(logp(m, outside)[0])
        print(f"  fold {test} trained", flush=True)
    tune = (np.concatenate([p[0] for p in fold_pos[:3]]), np.concatenate([p[1] for p in fold_pos[:3]]))
    held = (np.concatenate([p[0] for p in fold_pos[3:]]), np.concatenate([p[1] for p in fold_pos[3:]]))
    out_tune, out_held = np.concatenate(fold_out[:3]), np.concatenate(fold_out[3:])

    # digits: the full model (as exported); tune on ASL Citizen val signers, report on test signers
    m = train(*train_data(signers))
    d_tune = logp(m, citizen_clips({"val"}))
    d_held = logp(m, citizen_clips({"test"}))
    d_out = logp(m, outside)[0]

    chosen = {}
    for name, lesson in LESSONS.items():
        digits = name.startswith("digits")
        T, H, OT, OH = (d_tune, d_held, d_out, d_out) if digits else (tune, held, out_tune, out_held)
        print(f"\n{name}:")
        show("current default, held-out", score(H, OH, DEFAULT, lesson))
        cfg, s = pick([(c, score(T, OT, c, lesson)) for c in GRID])
        show(f"tuned T={cfg[0]} mass={cfg[1]} share={cfg[2]}", s)
        show("  same, held-out", score(H, OH, cfg, lesson))
        chosen[name] = cfg
    print("\nchosen:", chosen)

    # the app uses one config per kind (letters / digits); check the candidates on every lesson, held-out data
    print("\nper-kind configs, held-out:")
    for name, lesson in LESSONS.items():
        digits = name.startswith("digits")
        H, OH = (d_held, d_out) if digits else (held, out_held)
        for cfg in ([(1.0, 0.7, 0.7), (1.0, 0.6, 0.6)] if digits else [(1.0, 0.5, 0.4), (1.0, 0.4, 0.4)]):
            show(f"{name} T={cfg[0]} mass={cfg[1]} share={cfg[2]}", score(H, OH, cfg, lesson))

    SAME_KIND = True
    print("\nsame-kind softmax, held-out:")
    for name, lesson in LESSONS.items():
        digits = name.startswith("digits")
        T, H, OT, OH = (d_tune, d_held, d_out, d_out) if digits else (tune, held, out_tune, out_held)
        cfg, _ = pick([(c, score(T, OT, c, lesson)) for c in GRID])
        show(f"{name} tuned {cfg}", score(H, OH, cfg, lesson))
        for c in ([(1.0, 0.7, 0.7)] if digits else [(1.0, 0.5, 0.4), (1.0, 0.6, 0.4), (1.0, 0.6, 0.5)]):
            show(f"{name} {c}", score(H, OH, c, lesson))
