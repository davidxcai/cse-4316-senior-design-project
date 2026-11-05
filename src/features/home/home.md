# features/home

Home page at `/home` (4.3, 4.5, H.1, 5.1a–5.10). Route file is a thin wrapper around `HomePage`.

- **No copy beyond labels.** Banner is week strip + icon/value stats + Resume. Error is icon + "Couldn't load". Loading is daisyUI skeletons.
- **Resume**: `useResumeTarget` wraps `useUnitOverview` + `resumeTarget()`. `ResumeButton` and `UnitList` both use it (React Query dedupes the fetch). Button is hidden when the target is null.
- **Default list** (`visibleUnits.ts`): current unit + up to 2 ahead; falls back to unit 1. "All" expands in place (local `useState`, no navigation).
- **Optional badge** on unit 6 only appears when the full list is shown.
- **Unit tile color/icon** live in `unitStyle.ts` (daisyUI theme colors, Tabler icons). Literal class strings so Tailwind picks them up.
- **Locked rows**: lock icon, no link, no progress bar. 'not-started' rows get no status badge.
- Lesson count counts only `kind === 'lesson'` items.
