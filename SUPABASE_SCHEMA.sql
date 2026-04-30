-- PrimexStream Pro - Supabase schema migration
-- Run this in the Supabase SQL Editor.

create extension if not exists "pgcrypto";

-- ===== ADMIN ACCESS =====
create table if not exists public.admin_users (
  email text primary key
);

insert into public.admin_users (email)
values ('zainashraf0326@gmail.com'), ('admin@primexstream.com')
on conflict (email) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ===== USERS PROFILE =====
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'User',
  email text not null unique,
  referral_code text not null unique,
  referred_by uuid references public.users(id) on delete set null,
  applied_referral_code text,
  total_referrals integer not null default 0,
  credits numeric(12,2) not null default 0,
  usable_balance numeric(12,2) not null default 0,
  wallet_balance numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_referral_code on public.users(referral_code);
create index if not exists idx_users_referred_by on public.users(referred_by);

-- ===== ORDERS =====
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  user_email text,
  plan text,
  plan_id text,
  plan_name text,
  amount numeric(12,2) default 0,
  final_price numeric(12,2) default 0,
  status text not null default 'pending' check (status in ('pending','approved','rejected','completed','expired','active')),
  payment_method text,
  transaction_id text,
  payment_proof_url text,
  payment_proof_path text,
  username text,
  password text,
  url text,
  expiry_date text,
  reject_reason text,
  credentials jsonb,
  is_guest boolean not null default false,
  guest_email text,
  guest_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders alter column user_id type text using user_id::text;
alter table public.orders add column if not exists payment_proof_path text;

create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);

-- ===== REFERRALS =====
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_uid uuid not null references public.users(id) on delete cascade,
  referrer_name text,
  referrer_email text,
  referred_uid uuid not null references public.users(id) on delete cascade,
  referred_name text,
  referred_email text,
  referral_code text not null,
  joined_at timestamptz not null default now(),
  purchased_plan boolean not null default false,
  purchased_at timestamptz,
  purchased_plan_name text,
  reward_amount numeric(12,2) not null default 5,
  reward_claimed boolean not null default false,
  claimed_at timestamptz,
  last_reminder_sent timestamptz,
  reminder_count integer not null default 0,
  status text not null default 'joined' check (status in ('joined','purchased','claimed'))
);

create unique index if not exists idx_referrals_unique_pair on public.referrals(referrer_uid, referred_uid);
create index if not exists idx_referrals_referrer on public.referrals(referrer_uid);
create index if not exists idx_referrals_referred on public.referrals(referred_uid);
create index if not exists idx_referrals_status on public.referrals(status);

-- ===== NOTIFICATIONS =====
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  type text not null default 'general',
  title text not null,
  message text not null,
  link text,
  read boolean not null default false,
  deleted boolean not null default false,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_read on public.notifications(user_id, read);
create index if not exists idx_notifications_deleted on public.notifications(user_id, deleted);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);

-- ===== WALLET / REWARDS =====
create table if not exists public.wallet_history (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  type text not null,
  amount numeric(12,2) not null,
  description text,
  reason text,
  referral_id uuid references public.referrals(id) on delete set null,
  source_id text,
  balance_before numeric(12,2),
  balance_after numeric(12,2),
  created_at timestamptz not null default now()
);

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid references public.users(id) on delete cascade,
  referred_user_id uuid references public.users(id) on delete set null,
  type text not null,
  amount numeric(12,2) not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_wallet_history_user_id on public.wallet_history(user_id);
create index if not exists idx_wallet_history_created_at on public.wallet_history(created_at desc);
create index if not exists idx_rewards_referrer on public.rewards(referrer_id);

