"""Write data/subset.csv: the N glosses with the most train clips, plus all their train/val/test clips.

Usage: python make_subset.py [N=50]
"""
import csv, sys
from collections import Counter
from pathlib import Path

ROOT = Path("/Volumes/Extreme SSD/ASL_Citizen.zip/ASL_Citizen")
N = int(sys.argv[1]) if len(sys.argv) > 1 else 50

splits = {s: list(csv.DictReader(open(ROOT / "splits" / f"{s}.csv", newline=""))) for s in ("train", "val", "test")}
counts = Counter(r["Gloss"] for r in splits["train"])
# most train clips first; gloss name breaks ties so the pick is deterministic
glosses = {g for g, _ in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[:N]}

Path("data").mkdir(exist_ok=True)
with open("data/subset.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=["split", "participant", "video", "gloss"])
    w.writeheader()
    for s, rows in splits.items():
        n = 0
        for r in rows:
            if r["Gloss"] in glosses:
                w.writerow({"split": s, "participant": r["Participant ID"], "video": r["Video file"], "gloss": r["Gloss"]})
                n += 1
        print(f"{s}: {n} clips")
print(f"{len(glosses)} glosses; train clips/gloss min={min(counts[g] for g in glosses)}")
