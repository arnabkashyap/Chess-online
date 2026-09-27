/**
 * Supabase Database types for Element Chess.
 *
 * This file is the single source of truth for the database schema shape.
 * When you add tables to Supabase, update the types here.
 *
 * You can also auto-generate this file by running:
 *   npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      /**
       * profiles — one row per authenticated user.
       * Created automatically after sign-up via a Supabase database trigger.
       */
      profiles: {
        Row: {
          id: string;                 // UUID — matches auth.users.id
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          is_guest: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          is_guest?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          is_guest?: boolean;
          updated_at?: string;
        };
      };

      /**
       * player_stats — aggregated stats per user.
       * A row is created automatically alongside the profile via database trigger.
       */
      player_stats: {
        Row: {
          user_id: string;            // UUID — FK → profiles.id
          matches_played: number;
          wins: number;
          losses: number;
          draws: number;
          score: number;
          rating: number;
          current_streak: number;
          best_streak: number;
          fire_spells_used: number;
          ice_spells_used: number;
          earth_spells_used: number;
          wind_spells_used: number;
          total_spells_used: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          matches_played?: number;
          wins?: number;
          losses?: number;
          draws?: number;
          score?: number;
          rating?: number;
          current_streak?: number;
          best_streak?: number;
          fire_spells_used?: number;
          ice_spells_used?: number;
          earth_spells_used?: number;
          wind_spells_used?: number;
          total_spells_used?: number;
          updated_at?: string;
        };
        Update: {
          matches_played?: number;
          wins?: number;
          losses?: number;
          draws?: number;
          score?: number;
          rating?: number;
          current_streak?: number;
          best_streak?: number;
          fire_spells_used?: number;
          ice_spells_used?: number;
          earth_spells_used?: number;
          wind_spells_used?: number;
          total_spells_used?: number;
          updated_at?: string;
        };
      };

      /**
       * matches — one row per completed or in-progress match.
       */
      matches: {
        Row: {
          id: string;                 // UUID
          white_player_id: string | null;  // FK → profiles.id (null = guest/bot)
          black_player_id: string | null;  // FK → profiles.id (null = guest/bot)
          winner_id: string | null;        // FK → profiles.id (null if draw/ongoing)
          result: 'white' | 'black' | 'draw' | null;
          game_mode: 'local' | 'bot' | 'multiplayer';
          moves: Json | null;              // JSON array of move objects
          duration: number | null;         // Duration in seconds
          rating_change: number | null;
          score_change: number | null;
          spells_used: Json | null;
          started_at: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          white_player_id?: string | null;
          black_player_id?: string | null;
          winner_id?: string | null;
          result?: 'white' | 'black' | 'draw' | null;
          game_mode: 'local' | 'bot' | 'multiplayer';
          moves?: Json | null;
          duration?: number | null;
          rating_change?: number | null;
          score_change?: number | null;
          spells_used?: Json | null;
          started_at?: string;
          ended_at?: string | null;
        };
        Update: {
          white_player_id?: string | null;
          black_player_id?: string | null;
          winner_id?: string | null;
          result?: 'white' | 'black' | 'draw' | null;
          game_mode?: 'local' | 'bot' | 'multiplayer';
          moves?: Json | null;
          duration?: number | null;
          rating_change?: number | null;
          score_change?: number | null;
          spells_used?: Json | null;
          ended_at?: string | null;
        };
      };
    };

    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// ─── Convenience Row Types ─────────────────────────────────────────────────────

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type PlayerStats = Database['public']['Tables']['player_stats']['Row'];
export type PlayerStatsInsert = Database['public']['Tables']['player_stats']['Insert'];
export type PlayerStatsUpdate = Database['public']['Tables']['player_stats']['Update'];

export type Match = Database['public']['Tables']['matches']['Row'];
export type MatchInsert = Database['public']['Tables']['matches']['Insert'];
export type MatchUpdate = Database['public']['Tables']['matches']['Update'];
