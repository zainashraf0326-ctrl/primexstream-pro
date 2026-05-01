-- Backfill existing Supabase Auth users into public.users
--
-- Why:
-- The admin panel counts rows from public.users, not from auth.users.
-- If your account exists in Authentication but not in public.users,
-- the admin panel will show 0 users.

create extension if not exists "pgcrypto";

insert into public.users (
  id,
  name,
  email,
  referral_code
)
select
  au.id,
  coalesce(
    nullif(trim(coalesce(au.raw_user_meta_data ->> 'full_name', '')), ''),
    nullif(trim(coalesce(au.raw_user_meta_data ->> 'name', '')), ''),
    nullif(split_part(coalesce(au.email, ''), '@', 1), ''),
    'User'
  ) as name,
  coalesce(au.email, '') as email,
  'REF' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)) as referral_code
from auth.users au
left join public.users pu on pu.id = au.id
where pu.id is null
  and au.email is not null;

-- Check the result
select count(*) as public_user_count from public.users;

select id, email, name, referral_code, created_at
from public.users
order by created_at desc
limit 20;
