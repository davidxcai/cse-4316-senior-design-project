"""Write data/unseen.csv: val+test clips of 40 random ASL Citizen glosses that are NOT in data/subset.csv.

The model never trains on these; eval_lessons.py uses them to measure how often a random, unknown sign is
accepted as a lesson target (it should be rejected). Extract with: python extract.py 8 data/unseen.csv
"""
import csv, random
from pathlib import Path

ROOT = Path("/Volumes/Extreme SSD/ASL_Citizen.zip/ASL_Citizen")
K = 40
used = {r["gloss"] for r in csv.DictReader(open("data/subset.csv", newline=""))}
rows = [dict(r, split=s) for s in ("val", "test") for r in csv.DictReader(open(ROOT / "splits" / f"{s}.csv", newline=""))]
pool = sorted({r["Gloss"] for r in rows} - used)
pick = set(random.Random(0).sample(pool, K))
with open("data/unseen.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=["split", "participant", "video", "gloss"])
    w.writeheader()
    n = 0
    for r in rows:
        if r["Gloss"] in pick:
            w.writerow({"split": r["split"], "participant": r["Participant ID"], "video": r["Video file"], "gloss": r["Gloss"]})
            n += 1
print(f"{K} unseen glosses, {n} val+test clips: {', '.join(sorted(pick))}")
