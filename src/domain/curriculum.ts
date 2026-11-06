/**
 * The course: units → lessons → items, transcribed from curriculum.md "## Unit lesson plans".
 * Pure data. Edit this file when curriculum.md changes. See domain.md for the mapping choices.
 */
import type { Item } from "../recognition";
import { CULTURE_NOTES, type CultureNote } from "./cultureNotes";
import { itemKey } from "./signContent";

export type { CultureNote };

export type LessonKind = "lesson" | "quiz" | "review";

export type Lesson = {
  /** '1.1', '1.quiz', '2.review' / '4.review' / '5.final'. Stored in lesson_completions.lesson_id. */
  id: string;
  unitId: number;
  /** '1.1' for lessons, '' for quiz/review rows */
  label: string;
  title: string;
  kind: LessonKind;
  items: Item[];
  /** culture step content [S.24–26]; null = the lesson has no culture step */
  culture: CultureNote | null;
  /** quiz / review: ids of the regular lessons it covers, in order (used to spread questions evenly). [] for lessons */
  covers: string[];
};

export type Unit = {
  id: number;
  title: string;
  description: string;
  minutes: number;
  optional: boolean;
  /** lessons in order, then the unit quiz, then the review checkpoint if the unit has one */
  lessons: Lesson[];
};

/** Estimated minutes per row (lesson, quiz or review). Unit minutes = this × row count. A guess; tune with real sessions. */
export const MINUTES_PER_LESSON = 5;

// ---------------------------------------------------------------------------
// Item builders
// ---------------------------------------------------------------------------

const signs = (...glosses: string[]): Item[] => glosses.map((gloss) => ({ kind: "sign", gloss }));

const letters = (chars: string): Item[] => [...chars].map((char) => ({ kind: "letter", char }));

