-- public.reset_progress(): delete all of the caller's progress (completions, resume points, weak signs) at once.
--
-- SECURITY DEFINER because lesson_completions is append-only for clients (no DELETE grant or policy), and that
-- should stay true for single rows. This function is the only way to clear it, and only ever for auth.uid().
-- One function call is one transaction, so a reset never leaves the tables half-cleared.

create function public.reset_progress()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  delete from public.lesson_completions where user_id = v_uid;
  delete from public.lesson_progress where user_id = v_uid;
  delete from public.weak_signs where user_id = v_uid;
end;
$$;

revoke execute on function public.reset_progress() from public, anon;
grant execute on function public.reset_progress() to authenticated;
