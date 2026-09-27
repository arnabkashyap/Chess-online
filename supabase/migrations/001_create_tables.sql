-- =============================================================================
-- Element Chess — Supabase Database Migration
-- =============================================================================
-- Run this SQL in the Supabase Dashboard → SQL Editor.
-- It creates:
--   1. profiles          (one per user, auto-created on sign-up)
--   2. player_stats      (one per user, auto-created alongside profile)
--   3. matches           (one per completed/in-progress game)
--   4. RLS policies      (secure read/write access per table)
--   5. Database trigger  (auto-create profile + stats on auth.users insert)
--   6. Indexes           (for foreign-key lookups and common queries)
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PROFILES
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique,
  display_name text,
  avatar_url  text,
  is_guest    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'User profiles — one row per authenticated user.';

-- Auto-update the updated_at timestamp on every row change.
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. PLAYER STATS
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.player_stats (
  user_id         uuid primary key references public.profiles(id) on delete cascade,
  matches_played  integer not null default 0,
  wins            integer not null default 0,
  losses          integer not null default 0,
  draws           integer not null default 0,
  score           integer not null default 0,
  rating          integer not null default 1200,
  current_streak  integer not null default 0,
  best_streak     integer not null default 0,
  updated_at      timestamptz not null default now()
);

comment on table public.player_stats is 'Aggregated stats per player.';

create trigger set_player_stats_updated_at
  before update on public.player_stats
  for each row execute function public.handle_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. MATCHES
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.matches (
  id               uuid primary key default gen_random_uuid(),
  white_player_id  uuid references public.profiles(id) on delete set null,
  black_player_id  uuid references public.profiles(id) on delete set null,
  winner_id        uuid references public.profiles(id) on delete set null,
  result           text check (result in ('white', 'black', 'draw')),
  game_mode        text not null check (game_mode in ('local', 'bot', 'multiplayer')),
  moves            jsonb,
  duration         integer,                      -- seconds
  started_at       timestamptz not null default now(),
  ended_at         timestamptz
);

comment on table public.matches is 'One row per completed or in-progress match.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

create index if not exists idx_matches_white_player on public.matches(white_player_id);
create index if not exists idx_matches_black_player on public.matches(black_player_id);
create index if not exists idx_matches_winner       on public.matches(winner_id);
create index if not exists idx_matches_started_at   on public.matches(started_at desc);
create index if not exists idx_profiles_username     on public.profiles(username);


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS on all tables
alter table public.profiles    enable row level security;
alter table public.player_stats enable row level security;
alter table public.matches     enable row level security;


-- ── profiles ────────────────────────────────────────────────────────────────

-- Anyone can read profiles (for leaderboards, match previews, etc.)
create policy "profiles: public read"
  on public.profiles for select
  using (true);

-- Users can only update their OWN profile
create policy "profiles: owner update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Inserts are handled by the database trigger (service role); block client inserts.
-- If you need client-side insert (e.g., for manual guest flow), uncomment below:
-- create policy "profiles: self insert"
--   on public.profiles for insert
--   with check (auth.uid() = id);


-- ── player_stats ────────────────────────────────────────────────────────────

-- Anyone can read stats (for leaderboards)
create policy "player_stats: public read"
  on public.player_stats for select
  using (true);

-- Users can only update their OWN stats
create policy "player_stats: owner update"
  on public.player_stats for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ── matches ─────────────────────────────────────────────────────────────────

-- Anyone can read matches (for replays, match history)
create policy "matches: public read"
  on public.matches for select
  using (true);

-- Authenticated users can insert a match they participate in
create policy "matches: participant insert"
  on public.matches for insert
  with check (
    auth.uid() = white_player_id
    or auth.uid() = black_player_id
  );

-- Only participants can update their own match (e.g., recording result)
create policy "matches: participant update"
  on public.matches for update
  using (
    auth.uid() = white_player_id
    or auth.uid() = black_player_id
  )
  with check (
    auth.uid() = white_player_id
    or auth.uid() = black_player_id
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. AUTO-CREATE PROFILE + STATS ON SIGN-UP
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url, is_guest)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', 'Player'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', null),
    coalesce((new.raw_user_meta_data ->> 'is_guest')::boolean, new.is_anonymous, false)
  );

  insert into public.player_stats (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

-- Drop the trigger first if it already exists (idempotent re-runs)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
