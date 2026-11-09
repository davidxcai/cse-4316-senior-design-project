/** Daily streak [7.4]: a local calendar day counts if it has ≥1 lesson completion. Pure. See domain.md. */

export type WeekDay = {
  /** YYYY-MM-DD in local time */
  date: string;
  done: boolean;
  isToday: boolean;
  isFuture: boolean;
};

export type StreakSummary = {
  /** Mon..Sun of the week containing `now` */
  week: WeekDay[];
  /** consecutive days ending today, or ending yesterday if today has no completion yet */
  current: number;
  /** longest run ever */
  best: number;
};

const pad = (n: number) => String(n).padStart(2, "0");

/** Local calendar day as YYYY-MM-DD (sorts and compares as a string). */
export const localDayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Same local day shifted by `days`. Built from y/m/d, not ms, so DST changes can't skip or repeat a day. */
const addDays = (d: Date, days: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);

const dateFromKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export function streakSummary(completedAt: Date[], now: Date): StreakSummary {
  const days = new Set(completedAt.map(localDayKey));
  const todayKey = localDayKey(now);

  // current: walk back from today (or yesterday, if today isn't done yet)
  let current = 0;
  let cursor = days.has(todayKey) ? now : addDays(now, -1);
  while (days.has(localDayKey(cursor))) {
    current++;
    cursor = addDays(cursor, -1);
  }

  // best: longest run over all distinct days
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const key of [...days].sort()) {
    run = prev !== null && localDayKey(addDays(dateFromKey(prev), 1)) === key ? run + 1 : 1;
    best = Math.max(best, run);
    prev = key;
  }

  // week: Monday-first
  const monday = addDays(now, -((now.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i): WeekDay => {
    const date = localDayKey(addDays(monday, i));
    return { date, done: days.has(date), isToday: date === todayKey, isFuture: date > todayKey };
  });

  return { week, current, best };
}
