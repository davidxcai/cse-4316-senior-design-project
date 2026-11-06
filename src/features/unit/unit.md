# features/unit

Learn page at `/unit/$unitId` (wireframes §2, L.2–L.8). The route file only parses the id and renders `UnitPage`.

- `UnitPage` reads `useUnit(unitId)` (domain/progress data, owned elsewhere) and shows not-found, error, skeleton or the page.
- `UnitHeader` reuses the shared `UnitTile` and `unitStyle` (components/unit/) for the colour, and the shared `ProgressBar` for done/total.
- `LessonRow` is one component with a `kind` prop (lesson | quiz | review), not three. Quiz and review rows swap the label for IconPencil / IconRefresh. Locked rows render a plain `div`, everything else is a `Link` to the lesson, so done rows stay openable (L.8). "Available" rows show the number only; done / current / locked get an icon.
- Sign count is the number of distinct items in the row (`itemKey`), shown on lesson rows only (not quiz/review, per the wireframe) and hidden when 0 (Unit 6 is empty).
