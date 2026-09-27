-- =============================================================================
-- Element Chess — Supabase Migration 003: Secure RLS & Match Recording RPC
-- =============================================================================

-- 1. Remove direct client UPDATE policy on player_stats to prevent client-side score/rating tampering
drop policy if exists "player_stats: owner update" on public.player_stats;

-- 2. Create atomic, secure SECURITY DEFINER RPC function for recording matches and updating player stats
create or replace function public.record_completed_match_rpc(
  p_user_id uuid,
  p_game_mode text,
  p_result text,
  p_white_player_id uuid,
  p_black_player_id uuid,
  p_moves jsonb default '[]'::jsonb,
  p_started_at timestamptz default now(),
  p_ended_at timestamptz default now(),
  p_duration integer default 0,
  p_spells_cast jsonb default '{"fire":0,"ice":0,"earth":0,"wind":0}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_winner_id uuid;
  v_current_stats public.player_stats%rowtype;
  v_is_win boolean;
  v_is_draw boolean;
  v_outcome text;
  v_expected_score double precision;
  v_actual_score double precision;
  v_rating_change integer := 0;
  v_new_rating integer;
  v_duration_bonus integer := 0;
  v_score_awarded integer := 0;
  v_new_score integer;
  v_current_streak integer := 0;
  v_best_streak integer := 0;
  v_fire_cast integer := 0;
  v_ice_cast integer := 0;
  v_earth_cast integer := 0;
  v_wind_cast integer := 0;
  v_total_cast integer := 0;
  v_match_id uuid;
begin
  -- Validate caller: auth.uid() must match p_user_id if authenticated
  if auth.uid() is not null and p_user_id is not null and auth.uid() <> p_user_id then
    raise exception 'Unauthorized match record attempt.';
  end if;

  -- Determine winner ID
  if p_result = 'white' then
    v_winner_id := p_white_player_id;
  elsif p_result = 'black' then
    v_winner_id := p_black_player_id;
  else
    v_winner_id := null;
  end if;

  -- Extract spell counts safely
  if p_spells_cast is not null then
    v_fire_cast  := coalesce((p_spells_cast ->> 'fire')::integer, 0);
    v_ice_cast   := coalesce((p_spells_cast ->> 'ice')::integer, 0);
    v_earth_cast := coalesce((p_spells_cast ->> 'earth')::integer, 0);
    v_wind_cast  := coalesce((p_spells_cast ->> 'wind')::integer, 0);
  end if;
  v_total_cast := v_fire_cast + v_ice_cast + v_earth_cast + v_wind_cast;

  -- Perform stat updates if user_id is provided
  if p_user_id is not null then
    select * into v_current_stats from public.player_stats where user_id = p_user_id;

    if found then
      v_is_win := (v_winner_id = p_user_id);
      v_is_draw := (p_result = 'draw');

      if v_is_win then
        v_outcome := 'win';
        v_actual_score := 1.0;
        v_duration_bonus := least(20, (coalesce(p_duration, 0) / 60) * 2);
        v_score_awarded := 100 + v_duration_bonus;
      elsif v_is_draw then
        v_outcome := 'draw';
        v_actual_score := 0.5;
        v_duration_bonus := least(20, (coalesce(p_duration, 0) / 60) * 2);
        v_score_awarded := 30 + v_duration_bonus;
      else
        v_outcome := 'loss';
        v_actual_score := 0.0;
        v_duration_bonus := least(20, (coalesce(p_duration, 0) / 60) * 2);
        v_score_awarded := 10 + v_duration_bonus;
      end if;

      -- Elo Calculation (K=32, opponent=1200)
      v_expected_score := 1.0 / (1.0 + pow(10.0, (1200.0 - v_current_stats.rating::double precision) / 400.0));
      v_rating_change := round(32.0 * (v_actual_score - v_expected_score));
      v_new_rating := greatest(100, v_current_stats.rating + v_rating_change);
      v_new_score := v_current_stats.score + v_score_awarded;

      -- Streaks
      if v_is_win then
        v_current_streak := v_current_stats.current_streak + 1;
        v_best_streak := greatest(v_current_stats.best_streak, v_current_streak);
      elsif v_is_draw then
        v_current_streak := v_current_stats.current_streak;
        v_best_streak := v_current_stats.best_streak;
      else
        v_current_streak := 0;
        v_best_streak := v_current_stats.best_streak;
      end if;

      -- Update Player Stats atomically
      update public.player_stats
      set
        matches_played = matches_played + 1,
        wins = wins + (case when v_is_win then 1 else 0 end),
        losses = losses + (case when not v_is_win and not v_is_draw then 1 else 0 end),
        draws = draws + (case when v_is_draw then 1 else 0 end),
        score = v_new_score,
        rating = v_new_rating,
        current_streak = v_current_streak,
        best_streak = v_best_streak,
        fire_spells_used = fire_spells_used + v_fire_cast,
        ice_spells_used = ice_spells_used + v_ice_cast,
        earth_spells_used = earth_spells_used + v_earth_cast,
        wind_spells_used = wind_spells_used + v_wind_cast,
        total_spells_used = total_spells_used + v_total_cast,
        updated_at = now()
      where user_id = p_user_id;
    end if;
  end if;

  -- Insert Match Record
  insert into public.matches (
    white_player_id,
    black_player_id,
    winner_id,
    result,
    game_mode,
    moves,
    duration,
    rating_change,
    score_change,
    spells_used,
    started_at,
    ended_at
  ) values (
    p_white_player_id,
    p_black_player_id,
    v_winner_id,
    p_result,
    p_game_mode,
    p_moves,
    p_duration,
    v_rating_change,
    v_score_awarded,
    jsonb_build_object(
      'fire', v_fire_cast,
      'ice', v_ice_cast,
      'earth', v_earth_cast,
      'wind', v_wind_cast,
      'total', v_total_cast
    ),
    p_started_at,
    p_ended_at
  ) returning id into v_match_id;

  return jsonb_build_object(
    'match_id', v_match_id,
    'rating_change', v_rating_change,
    'score_awarded', v_score_awarded
  );
end;
$$;
