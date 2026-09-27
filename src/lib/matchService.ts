import { createClient } from '@/lib/supabase/client';
import type { MatchInsert, PlayerStats } from '@/types/database';
import {
  calculateEloChange,
  calculateScoreAwarded,
  calculateNewStreaks,
  MatchOutcome,
} from '@/lib/rating';

export interface SaveMatchParams {
  userId: string | null;
  gameMode: 'local' | 'bot' | 'multiplayer';
  result: 'white' | 'black' | 'draw';
  whitePlayerId: string | null;
  blackPlayerId: string | null;
  moves: any[];
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  spellsCast?: {
    fire: number;
    ice: number;
    earth: number;
    wind: number;
  };
}

/**
 * Saves a completed chess match to the Supabase `matches` table
 * and updates `player_stats` for the active player.
 */
export async function saveCompletedMatch(params: SaveMatchParams) {
  const supabase = createClient();

  const fireCast = params.spellsCast?.fire || 0;
  const iceCast = params.spellsCast?.ice || 0;
  const earthCast = params.spellsCast?.earth || 0;
  const windCast = params.spellsCast?.wind || 0;

  // 1. Try atomic SECURITY DEFINER RPC function first for maximum database security
  try {
    const { data: rpcData, error: rpcError } = await (supabase.rpc as any)(
      'record_completed_match_rpc',
      {
        p_user_id: params.userId,
        p_game_mode: params.gameMode,
        p_result: params.result,
        p_white_player_id: params.whitePlayerId,
        p_black_player_id: params.blackPlayerId,
        p_moves: params.moves,
        p_started_at: params.startedAt,
        p_ended_at: params.endedAt,
        p_duration: params.durationSeconds,
        p_spells_cast: {
          fire: fireCast,
          ice: iceCast,
          earth: earthCast,
          wind: windCast,
        },
      }
    );

    if (!rpcError && rpcData) {
      console.log('[MatchService] Match and stats recorded securely via RPC:', rpcData);
      return rpcData;
    }
    if (rpcError) {
      console.warn('[MatchService] RPC fallback mode enabled:', rpcError.message);
    }
  } catch (rpcErr) {
    console.warn('[MatchService] RPC execution error, falling back to direct queries:', rpcErr);
  }

  // 2. Direct Query Fallback (for environments prior to Migration 003)
  const winnerId =
    params.result === 'white'
      ? params.whitePlayerId
      : params.result === 'black'
      ? params.blackPlayerId
      : null;

  let calculatedRatingChange = 0;
  let calculatedScoreAwarded = 0;

  let currentStats: PlayerStats | null = null;
  if (params.userId) {
    try {
      const { data } = await (supabase.from('player_stats') as any)
        .select('*')
        .eq('user_id', params.userId)
        .maybeSingle();
      if (data) {
        currentStats = data as unknown as PlayerStats;
      }
    } catch (err) {
      console.error('[MatchService] Error fetching current stats:', err);
    }
  }

  const isWin = params.userId ? winnerId === params.userId : false;
  const isDraw = params.result === 'draw';
  const outcome: MatchOutcome = isWin ? 'win' : isDraw ? 'draw' : 'loss';

  if (currentStats) {
    const { ratingChange } = calculateEloChange(
      currentStats.rating,
      1200,
      outcome
    );
    calculatedRatingChange = ratingChange;
    calculatedScoreAwarded = calculateScoreAwarded(outcome, params.durationSeconds);
  } else {
    calculatedScoreAwarded = calculateScoreAwarded(outcome, params.durationSeconds);
    calculatedRatingChange = outcome === 'win' ? 15 : outcome === 'draw' ? 2 : -10;
  }

  const totalCast = fireCast + iceCast + earthCast + windCast;

  const matchData: MatchInsert = {
    white_player_id: params.whitePlayerId,
    black_player_id: params.blackPlayerId,
    winner_id: winnerId,
    result: params.result,
    game_mode: params.gameMode,
    moves: params.moves,
    duration: params.durationSeconds,
    rating_change: calculatedRatingChange,
    score_change: calculatedScoreAwarded,
    spells_used: {
      fire: fireCast,
      ice: iceCast,
      earth: earthCast,
      wind: windCast,
      total: totalCast,
    },
    started_at: params.startedAt,
    ended_at: params.endedAt,
  };

  const { data: match, error: matchError } = await (supabase.from('matches') as any)
    .insert(matchData)
    .select()
    .maybeSingle();

  if (matchError) {
    console.error('[MatchService] Failed to save match record:', matchError.message);
  } else {
    console.log('[MatchService] Successfully recorded match via direct query:', match);
  }

  if (params.userId && currentStats) {
    try {
      const stats = currentStats;

      const newWins = stats.wins + (isWin ? 1 : 0);
      const newLosses = stats.losses + (!isWin && !isDraw ? 1 : 0);
      const newDraws = stats.draws + (isDraw ? 1 : 0);
      const newMatchesPlayed = stats.matches_played + 1;

      const { currentStreak, bestStreak } = calculateNewStreaks(
        stats.current_streak,
        stats.best_streak,
        outcome
      );

      const newRating = Math.max(100, stats.rating + calculatedRatingChange);
      const newScore = stats.score + calculatedScoreAwarded;

      const newFire = (stats.fire_spells_used || 0) + fireCast;
      const newIce = (stats.ice_spells_used || 0) + iceCast;
      const newEarth = (stats.earth_spells_used || 0) + earthCast;
      const newWind = (stats.wind_spells_used || 0) + windCast;
      const newTotalSpells = (stats.total_spells_used || 0) + totalCast;

      await (supabase.from('player_stats') as any)
        .update({
          matches_played: newMatchesPlayed,
          wins: newWins,
          losses: newLosses,
          draws: newDraws,
          score: newScore,
          rating: newRating,
          current_streak: currentStreak,
          best_streak: bestStreak,
          fire_spells_used: newFire,
          ice_spells_used: newIce,
          earth_spells_used: newEarth,
          wind_spells_used: newWind,
          total_spells_used: newTotalSpells,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', params.userId);
    } catch (err) {
      console.error('[MatchService] Failed to update player stats:', err);
    }
  }

  return match;
}
