-- Fix for Supabase Auth signup failing with:
-- "Database error saving new user"
--
-- Why this happens:
-- A legacy trigger on auth.users is still running during signup and is trying
-- to create a profile row using an outdated schema or function.
--
-- This script replaces that trigger with a safe version that matches the
-- current app flow and public.users schema.

create extension if not exists "pgcrypto";

-- Remove common legacy auth signup triggers if they exist.
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists trg_on_auth_user_created on auth.users;
drop trigger if exists trg_handle_new_user on auth.users;
drop trigger if exists auth_users_profile_sync on auth.users;
drop trigger if exists create_user_profile_on_signup on auth.users;

-- Remove common legacy trigger functions if they exist.
drop function if exists public.handle_new_user() cascade;
drop function if exists public.create_user_profile() cascade;
drop function if exists public.sync_auth_user_to_public_user() cascade;
drop function if exists public.create_profile_for_new_user() cascade;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  generated_referral_code text;
  display_name text;
begin
  display_name := coalesce(
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'name', '')), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'User'
  );

  generated_referral_code :=
    'REF' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into public.users (
    id,
    name,
    email,
    referral_code
  )
  values (
    new.id,
    display_name,
    coalesce(new.email, ''),
    generated_referral_code
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Optional verification queries:
-- select tgname from pg_trigger t
-- join pg_class c on c.oid = t.tgrelid
-- join pg_namespace n on n.oid = c.relnamespace
-- where n.nspname = 'auth' and c.relname = 'users' and not t.tgisinternal;
--
-- select proname from pg_proc p
-- join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and proname in (
--   'handle_new_user',
--   'create_user_profile',
--   'sync_auth_user_to_public_user',
--   'create_profile_for_new_user'
-- );
