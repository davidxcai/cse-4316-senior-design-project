"""Write ../src/features/devtest/trainCounts.json: how much training data each model class saw, for /dev/test.

Usage (from ml/): .venv/bin/python train_counts.py
Rerun after retraining either model (subset.csv or the handshape data changed).

  signs      model label -> train-split clips with extracted landmarks (exactly what ClipDataset("train") loads)
  handshape  class -> {"photos": ASL-HG samples kept for training, "signers": ASL-HG signers,
                       "videos": ASL Citizen train clips that produced frames}
Counts only, no filenames or participant IDs: the dataset itself must not leave this machine.
"""
import csv, json
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np

from dataset import LANDMARK_DIR, REVERSIBLE, SUBSET_CSV
from handshape import train_hs as hs

OUT = Path(__file__).parent.parent / "src" / "features" / "devtest" / "trainCounts.json"

signs = Counter(
    r["gloss"]
    for r in csv.DictReader(open(SUBSET_CSV, newline=""))
    if r["split"] == "train" and (LANDMARK_DIR / (Path(r["video"]).stem + ".npz")).exists()
)

z = np.load(hs.DATA)
keep = ~np.isin(z["label"], list(hs.HG_DROP)) & (z["frame"] % hs.SUBSAMPLE == 0)
photos = Counter(z["label"][keep].tolist())
signers = defaultdict(set)
for label, signer in zip(z["label"][keep].tolist(), z["signer"][keep].tolist()):
    signers[label].add(signer)
videos = Counter(hs.CLASSES[c] for _, c, _ in hs.citizen_clips({"train"}))

handshape = {
    c: {"photos": photos.get(c, 0), "signers": len(signers.get(c, ())), "videos": videos.get(c, 0)} for c in hs.CLASSES
}
OUT.parent.mkdir(parents=True, exist_ok=True)
json.dump({"signs": dict(sorted(signs.items())), "reversible": sorted(REVERSIBLE), "handshape": handshape},
          open(OUT, "w"), indent=1)
print(f"{len(signs)} sign labels, {len(handshape)} handshape classes -> {OUT}")
