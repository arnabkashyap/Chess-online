-- =============================================================================
-- Element Chess — Supabase Migration 002: Add Elemental Stats & Match Changes
-- =============================================================================

-- 1. Add elemental spell counters to player_stats table
alter table public.player_stats
  add column if not exists fire_spells_used  integer not null default 0,
  add column if not exists ice_spells_used   integer not null default 0,
  add column if not exists earth_spells_used integer not null default 0,
  add column if not exists wind_spells_used  integer not null default 0,
  add column if not exists total_spells_used integer not null default 0;

comment on column public.player_stats.fire_spells_used  is 'Total Fire spells successfully cast by player.';
comment on column public.player_stats.ice_spells_used   is 'Total Ice spells successfully cast by player.';
comment on column public.player_stats.earth_spells_used is 'Total Earth spells successfully cast by player.';
comment on column public.player_stats.wind_spells_used  is 'Total Wind spells successfully cast by player.';
comment on column public.player_stats.total_spells_used is 'Sum of all elemental spells successfully cast by player.';


-- 2. Add rating_change, score_change, and spells_used columns to matches table
alter table public.matches
  add column if not exists rating_change integer default 0,
  add column if not exists score_change  integer default 0,
  add column if not exists spells_used   jsonb default '{"fire":0,"ice":0,"earth":0,"wind":0,"total":0}'::jsonb;

comment on column public.matches.rating_change is 'Net ELO change for active player in this match.';
comment on column public.matches.score_change  is 'Score points awarded to active player in this match.';
comment on column public.matches.spells_used   is 'Breakdown of elemental spells cast in this match.';
