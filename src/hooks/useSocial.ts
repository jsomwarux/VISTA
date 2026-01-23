import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Comment, Follow } from '../types';

export function useSocial() {
  const [loading, setLoading] = useState(false);

  const followUser = async (followerId: string, followingId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: followerId,
          following_id: followingId,
        });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const unfollowUser = async (followerId: string, followingId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const isFollowing = async (followerId: string, followingId: string) => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return { isFollowing: !!data, error: null };
    } catch (error) {
      return { isFollowing: false, error: error as Error };
    }
  };

  const getFollowers = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          follower:users!follows_follower_id_fkey(*)
        `)
        .eq('following_id', userId);

      if (error) throw error;
      return { data: (data?.map(d => d.follower) as unknown) as User[], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const getFollowing = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          following:users!follows_following_id_fkey(*)
        `)
        .eq('follower_id', userId);

      if (error) throw error;
      return { data: (data?.map(d => d.following) as unknown) as User[], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const getFollowCounts = async (userId: string) => {
    try {
      const [followersResult, followingResult] = await Promise.all([
        supabase.from('follows').select('id', { count: 'exact' }).eq('following_id', userId),
        supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', userId),
      ]);

      return {
        followers: followersResult.count || 0,
        following: followingResult.count || 0,
      };
    } catch (error) {
      return { followers: 0, following: 0 };
    }
  };

  const likeRating = async (ratingId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('likes')
        .insert({
          rating_id: ratingId,
          user_id: userId,
        });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const unlikeRating = async (ratingId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('rating_id', ratingId)
        .eq('user_id', userId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const addComment = async (ratingId: string, userId: string, content: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          rating_id: ratingId,
          user_id: userId,
          content,
        })
        .select(`
          *,
          user:users(*)
        `)
        .single();

      if (error) throw error;
      return { data: data as Comment, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const getComments = async (ratingId: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:users(*)
        `)
        .eq('rating_id', ratingId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { data: data as Comment[], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const searchUsers = async (query: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      return { data: data as User[], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const getUserById = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { data: data as User, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  return {
    loading,
    followUser,
    unfollowUser,
    isFollowing,
    getFollowers,
    getFollowing,
    getFollowCounts,
    likeRating,
    unlikeRating,
    addComment,
    getComments,
    deleteComment,
    searchUsers,
    getUserById,
  };
}
