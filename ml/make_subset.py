"""Write data/subset.csv: the N glosses with the most train clips, plus all their train/val/test clips.

Usage: python make_subset.py [N=50] [--add glosses.txt]
  --add  also include the glosses listed in the file (one per line, # comments), e.g. data/unit1-2.txt.
         The top-N glosses then act as non-lesson signs, which the app's out-of-set rejection relies on.
"""
import csv, sys
from collections import Counter
from pathlib import Path

ROOT = Path("/Volumes/Extreme SSD/ASL_Citizen.zip/ASL_Citizen")
args = sys.argv[1:]
extra = set()
if "--add" in args:
    i = args.index("--add")
    extra = {l.strip() for l in open(args[i + 1]) if l.strip() and not l.startswith("#")}
    del args[i:i + 2]
N = int(args[0]) if args else 50

splits = {s: list(csv.DictReader(open(ROOT / "splits" / f"{s}.csv", newline=""))) for s in ("train", "val", "test")}
counts = Counter(r["Gloss"] for r in splits["train"])
# most train clips first; gloss name breaks ties so the pick is deterministic
glosses = {g for g, _ in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[:N]}
unknown = extra - counts.keys()
assert not unknown, f"not ASL Citizen glosses: {sorted(unknown)}"
glosses |= extra

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