const numbers = (from: number, to: number): Item[] =>
  Array.from({ length: to - from + 1 }, (_, i) => ({ kind: "number", value: from + i }));

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Union of the lessons' items, first occurrence wins, order kept. */
function mergeItems(lessons: readonly Lesson[]): Item[] {
  const seen = new Set<string>();
  const out: Item[] = [];
  for (const lesson of lessons) {
    for (const item of lesson.items) {
      const key = itemKey(item);
      if (!seen.has(key)) {
        seen.add(key);
        out.push(item);
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Lessons per unit (vocabulary track only; M2 sentence work isn't modeled here)
// ---------------------------------------------------------------------------

type LessonSpec = { n: number; title: string; items: Item[] };

const LESSON_SPECS: Record<number, LessonSpec[]> = {
  1: [
    {
      n: 1,
      title: "Greetings",
      items: signs("HELLO", "NICE", "MEET", "NAME", "MY", "YOUR", "DEAF", "HEARING", "YES", "NO", "THANK-YOU", "PLEASE", "SORRY"),
    },
    // curriculum.md: "fist" letters A, S, T, M, N, E first
    { n: 2, title: "Alphabet", items: [...letters("ASTMNE"), ...letters(ALPHABET.replace(/[ASTMNE]/g, ""))] },
    { n: 3, title: "Numbers 1–15", items: numbers(1, 15) },
    {
      n: 4,
      title: "Shapes & Colors",
      items: signs("SAME", "DIFFERENT", "CIRCLE", "SQUARE", "TRIANGLE", "RED", "BLUE", "GREEN", "YELLOW", "BLACK", "WHITE"),
    },
  ],
  2: [
    {
      n: 1,
      title: "People & Roles",
      // "SIGN (ASL)" = two signs, SIGN and ASL (recognition README lists ASL as its own item)
      items: signs("WHO", "MAN", "WOMAN", "BOY", "GIRL", "FRIEND", "TEACHER", "STUDENT", "LEARN", "SIGN", "ASL", "INTERPRETER"),
    },
    { n: 2, title: "Numbers 16–29", items: numbers(16, 29) },
    {
      n: 3,
      title: "Leisure Activities",
      items: signs("LIKE", "DON'T-LIKE", "WANT", "MOVIE", "READ", "SWIM", "RUN", "COOK", "PLAY", "TRAVEL"),
    },
    // Double letters are a fingerspelling skill, not separate items
    { n: 4, title: "Fingerspelling 2", items: letters("DGHKPQRUV") },
  ],
  3: [
    {
      n: 1,
      title: "Home & Residence",
      items: signs("LIVE", "HOUSE", "APARTMENT", "DORM", "CITY", "ALONE", "ROOMMATE", "CAT", "DOG"),
    },
    {
      n: 2,
      title: "Around Campus",
      items: signs("CLASSROOM", "BATHROOM", "LIBRARY", "OFFICE", "DOOR", "WINDOW", "LEFT", "RIGHT", "UPSTAIRS"),
    },
    { n: 3, title: "Transportation", items: signs("CAR", "BUS", "BIKE", "WALK", "TRAIN", "DRIVE", "WORK", "SCHOOL") },
    { n: 4, title: "Numbers 30–66", items: [...numbers(30, 66), ...letters("ZPQY")] },
  ],
  4: [
    {
      n: 1,
      title: "Immediate Family",
      items: signs("FAMILY", "MOTHER", "FATHER", "PARENTS", "SISTER", "BROTHER", "BABY", "TWINS", "OLDER", "YOUNGER"),
    },
    {
      n: 2,
      title: "Extended Family",
      items: signs("GRANDMOTHER", "GRANDFATHER", "AUNT", "UNCLE", "COUSIN", "MARRIED", "DIVORCED", "DIED"),
    },
    // I/ME, HE/SHE, HIS/HER are one sign each in ASL; the second/ASL-Citizen gloss is used
    { n: 3, title: "Pronouns", items: signs("ME", "YOU", "HE", "WE", "THEY", "MY", "YOUR", "HIS", "OUR") },
    { n: 4, title: "Numbers 67–100", items: [...numbers(67, 100), ...letters("J")] },
  ],
  5: [
    {
      n: 1,
      title: "Days & Time",
      items: signs(
        "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY",
        "TODAY", "TOMORROW", "YESTERDAY", "WEEK", "MORNING", "AFTERNOON", "NIGHT",
      ),
    },
    { n: 2, title: "Chores", items: signs("CLEAN", "WASH", "DISHES", "LAUNDRY", "SHOP", "FINISH", "NOT-YET") },
    {
      n: 3,
      title: "Everyday Activities",
      items: signs("EAT", "BREAKFAST", "LUNCH", "DINNER", "SLEEP", "STUDY", "EXERCISE", "ALWAYS", "SOMETIMES", "NEVER"),
    },
    {
      n: 4,
      title: "Jobs",
      items: [...signs("WORK", "JOB", "DOCTOR", "NURSE", "LAWYER", "MECHANIC", "BOSS"), ...letters("GH")],
    },
  ],
  6: [
    // TODO: fill in once the unit story is chosen (curriculum.md: e.g. "The Gum Story")
    { n: 1, title: "Story Vocabulary", items: [] },
    // M2 grammar only; in M1 this row carries just the culture note (Gallaudet history)
    { n: 2, title: "Narrative Grammar", items: [] },
  ],
};

type UnitSpec = { id: number; title: string; description: string; optional?: boolean };

const UNIT_SPECS: UnitSpec[] = [
  { id: 1, title: "Introducing Oneself", description: "Greetings, alphabet, numbers 1–15, colors" },
  { id: 2, title: "Exchanging Personal Information", description: "People, numbers 16–29, hobbies, fingerspelling" },
  { id: 3, title: "Discussing Living Situations", description: "Home, campus, transportation, numbers 30–66" },
  { id: 4, title: "Talking About Family", description: "Family, pronouns, numbers 67–100" },
  { id: 5, title: "Telling About Activities", description: "Days, chores, daily activities, jobs" },
  { id: 6, title: "Storytelling", description: "Story vocabulary, narrative grammar", optional: true },
];

/** Review checkpoints (curriculum.md, SJSU pacing): which unit they close and which units they cover. */
const REVIEWS: { unitId: number; id: string; title: string; covers: number[] }[] = [
  { unitId: 2, id: "2.review", title: "Review A", covers: [1, 2] },
  { unitId: 4, id: "4.review", title: "Review B", covers: [3, 4] },
  { unitId: 5, id: "5.final", title: "Final Review", covers: [1, 2, 3, 4, 5] },
];

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

const regularLessons = (unitId: number): Lesson[] =>
  LESSON_SPECS[unitId].map(({ n, title, items }) => ({
    id: `${unitId}.${n}`,
    unitId,
    label: `${unitId}.${n}`,
    title,
    kind: "lesson",
    items,
    culture: CULTURE_NOTES[`${unitId}.${n}`] ?? null,
    covers: [],
  }));

function buildUnit(spec: UnitSpec): Unit {
  const lessons = regularLessons(spec.id);
  const rows: Lesson[] = [
    ...lessons,
    { id: `${spec.id}.quiz`, unitId: spec.id, label: "", title: "Unit Quiz", kind: "quiz", items: mergeItems(lessons), culture: null, covers: lessons.map((l) => l.id) },
  ];
  for (const review of REVIEWS.filter((r) => r.unitId === spec.id)) {
    const covered = review.covers.flatMap(regularLessons);
    rows.push({
      id: review.id,
      unitId: spec.id,
      label: "",
      title: review.title,
      kind: "review",
      items: mergeItems(covered),
      culture: null,
      covers: covered.map((l) => l.id),
    });
  }
  return {
    id: spec.id,
    title: spec.title,
    description: spec.description,
    minutes: MINUTES_PER_LESSON * rows.length,
    optional: spec.optional ?? false,
    lessons: rows,
  };
}

export const UNITS: readonly Unit[] = UNIT_SPECS.map(buildUnit);

const LESSONS_BY_ID = new Map(UNITS.flatMap((u) => u.lessons).map((l) => [l.id, l]));

export function findLesson(id: string): Lesson | undefined {
  return LESSONS_BY_ID.get(id);
}

export function findUnit(id: number): Unit | undefined {
  return UNITS.find((u) => u.id === id);
}

/** Every distinct item in the course, in curriculum order. Distractor pool for Recognize questions. */
export const ALL_ITEMS: readonly Item[] = mergeItems(UNITS.flatMap((u) => u.lessons));
