# useCompletions, useUnitOverview, useStreak

- `useCompletions()` is the raw query (`['completions', userId]`). It's disabled while signed out, so it stays
  pending there.
- `useUnitOverview()` runs `unitProgress` over the completed ids. Use `resumeTarget(data)` for the Resume button.
- `useStreak()` runs `streakSummary(completedAt, now)`. It's memoized on the data and today's date key, so the
  week strip and the current streak roll over on the first render after midnight. Nothing forces a re-render at
  midnight itself.

All three share one cached query, so Home makes a single request. The derived hooks return only
`{ data, isPending, error }`, and the rules live in src/domain/ (see domain.md).
