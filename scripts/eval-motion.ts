/**
 * Evaluate the J/Z motion check (src/lib/fingerspell/motionLetters.ts) on landmarks from ml/extract_motion_eval.py.
 *
 *   node scripts/eval-motion.ts [landmarks.json] [--detail]
 *
 * Prints, per true label, how often the J check and the Z check accept the clip (J clips should pass J, every
 * other letter should fail it; same for Z), then raw measurements for the clips that matter most when tuning.
 */
import { readFileSync } from "node:fs";
import type { Frame } from "../src/types/sign.ts";
import {
  checkMotionLetter,
  MOTION_DEFAULTS,
  ruleHandshape,
  type MotionConfig,
  type MotionLetter,
} from "../src/lib/fingerspell/motionLetters.ts";

interface Clip {
  id: string;
  label: string;
  source: string;
  aspect: number;
  frames: Frame[];
}

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--")) ?? "/Volumes/Extreme SSD/senior-design-asl/motion-eval/landmarks.json";
const detail = args.includes("--detail");
const clips: Clip[] = JSON.parse(readFileSync(file, "utf8")).clips;

/** Same pipeline with every threshold except the handshape rule disabled, to see raw extent and path cost. */
const RAW: MotionConfig = {
  ...MOTION_DEFAULTS,
  minShapeFrames: 1,
  minExtent: { J: 0, Z: 0 },
  maxPathCost: { J: Infinity, Z: Infinity },
};

const letters: MotionLetter[] = ["J", "Z"];
const byLabel = new Map<string, Clip[]>();
for (const c of clips) byLabel.set(c.label, [...(byLabel.get(c.label) ?? []), c]);

console.log(`${clips.length} clips from ${file}\n`);
console.log("label  n   J-accept  Z-accept   (J row should be high in J-accept, Z row high in Z-accept, all else 0)");
const totals = { J: { tp: 0, p: 0, fp: 0, n: 0 }, Z: { tp: 0, p: 0, fp: 0, n: 0 } };
for (const [label, cs] of [...byLabel].sort()) {
  const acc = letters.map((L) => cs.filter((c) => checkMotionLetter(c.frames, L, c.aspect).ok).length);
  letters.forEach((L, i) => {
    const t = totals[L];
    if (label === L) { t.tp += acc[i]; t.p += cs.length; } else { t.fp += acc[i]; t.n += cs.length; }
  });
  const mark = (L: MotionLetter, k: number) => `${k}/${cs.length}`.padEnd(8) + (label !== L && k > 0 ? "!" : " ");
  console.log(`${label.padEnd(6)} ${String(cs.length).padEnd(3)} ${mark("J", acc[0])}  ${mark("Z", acc[1])}`);
}
for (const L of letters) {
  const t = totals[L];
  console.log(`\n${L}: recall ${t.tp}/${t.p}, false accepts ${t.fp}/${t.n} other-letter clips`);
}

const focus = detail ? [...byLabel.keys()].sort() : ["J", "Z", "I", "D", "X", "Y"];
for (const L of letters) {
  console.log(`\n--- ${L} check, raw measurements (shape% = hand frames passing the ${L} handshape rule) ---`);
  console.log("label  clip                          src     shape%  run  extent  cost   verdict");
  for (const label of focus) {
    for (const c of byLabel.get(label) ?? []) {
      const slot = [0, 1].reduce((b, s) => (c.frames.filter((f) => f.hands[s]).length > c.frames.filter((f) => f.hands[b]).length ? s : b), 1);
      const hs = c.frames.map((f) => f.hands[slot]).filter((h): h is number[] => h !== null);
      const shapePct = hs.length ? (100 * hs.filter((h) => ruleHandshape(h, L, c.aspect)).length) / hs.length : 0;
      const raw = checkMotionLetter(c.frames, L, c.aspect, RAW);
      const real = checkMotionLetter(c.frames, L, c.aspect);
      console.log(
        `${label.padEnd(6)} ${c.id.slice(0, 29).padEnd(29)} ${c.source.slice(0, 6).padEnd(7)} ${shapePct.toFixed(0).padStart(5)}  ` +
          `${String(raw.shapeFrames).padStart(4)}  ${raw.extent.toFixed(2).padStart(6)}  ${Number.isNaN(raw.pathCost) ? "  -  " : raw.pathCost.toFixed(3)}  ${real.verdict}`,
      );
    }
  }
}
