import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface WatchlistItem {
  id: string;
  user_id: string;
  movie_id: number;
  movie_title: string;
  movie_poster: string | null;
  created_at: string;
}

export function useWatchlist() {
  const [loading, setLoading] = useState(false);

  const addToWatchlist = async (
    userId: string,
    movieId: number,
    movieTitle: string,
    moviePoster: string | null
  ) => {
    try {
      setLoading(true);

      // Check if already in watchlist
      const { data: existing } = await supabase
        .from('watchlist')
        .select('id')
        .eq('user_id', userId)
        .eq('movie_id', movieId)
        .maybeSingle();

      if (existing) {
        // Already in watchlist
        return { data: existing, error: null, alreadyExists: true };
      }

      const { data, error } = await supabase
        .from('watchlist')
        .insert({
          user_id: userId,
          movie_id: movieId,
          movie_title: movieTitle,
          movie_poster: moviePoster,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null, alreadyExists: false };
    } catch (error) {
      return { data: null, error: error as Error, alreadyExists: false };
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (userId: string, movieId: number) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('user_id', userId)
        .eq('movie_id', movieId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const isOnWatchlist = async (userId: string, movieId: number): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from('watchlist')
        .select('id')
        .eq('user_id', userId)
        .eq('movie_id', movieId)
        .maybeSingle();

      return !!data;
    } catch {
      return false;
    }
  };

  const getUserWatchlist = async (userId: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data as WatchlistItem[], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    addToWatchlist,
    removeFromWatchlist,
    isOnWatchlist,
    getUserWatchlist,
  };
}
