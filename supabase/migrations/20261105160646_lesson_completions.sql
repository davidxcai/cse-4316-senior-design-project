-- public.lesson_completions: one row each time a user finishes a lesson, quiz or review.
--
-- Append-only from the client: users can read and insert their own rows, nothing else.
-- Redoing a lesson adds another row, so there is no unique (user_id, lesson_id).
-- Unit progress and streaks are derived client-side from these rows (src/domain/).

create table public.lesson_completions (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Ids from src/domain/curriculum.ts: '1.1', '1.quiz', '2.review', '5.final'.
  -- The format check stops junk; it doesn't know which ids exist, so new lessons need no migration.
  lesson_id text not null
    constraint lesson_completions_lesson_id_format
      check (char_length(lesson_id) <= 16 and lesson_id ~ '^[1-9][0-9]?\.([1-9][0-9]?|quiz|review|final)$'),
  completed_at timestamptz not null default now()
);

comment on table public.lesson_completions is 'Append-only log of finished lessons/quizzes/reviews. Progress and streaks are derived from it.';

-- Matches the only read: where user_id = ? order by completed_at. Also covers the user_id FK.
create index lesson_completions_user_id_completed_at_idx
  on public.lesson_completions (user_id, completed_at);

alter table public.lesson_completions enable row level security;

-- ---------------------------------------------------------------------------
-- Grants: explicit, since new tables may not be auto-exposed to the Data API.
-- Column-level INSERT means the client can only supply lesson_id: user_id comes
-- from auth.uid() and completed_at from now(), so neither can be forged
-- (no backdating to fake a streak). Identity columns need no sequence grant.
-- ---------------------------------------------------------------------------
revoke all on table public.lesson_completions from anon, authenticated;
grant select on table public.lesson_completions to authenticated;
grant insert (lesson_id) on table public.lesson_completions to authenticated;

-- ---------------------------------------------------------------------------
-- Policies. No update/delete policies (and no grants): completions are history.
-- ---------------------------------------------------------------------------
create policy "lesson_completions_select_own"
  on public.lesson_completions for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "lesson_completions_insert_own"
  on public.lesson_completions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
