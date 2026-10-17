"""Sanity check for dataset.py: shapes, NaNs, label coverage, augmentation changes the data."""
import numpy as np, torch
from dataset import ClipDataset, load_labels

labels = load_labels()
print("classes:", len(labels))
for groups in [("hands",), ("hands", "pose"), ("hands", "pose", "face", "blend")]:
    tr = ClipDataset("train", groups, train=True, labels=labels)
    x, y = tr[0]
    print(f"{'+'.join(groups):<22} clips={len(tr):>4}  x={tuple(x.shape)}  nan={bool(torch.isnan(x).any())}  y={y}")
x1, x2 = tr[0][0], tr[0][0]
print("augmentation varies between calls:", not torch.equal(x1, x2))
va = ClipDataset("val", ("hands", "pose"), labels=labels)
print("val deterministic:", torch.equal(va[0][0], va[0][0]), " val clips:", len(va))
lens = [len(c["present"]) for c in tr.clips]
print("trimmed clip length min/median/max:", min(lens), int(np.median(lens)), max(lens))
print("classes seen in train:", len(set(tr.y)))
