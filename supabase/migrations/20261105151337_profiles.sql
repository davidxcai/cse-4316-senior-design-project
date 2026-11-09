-- public.profiles: one row per auth user (display name + dominant hand).
--
-- Rows are created by a trigger on auth.users, never by the client, so there are
-- no insert/delete policies or grants. Deleting the auth user cascades here.

-- ---------------------------------------------------------------------------
-- Private schema for trigger functions
-- ---------------------------------------------------------------------------
-- Why a separate schema: Postgres grants EXECUTE on new functions to PUBLIC, and
-- anything in `public` is reachable through the Data API (as /rpc/...). The
-- signup trigger function is SECURITY DEFINER (it must insert into
-- public.profiles, which `authenticated` can't), so putting it in a schema that
-- isn't exposed, with no USAGE for API roles, *and* revoking EXECUTE means it
-- can't be called directly, only fired by the trigger. Trigger firing doesn't
-- check EXECUTE or schema USAGE, so the revokes don't break it.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null
    constraint profiles_name_length check (char_length(btrim(name)) between 1 and 50),
  dominant_hand text not null default 'right'
    constraint profiles_dominant_hand_valid check (dominant_hand in ('left', 'right')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Per-user display data. Seeded from signup metadata; never used for authorization.';

alter table public.profiles enable row level security;

-- ---------------------------------------------------------------------------
-- Grants: explicit, since new tables may not be auto-exposed to the Data API.
-- Signed-in users can read their row and change only name / dominant_hand.
-- Column-level UPDATE keeps id, created_at and updated_at out of reach.
-- ---------------------------------------------------------------------------
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (name, dominant_hand) on table public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Policies (UPDATE also needs the SELECT policy to find the row)
-- ---------------------------------------------------------------------------
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- updated_at maintenance (SECURITY INVOKER: touches no other tables)
-- ---------------------------------------------------------------------------
create function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

revoke execute on function private.set_updated_at() from public, anon, authenticated;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Seed a profile row on signup
-- ---------------------------------------------------------------------------
-- raw_user_meta_data is user-controlled (supabase.auth.signUp options.data), so
-- it only seeds display fields here and is coerced to valid values. Bad input
-- must never fail the insert, because a failing trigger blocks the signup.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := pg_catalog.btrim(coalesce(new.raw_user_meta_data ->> 'name', ''));
  v_hand text := new.raw_user_meta_data ->> 'dominant_hand';
begin
  if v_name = '' then
    v_name := pg_catalog.split_part(coalesce(new.email, ''), '@', 1);
  end if;
  v_name := pg_catalog.btrim(pg_catalog.substr(v_name, 1, 50));
  if v_name = '' then
    v_name := 'Signer';  -- no usable name or email (e.g. phone-only user)
  end if;

  insert into public.profiles (id, name, dominant_hand)
  values (
    new.id,
    v_name,
    case when v_hand in ('left', 'right') then v_hand else 'right' end
  );
  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
