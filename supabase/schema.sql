-- Pacer app schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh project.

-- ── profiles ────────────────────────────────────────────────────────────────
-- One row per auth user, created automatically on sign-up via the trigger below.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by their owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── activities ──────────────────────────────────────────────────────────────
-- `stats` and `route` are stored as JSON for the MVP. If/when segment matching,
-- leaderboards, or heatmaps are added, `route` should move to a PostGIS
-- geography(LineString) column instead — Supabase has PostGIS built in
-- (run `create extension if not exists postgis;` first).
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('run', 'ride', 'walk')),
  title text,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  stats jsonb not null,
  route jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists activities_user_id_started_at_idx
  on public.activities (user_id, started_at desc);

alter table public.activities enable row level security;

create policy "Users can view their own activities"
  on public.activities for select
  using (auth.uid() = user_id);

create policy "Users can insert their own activities"
  on public.activities for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own activities"
  on public.activities for update
  using (auth.uid() = user_id);

create policy "Users can delete their own activities"
  on public.activities for delete
  using (auth.uid() = user_id);
