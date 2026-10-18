"""Build a browsable index of ASL Citizen: data/catalog.csv (one row per clip) and, optionally, a folder tree of symlinks.

The raw videos/ folder is flat and named <random id>-<GLOSS>.mp4, so categories come from the splits CSVs (which carry the
gloss for every clip) plus the hand-curated CATEGORIES below. Add a category by adding a gloss list; nothing else changes.

Every clip gets a `letter` (first letter of its base word, "#" for digit-led glosses like 1DOLLAR) for A-Z lookup, and
glosses listed in CATEGORIES also get a `collection` tag for groups that aren't alphabetical (numbers, alphabet).

Usage:
    python organize_videos.py                    # write data/catalog.csv and print a summary
    python organize_videos.py --link ~/asl_tree  # also build symlinks (not on the exFAT SSD):
                                                 #   by_letter/<L>/<gloss>/<clip>.mp4 and collections/<name>/<gloss>/<clip>.mp4
"""
import argparse, csv, re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path("/Volumes/Extreme SSD/ASL_Citizen.zip/ASL_Citizen")

# Exact glosses, ordered. ASL Citizen has no FIVE or TEN, and no A-Z letter clips (only the signs for the words below).
CATEGORIES = {
    "numbers": ["ZERO", "ONE", "TWO", "THREE", "FOUR", "SIX", "SEVEN", "EIGHT", "NINE", "ELEVEN", "HUNDRED", "NUMBERS", "COUNT"],
    "numbers_in_phrases": ["1DOLLAR", "5DOLLARS", "8HOUR", "9OCLOCK", "ONEMORE1", "ONEMORE2", "FIRST", "THIRD1", "THIRD2"],
    "alphabet": ["ALPHABET", "FINGERSPELLING", "FINGERSPELL"],
}
GLOSS_TO_CATEGORY = {g: c for c, gs in CATEGORIES.items() for g in gs}


def base_word(gloss):
    """BANANA3 -> BANANA, so sign variants group together. Leading digits (1DOLLAR) are part of the word and stay."""
    return re.sub(r"(?<=[A-Z])\d+$", "", gloss)


def load_clips():
    for split in ("train", "val", "test"):
        with open(ROOT / "splits" / f"{split}.csv", newline="") as f:
            for r in csv.DictReader(f):
                yield {"split": split, "participant": r["Participant ID"], "video": r["Video file"], "gloss": r["Gloss"]}


def first_letter(gloss):
    ch = base_word(gloss)[0]
    return ch if ch.isalpha() else "#"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--link", type=Path, help="build a symlink tree here (must not be on the exFAT drive)")
    args = ap.parse_args()

    clips = list(load_clips())
    for c in clips:
        c["base"] = base_word(c["gloss"])
        c["letter"] = first_letter(c["gloss"])
        c["collection"] = GLOSS_TO_CATEGORY.get(c["gloss"], "")

    Path("data").mkdir(exist_ok=True)
    with open("data/catalog.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["letter", "gloss", "collection", "base", "split", "participant", "video"], extrasaction="ignore")
        w.writeheader()
        w.writerows(sorted(clips, key=lambda c: (c["letter"], c["gloss"], c["video"])))

    letters = Counter(c["letter"] for c in clips)
    print("clips per letter:", " ".join(f"{k}={v}" for k, v in sorted(letters.items())))
    for name in CATEGORIES:
        print(f"{name}: {sum(1 for c in clips if c['collection'] == name)} clips")
    print(f"wrote data/catalog.csv ({len(clips)} clips)")

    if args.link:
        n = 0
        for c in clips:
            gloss_dir = c["gloss"].replace("/", "_")
            targets = [args.link / "by_letter" / c["letter"] / gloss_dir]
            if c["collection"]:
                targets.append(args.link / "collections" / c["collection"] / gloss_dir)
            for d in targets:
                d.mkdir(parents=True, exist_ok=True)
                dst = d / c["video"]
                if not dst.is_symlink():
                    dst.symlink_to(ROOT / "videos" / c["video"])
            n += 1
        print(f"linked {n} clips under {args.link}")


if __name__ == "__main__":
    main()
