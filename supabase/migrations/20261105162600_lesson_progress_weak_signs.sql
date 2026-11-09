-- public.lesson_progress: where a user is inside an unfinished lesson, so leaving and coming back resumes [S.6].
-- public.weak_signs: items the user missed in a Produce step, for Practice "Weak" mode [S.23, P.10].
--
-- Both are private per user: RLS limits every operation to the user's own rows, user_id comes from auth.uid(),
-- and column grants keep user_id and timestamps out of the client's reach.
-- Reuses private.set_updated_at() from 20261105151337_profiles.sql.

-- ===========================================================================
-- lesson_progress: one row per (user, lesson) while the lesson is unfinished
-- ===========================================================================
create table public.lesson_progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Same id format as lesson_completions.lesson_id ('1.1', '1.quiz', '2.review', '5.final').
  lesson_id text not null
    constraint lesson_progress_lesson_id_format
      check (char_length(lesson_id) <= 16 and lesson_id ~ '^[1-9][0-9]?\.([1-9][0-9]?|quiz|review|final)$'),
  step_index integer not null default 0 constraint lesson_progress_step_index_range check (step_index between 0 and 16),
  item_index integer not null default 0 constraint lesson_progress_item_index_range check (item_index between 0 and 1000),
  -- Seed of the shuffled plan (question order, answer choices), so a resumed lesson shows the same questions.
  seed integer not null default 0 constraint lesson_progress_seed_nonneg check (seed >= 0),
  -- Answers so far, keyed by "step:item" ({ r: { "1:0": "sign:HELLO" }, p: { "2:0": { v, p, c, e } } }).
  -- Kept so the score on the completion screen includes answers from before the user left.
  answers jsonb not null default '{}'::jsonb
    constraint lesson_progress_answers_object check (jsonb_typeof(answers) = 'object')
    constraint lesson_progress_answers_size check (pg_column_size(answers) <= 65536),
  updated_at timestamptz not null default now(),
  -- The PK is also the index for the only read (user_id = ? and lesson_id = ?) and covers the user_id FK.
  constraint lesson_progress_pkey primary key (user_id, lesson_id)
);

comment on table public.lesson_progress is 'Resume point of an unfinished lesson. Deleted when the lesson is completed.';

alter table public.lesson_progress enable row level security;

-- Upsert from the client (PostgREST on_conflict=user_id,lesson_id) needs INSERT on the columns it sends and UPDATE
-- on the same columns, since DO UPDATE SETs every sent column. lesson_id is in the UPDATE grant only for that
-- reason; the WITH CHECK below still pins the row to its owner.
revoke all on table public.lesson_progress from anon, authenticated;
grant select, delete on table public.lesson_progress to authenticated;
grant insert (lesson_id, step_index, item_index, seed, answers) on table public.lesson_progress to authenticated;
grant update (lesson_id, step_index, item_index, seed, answers) on table public.lesson_progress to authenticated;

create policy "lesson_progress_select_own"
  on public.lesson_progress for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "lesson_progress_insert_own"
  on public.lesson_progress for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "lesson_progress_update_own"
  on public.lesson_progress for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "lesson_progress_delete_own"
  on public.lesson_progress for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create trigger lesson_progress_set_updated_at
  before update on public.lesson_progress
  for each row execute function private.set_updated_at();

-- ===========================================================================
-- weak_signs: one row per (user, item) the user has missed
-- ===========================================================================
create table public.weak_signs (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- itemKey() from src/domain/signContent.ts: 'sign:THANK-YOU', 'letter:A', 'number:7'.
  item_key text not null
    constraint weak_signs_item_key_format
      check (char_length(item_key) <= 64 and item_key ~ '^(sign:[A-Z0-9''-]+|letter:[A-Z]|number:(0|[1-9][0-9]{0,2}))$'),
  misses integer not null default 1 constraint weak_signs_misses_nonneg check (misses >= 0),
  -- Correct Produce answers in a row since the last miss. Practice removes the row at 3 [P.10].
  correct_streak integer not null default 0 constraint weak_signs_correct_streak_nonneg check (correct_streak >= 0),
  updated_at timestamptz not null default now(),
  -- Also the index for reads by user and for the user_id FK.
  constraint weak_signs_user_item_key unique (user_id, item_key)
);

comment on table public.weak_signs is 'Items a user missed in Produce, for Practice Weak mode. Removed after 3 correct in a row.';

alter table public.weak_signs enable row level security;

-- INSERT/UPDATE grants are what record_weak_miss() (SECURITY INVOKER) needs; Practice will also UPDATE
-- correct_streak and DELETE rows. user_id and updated_at are never client-writable.
revoke all on table public.weak_signs from anon, authenticated;
grant select, delete on table public.weak_signs to authenticated;
grant insert (item_key) on table public.weak_signs to authenticated;
grant update (misses, correct_streak) on table public.weak_signs to authenticated;

create policy "weak_signs_select_own"
  on public.weak_signs for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "weak_signs_insert_own"
  on public.weak_signs for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "weak_signs_update_own"
  on public.weak_signs for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "weak_signs_delete_own"
  on public.weak_signs for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create trigger weak_signs_set_updated_at
  before update on public.weak_signs
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- record_weak_miss(item_key): add the item, or count one more miss and reset its streak. Atomic, which a
-- client-side read-then-upsert can't be. SECURITY INVOKER, so RLS and the grants above still apply:
-- the row's user_id is the caller's auth.uid() (column default) and the conflict target is the caller's own row.
-- ---------------------------------------------------------------------------
create function public.record_weak_miss(p_item_key text)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.weak_signs (item_key)
  values (p_item_key)
  on conflict (user_id, item_key)
  do update set misses = public.weak_signs.misses + 1, correct_streak = 0;
$$;

revoke execute on function public.record_weak_miss(text) from public, anon;
grant execute on function public.record_weak_miss(text) to authenticated;