-- ===== CONFIG / SETTINGS =====
create table if not exists public.app_config (
  id text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_settings (
  id text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_content (
  id text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(12,2) not null default 0,
  sale_price numeric(12,2),
  discount numeric(12,2) default 0,
  duration integer,
  duration_days integer,
  features text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_methods (
  id text primary key,
  name text not null,
  icon text,
  instructions text,
  account_info text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  file_name text not null,
  image_url text not null,
  file_type text,
  file_size bigint,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.social_task_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  user_name text,
  user_email text,
  platforms jsonb not null default '[]'::jsonb,
  status text not null default 'pending',
  approval_status text not null default 'pending' check (approval_status in ('pending','approved','rejected')),
  admin_notes text,
  reward jsonb,
  approved_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_uploads_user_id on public.uploads(user_id);
create index if not exists idx_social_task_user_id on public.social_task_submissions(user_id);
create index if not exists idx_social_task_status on public.social_task_submissions(approval_status);

-- ===== AUTO UPDATE TIMESTAMP =====
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists trg_payment_methods_updated_at on public.payment_methods;
create trigger trg_payment_methods_updated_at before update on public.payment_methods
for each row execute function public.set_updated_at();

drop trigger if exists trg_social_task_updated_at on public.social_task_submissions;
create trigger trg_social_task_updated_at before update on public.social_task_submissions
for each row execute function public.set_updated_at();

-- ===== REFERRAL COUNTER SYNC =====
create or replace function public.sync_total_referrals()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    update public.users
      set total_referrals = total_referrals + 1
      where id = new.referrer_uid;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.users
      set total_referrals = greatest(total_referrals - 1, 0)
      where id = old.referrer_uid;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_sync_total_referrals_ins on public.referrals;
create trigger trg_sync_total_referrals_ins
after insert on public.referrals
for each row execute function public.sync_total_referrals();

drop trigger if exists trg_sync_total_referrals_del on public.referrals;
create trigger trg_sync_total_referrals_del
after delete on public.referrals
for each row execute function public.sync_total_referrals();

-- ===== ROW LEVEL SECURITY =====
alter table public.admin_users enable row level security;
alter table public.users enable row level security;
alter table public.orders enable row level security;
alter table public.referrals enable row level security;
alter table public.notifications enable row level security;
alter table public.wallet_history enable row level security;
alter table public.rewards enable row level security;
alter table public.uploads enable row level security;
alter table public.app_config enable row level security;
alter table public.admin_settings enable row level security;
alter table public.admin_content enable row level security;
alter table public.plans enable row level security;
alter table public.payment_methods enable row level security;
alter table public.social_task_submissions enable row level security;

-- Drop existing app policies so reruns are safe.
drop policy if exists "admin_users_admin_read" on public.admin_users;
drop policy if exists "users_select_app" on public.users;
drop policy if exists "users_insert_own" on public.users;
drop policy if exists "users_update_own_or_admin" on public.users;
drop policy if exists "orders_select_app" on public.orders;
drop policy if exists "orders_insert_app" on public.orders;
drop policy if exists "orders_update_app" on public.orders;
drop policy if exists "referrals_select_related" on public.referrals;
drop policy if exists "referrals_insert_related" on public.referrals;
drop policy if exists "referrals_update_related" on public.referrals;
drop policy if exists "notifications_select_related" on public.notifications;
drop policy if exists "notifications_insert_related" on public.notifications;
drop policy if exists "notifications_update_related" on public.notifications;
drop policy if exists "wallet_history_select_related" on public.wallet_history;
drop policy if exists "wallet_history_insert_related" on public.wallet_history;
drop policy if exists "rewards_select_related" on public.rewards;
drop policy if exists "rewards_insert_related" on public.rewards;
drop policy if exists "uploads_select_related" on public.uploads;
drop policy if exists "uploads_insert_related" on public.uploads;
drop policy if exists "uploads_delete_related" on public.uploads;
drop policy if exists "app_config_read_all" on public.app_config;
drop policy if exists "app_config_write_admin" on public.app_config;
drop policy if exists "admin_settings_read_all" on public.admin_settings;
drop policy if exists "admin_settings_write_admin" on public.admin_settings;
drop policy if exists "admin_content_read_all" on public.admin_content;
drop policy if exists "admin_content_write_admin" on public.admin_content;
drop policy if exists "plans_read_all" on public.plans;
drop policy if exists "plans_write_admin" on public.plans;
drop policy if exists "payment_methods_read_all" on public.payment_methods;
drop policy if exists "payment_methods_write_admin" on public.payment_methods;
drop policy if exists "social_tasks_select_related" on public.social_task_submissions;
drop policy if exists "social_tasks_insert_own" on public.social_task_submissions;
drop policy if exists "social_tasks_update_admin" on public.social_task_submissions;

create policy "admin_users_admin_read"
on public.admin_users for select
using (public.is_admin());

create policy "users_select_app"
on public.users for select
using (true);

create policy "users_insert_own"
on public.users for insert
with check (auth.uid() = id or public.is_admin());

create policy "users_update_own_or_admin"
on public.users for update
using (auth.uid() = id or public.is_admin())
with check (auth.uid() = id or public.is_admin());

create policy "orders_select_app"
on public.orders for select
using (public.is_admin() or auth.uid()::text = user_id);

create policy "orders_insert_app"
on public.orders for insert
with check (public.is_admin() or auth.uid()::text = user_id or is_guest = true);

create policy "orders_update_app"
on public.orders for update
using (public.is_admin() or auth.uid()::text = user_id)
with check (public.is_admin() or auth.uid()::text = user_id);

create policy "referrals_select_related"
on public.referrals for select
using (public.is_admin() or auth.uid() = referrer_uid or auth.uid() = referred_uid);

create policy "referrals_insert_related"
on public.referrals for insert
with check (public.is_admin() or auth.uid() = referrer_uid or auth.uid() = referred_uid);

create policy "referrals_update_related"
on public.referrals for update
using (public.is_admin() or auth.uid() = referrer_uid or auth.uid() = referred_uid)
with check (public.is_admin() or auth.uid() = referrer_uid or auth.uid() = referred_uid);

create policy "notifications_select_related"
on public.notifications for select
using (public.is_admin() or auth.uid()::text = user_id);

create policy "notifications_insert_related"
on public.notifications for insert
with check (public.is_admin() or auth.uid()::text = user_id);

create policy "notifications_update_related"
on public.notifications for update
using (public.is_admin() or auth.uid()::text = user_id)
with check (public.is_admin() or auth.uid()::text = user_id);

create policy "wallet_history_select_related"
on public.wallet_history for select
using (public.is_admin() or auth.uid()::text = user_id);

create policy "wallet_history_insert_related"
on public.wallet_history for insert
with check (public.is_admin() or auth.uid()::text = user_id);

create policy "rewards_select_related"
on public.rewards for select
using (public.is_admin() or auth.uid() = referrer_id or auth.uid() = referred_user_id);

create policy "rewards_insert_related"
on public.rewards for insert
with check (public.is_admin() or auth.uid() = referrer_id);

create policy "uploads_select_related"
on public.uploads for select
using (public.is_admin() or auth.uid()::text = user_id);

create policy "uploads_insert_related"
on public.uploads for insert
with check (public.is_admin() or auth.uid()::text = user_id);

create policy "uploads_delete_related"
on public.uploads for delete
using (public.is_admin() or auth.uid()::text = user_id);

create policy "app_config_read_all"
on public.app_config for select
using (true);

create policy "app_config_write_admin"
on public.app_config for all
using (public.is_admin())
with check (public.is_admin());

create policy "admin_settings_read_all"
on public.admin_settings for select
using (true);

create policy "admin_settings_write_admin"
on public.admin_settings for all
using (public.is_admin())
with check (public.is_admin());

create policy "admin_content_read_all"
on public.admin_content for select
using (true);

create policy "admin_content_write_admin"
on public.admin_content for all
using (public.is_admin())
with check (public.is_admin());

create policy "plans_read_all"
on public.plans for select
using (true);

create policy "plans_write_admin"
on public.plans for all
using (public.is_admin())
with check (public.is_admin());

create policy "payment_methods_read_all"
on public.payment_methods for select
using (true);

create policy "payment_methods_write_admin"
on public.payment_methods for all
using (public.is_admin())
with check (public.is_admin());

create policy "social_tasks_select_related"
on public.social_task_submissions for select
using (public.is_admin() or auth.uid()::text = user_id);

create policy "social_tasks_insert_own"
on public.social_task_submissions for insert
with check (public.is_admin() or auth.uid()::text = user_id);

create policy "social_tasks_update_admin"
on public.social_task_submissions for update
using (public.is_admin())
with check (public.is_admin());

-- ===== STORAGE BUCKETS =====
insert into storage.buckets (id, name, public)
values ('images', 'images', true), ('payment-proofs', 'payment-proofs', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "storage_public_read_app_buckets" on storage.objects;
drop policy if exists "storage_authenticated_insert_app_buckets" on storage.objects;
drop policy if exists "storage_authenticated_delete_app_buckets" on storage.objects;

create policy "storage_public_read_app_buckets"
on storage.objects for select
using (bucket_id in ('images', 'payment-proofs'));

create policy "storage_authenticated_insert_app_buckets"
on storage.objects for insert
with check (bucket_id in ('images', 'payment-proofs') and auth.role() = 'authenticated');

create policy "storage_authenticated_delete_app_buckets"
on storage.objects for delete
using (bucket_id in ('images', 'payment-proofs') and (auth.role() = 'authenticated' or public.is_admin()));

-- ===== REALTIME PUBLICATION =====
do $$
declare
  t text;
begin
  foreach t in array array[
    'users',
    'orders',
    'referrals',
    'notifications',
    'wallet_history',
    'plans',
    'payment_methods',
    'social_task_submissions',
    'admin_settings',
    'app_config',
    'admin_content',
    'uploads'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
