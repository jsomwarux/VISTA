import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Rating, TasteStats, TasteMatchResult } from '../types';
import { getMovieDetails, getGenreName } from '../lib/tmdb';

export function useRatings() {
  const [loading, setLoading] = useState(false);

  const createRating = async (
    userId: string,
    movieId: number,
    score: number,
    review: string | null,
    movieTitle: string,
    moviePoster: string | null,
    movieYear: string
  ) => {
    try {
      setLoading(true);

      // Check if rating already exists
      const { data: existing } = await supabase
        .from('ratings')
        .select('id')
        .eq('user_id', userId)
        .eq('movie_id', movieId)
        .single();

      if (existing) {
        // Update existing rating
        const { error } = await supabase
          .from('ratings')
          .update({
            score,
            review,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new rating
        const { error } = await supabase
          .from('ratings')
          .insert({
            user_id: userId,
            movie_id: movieId,
            score,
            review,
            movie_title: movieTitle,
            movie_poster: moviePoster,
            movie_year: movieYear,
          });

        if (error) throw error;
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const getUserRatings = async (userId: string, sortBy: string = 'created_at', sortOrder: 'asc' | 'desc' = 'desc') => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ratings')
        .select(`
          *,
          user:users(*)
        `)
        .eq('user_id', userId)
        .order(sortBy, { ascending: sortOrder === 'asc' });

      if (error) throw error;
      return { data: data as Rating[], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const getRatingWithDetails = async (ratingId: string) => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select(`
          *,
          user:users(*),
          likes:likes(count),
          comments:comments(count)
        `)
        .eq('id', ratingId)
        .single();

      if (error) throw error;
      return { data: data as Rating, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const getFeedRatings = async (userId: string, page: number = 1, limit: number = 20) => {
    try {
      setLoading(true);

      // Get users that the current user follows
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      const followingIds = following?.map(f => f.following_id) || [];

      if (followingIds.length === 0) {
        return { data: [], error: null };
      }

      const offset = (page - 1) * limit;

      const { data, error } = await supabase
        .from('ratings')
        .select(`
          *,
          user:users(*)
        `)
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Get likes and comments count for each rating
      const ratingsWithStats = await Promise.all(
        (data || []).map(async (rating) => {
          const [likesResult, commentsResult, hasLikedResult] = await Promise.all([
            supabase.from('likes').select('id', { count: 'exact' }).eq('rating_id', rating.id),
            supabase.from('comments').select('id', { count: 'exact' }).eq('rating_id', rating.id),
            supabase.from('likes').select('id').eq('rating_id', rating.id).eq('user_id', userId).single(),
          ]);

          return {
            ...rating,
            likes_count: likesResult.count || 0,
            comments_count: commentsResult.count || 0,
            has_liked: !!hasLikedResult.data,
          };
        })
      );

      return { data: ratingsWithStats as Rating[], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const getTrendingRatings = async (limit: number = 20) => {
    try {
      setLoading(true);

      // Get ratings from the last 7 days with most likes
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('ratings')
        .select(`
          *,
          user:users(*)
        `)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get likes count for each rating
      const ratingsWithStats = await Promise.all(
        (data || []).map(async (rating) => {
          const { count } = await supabase
            .from('likes')
            .select('id', { count: 'exact' })
            .eq('rating_id', rating.id);

          return {
            ...rating,
            likes_count: count || 0,
          };
        })
      );

      // Sort by likes count
      ratingsWithStats.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));

      return { data: ratingsWithStats as Rating[], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const getMovieRatings = async (movieId: number, limit: number = 20) => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select(`
          *,
          user:users(*)
        `)
        .eq('movie_id', movieId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data: data as Rating[], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const getMovieAverageScore = async (movieId: number) => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('score')
        .eq('movie_id', movieId);

      if (error) throw error;

      if (!data || data.length === 0) {
        return { avgScore: null, count: 0 };
      }

      const sum = data.reduce((acc, r) => acc + r.score, 0);
      return { avgScore: Math.round(sum / data.length), count: data.length };
    } catch (error) {
      return { avgScore: null, count: 0 };
    }
  };

  const deleteRating = async (ratingId: string) => {
    try {
      // First delete associated likes and comments
      await supabase.from('likes').delete().eq('rating_id', ratingId);
      await supabase.from('comments').delete().eq('rating_id', ratingId);

      // Then delete the rating
      const { error } = await supabase
        .from('ratings')
        .delete()
        .eq('id', ratingId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const getUserTasteStats = async (userId: string): Promise<TasteStats> => {
    try {
      // Get all user ratings
      const { data: ratings, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('user_id', userId)
        .order('score', { ascending: false });

      if (error) throw error;

      if (!ratings || ratings.length === 0) {
        return {
          topAllTime: [],
          topRecent: [],
          topGenres: [],
          topActors: [],
          topDirectors: [],
          totalRated: 0,
          avgScore: 0,
        };
      }

      // Top all time (top 5 highest rated)
      const topAllTime = ratings.slice(0, 5);

      // Top recent (last 30 days, top 5)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentRatings = ratings
        .filter(r => new Date(r.created_at) >= thirtyDaysAgo)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      // Calculate average score
      const avgScore = Math.round(ratings.reduce((acc, r) => acc + r.score, 0) / ratings.length);

      // For genres, actors, and directors, we need to fetch movie details
      const genreScores: Record<string, { total: number; count: number }> = {};
      const actorScores: Record<number, { name: string; total: number; count: number; profile_path: string | null }> = {};
      const directorScores: Record<number, { name: string; total: number; count: number; profile_path: string | null }> = {};

      // Fetch details for top-rated movies to calculate taste stats
      const topMovieIds = ratings.slice(0, 50).map(r => r.movie_id);

      for (const rating of ratings.slice(0, 50)) {
        try {
          const movie = await getMovieDetails(rating.movie_id);

          // Process genres
          if (movie.genres) {
            for (const genre of movie.genres) {
              if (!genreScores[genre.name]) {
                genreScores[genre.name] = { total: 0, count: 0 };
              }
              genreScores[genre.name].total += rating.score;
              genreScores[genre.name].count += 1;
            }
          }

          // Process cast (top 5 billed)
          if (movie.credits?.cast) {
            for (const actor of movie.credits.cast.slice(0, 5)) {
              if (!actorScores[actor.id]) {
                actorScores[actor.id] = { name: actor.name, total: 0, count: 0, profile_path: actor.profile_path };
              }
              actorScores[actor.id].total += rating.score;
              actorScores[actor.id].count += 1;
            }
          }

          // Process directors
          if (movie.credits?.crew) {
            const directors = movie.credits.crew.filter(c => c.job === 'Director');
            for (const director of directors) {
              if (!directorScores[director.id]) {
                directorScores[director.id] = { name: director.name, total: 0, count: 0, profile_path: director.profile_path };
              }
              directorScores[director.id].total += rating.score;
              directorScores[director.id].count += 1;
            }
          }
        } catch (e) {
          // Skip if movie details can't be fetched
        }
      }

      // Calculate averages and sort
      const topGenres = Object.entries(genreScores)
        .map(([genre, { total, count }]) => ({
          genre,
          avgScore: Math.round(total / count),
          count,
        }))
        .filter(g => g.count >= 2)
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 5);

      const topActors = Object.entries(actorScores)
        .map(([id, { name, total, count, profile_path }]) => ({
          id: parseInt(id),
          name,
          avgScore: Math.round(total / count),
          count,
          profile_path,
        }))
        .filter(a => a.count >= 2)
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 5);

      const topDirectors = Object.entries(directorScores)
        .map(([id, { name, total, count, profile_path }]) => ({
          id: parseInt(id),
          name,
          avgScore: Math.round(total / count),
          count,
          profile_path,
        }))
        .filter(d => d.count >= 2)
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 5);

      return {
        topAllTime,
        topRecent: recentRatings,
        topGenres,
        topActors,
        topDirectors,
        totalRated: ratings.length,
        avgScore,
      };
    } catch (error) {
      console.error('Error getting taste stats:', error);
      return {
        topAllTime: [],
        topRecent: [],
        topGenres: [],
        topActors: [],
        topDirectors: [],
        totalRated: 0,
        avgScore: 0,
      };
    }
  };

  const getTasteMatch = async (
    currentUserId: string,
    otherUserId: string
  ): Promise<TasteMatchResult> => {
    try {
      // Fetch both users' ratings in parallel
      const [currentUserRatings, otherUserRatings] = await Promise.all([
        supabase
          .from('ratings')
          .select('movie_id, score')
          .eq('user_id', currentUserId),
        supabase
          .from('ratings')
          .select('movie_id, score')
          .eq('user_id', otherUserId),
      ]);

      if (currentUserRatings.error || otherUserRatings.error) {
        return { score: null, overlapCount: 0, status: 'error' };
      }

      // Create maps for O(1) lookup
      const currentUserMap = new Map<number, number>(
        currentUserRatings.data?.map(r => [r.movie_id, r.score]) || []
      );
      const otherUserMap = new Map<number, number>(
        otherUserRatings.data?.map(r => [r.movie_id, r.score]) || []
      );

      // Find overlapping movies
      const overlappingMovieIds = [...currentUserMap.keys()].filter(
        movieId => otherUserMap.has(movieId)
      );

      const overlapCount = overlappingMovieIds.length;

      // Minimum 3 movies for meaningful comparison
      if (overlapCount < 3) {
        return {
          score: null,
          overlapCount,
          status: 'insufficient_overlap',
          message: overlapCount === 0
            ? 'No movies in common yet'
            : `Rate ${3 - overlapCount} more shared film${3 - overlapCount !== 1 ? 's' : ''}`,
        };
      }

      // Calculate Mean Absolute Error
      let totalDifference = 0;
      for (const movieId of overlappingMovieIds) {
        totalDifference += Math.abs(
          currentUserMap.get(movieId)! - otherUserMap.get(movieId)!
        );
      }

      const avgDifference = totalDifference / overlapCount;
      const matchPercentage = Math.round(Math.max(0, 100 - avgDifference * 2));

      return {
        score: matchPercentage,
        overlapCount,
        status: 'calculated',
        avgDifference: Math.round(avgDifference),
      };
    } catch (error) {
      console.error('Error calculating taste match:', error);
      return { score: null, overlapCount: 0, status: 'error' };
    }
  };

  return {
    loading,
    createRating,
    deleteRating,
    getUserRatings,
    getRatingWithDetails,
    getFeedRatings,
    getTrendingRatings,
    getMovieRatings,
    getMovieAverageScore,
    getUserTasteStats,
    getTasteMatch,
  };
}
