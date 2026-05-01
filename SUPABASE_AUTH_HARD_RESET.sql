-- Hard reset for Supabase signup failures that still show:
-- "Database error saving new user"
--
-- Use this if signup still fails after running the first auth fix.
-- This script removes every non-internal trigger from auth.users so
-- Supabase Auth signup can complete without any legacy profile-sync code.
--
-- The app already creates/fills public.users after the user signs in,
-- so custom auth.users triggers are not required for this project.

do $$
declare
  trigger_name text;
begin
  for trigger_name in
    select t.tgname
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'auth'
      and c.relname = 'users'
      and not t.tgisinternal
  loop
    execute format('drop trigger if exists %I on auth.users;', trigger_name);
  end loop;
end $$;

-- Remove common public trigger functions that are often left behind.
drop function if exists public.handle_new_user() cascade;
drop function if exists public.create_user_profile() cascade;
drop function if exists public.sync_auth_user_to_public_user() cascade;
drop function if exists public.create_profile_for_new_user() cascade;
drop function if exists public.handle_auth_user_created() cascade;
drop function if exists public.on_auth_user_created() cascade;

-- Verify: this should return zero rows after the reset.
select t.tgname
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'auth'
  and c.relname = 'users'
  and not t.tgisinternal;
