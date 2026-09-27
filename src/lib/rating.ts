/**
 * Rating & Score Utility for Element Chess.
 *
 * Implements standard Elo rating calculations, score award algorithms,
 * and streak management. Keep all rating math inside this utility.
 */

export const INITIAL_RATING = 1200;
export const DEFAULT_K_FACTOR = 32;

export type MatchOutcome = 'win' | 'loss' | 'draw';

/**
 * Calculates expected score for player A against opponent rating B.
 */
export function calculateExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculates new Elo rating and rating change after a match.
 *
 * @param currentRating Player's rating before match
 * @param opponentRating Opponent's rating (defaults to 1200)
 * @param outcome 'win' | 'loss' | 'draw'
 * @param kFactor Sensitivity constant (default 32)
 */
export function calculateEloChange(
  currentRating: number,
  opponentRating: number = INITIAL_RATING,
  outcome: MatchOutcome,
  kFactor: number = DEFAULT_K_FACTOR
): { newRating: number; ratingChange: number } {
  const actualScore = outcome === 'win' ? 1.0 : outcome === 'draw' ? 0.5 : 0.0;
  const expectedScore = calculateExpectedScore(currentRating, opponentRating);

  const ratingChange = Math.round(kFactor * (actualScore - expectedScore));
  const newRating = Math.max(100, currentRating + ratingChange);

  return { newRating, ratingChange };
}

/**
 * Calculates score points awarded for a match.
 */
export function calculateScoreAwarded(
  outcome: MatchOutcome,
  durationSeconds: number = 0
): number {
  let baseScore = 0;
  if (outcome === 'win') {
    baseScore = 100;
  } else if (outcome === 'draw') {
    baseScore = 30;
  } else {
    baseScore = 10;
  }

  // Tactical duration bonus (up to +20 points)
  const durationBonus = Math.min(20, Math.floor(durationSeconds / 60) * 2);

  return baseScore + durationBonus;
}

/**
 * Calculates updated current and best streak values.
 */
export function calculateNewStreaks(
  currentStreak: number,
  bestStreak: number,
  outcome: MatchOutcome
): { currentStreak: number; bestStreak: number } {
  if (outcome === 'win') {
    const newCurrent = currentStreak + 1;
    return {
      currentStreak: newCurrent,
      bestStreak: Math.max(bestStreak, newCurrent),
    };
  } else if (outcome === 'loss') {
    return {
      currentStreak: 0,
      bestStreak,
    };
  } else {
    // Draw maintains streak
    return {
      currentStreak,
      bestStreak,
    };
  }
}
