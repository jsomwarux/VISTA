import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Comment, Follow, Report, BlockedUser } from '../types';
import { filterContent } from '../lib/contentFilter';

// Fire-and-forget notification creation (non-blocking)
const createNotification = (
  userId: string,
  actorId: string,
  type: 'like' | 'comment' | 'follow',
  ratingId?: string,
  commentId?: string,
) => {
  if (userId === actorId) return; // Don't notify yourself
  supabase
    .from('notifications')
    .insert({
      user_id: userId,
      actor_id: actorId,
      type,
      rating_id: ratingId || null,
      comment_id: commentId || null,
    })
    .then(({ error }) => {
      if (error) console.warn('Failed to create notification:', error.message);
    });
};

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

      // Notify the followed user
      createNotification(followingId, followerId, 'follow');

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

      // Look up rating owner and notify them
      supabase
        .from('ratings')
        .select('user_id')
        .eq('id', ratingId)
        .single()
        .then(({ data }) => {
          if (data) createNotification(data.user_id, userId, 'like', ratingId);
        });

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
      const filterResult = filterContent(content);
      if (!filterResult.isClean) {
        return { data: null, error: new Error(filterResult.reason) };
      }

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

      // Look up rating owner and notify them
      if (data) {
        supabase
          .from('ratings')
          .select('user_id')
          .eq('id', ratingId)
          .single()
          .then(({ data: ratingData }) => {
            if (ratingData) {
              createNotification(ratingData.user_id, userId, 'comment', ratingId, data.id);
            }
          });
      }

      return { data: data as Comment, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const getComments = async (ratingId: string, currentUserId?: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          user:users(*),
          comment_likes(count)
        `)
        .eq('rating_id', ratingId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Enrich with likes_count and has_liked
      let comments = (data || []).map((c: any) => ({
        ...c,
        likes_count: c.comment_likes?.[0]?.count ?? 0,
        comment_likes: undefined, // strip raw join
      })) as Comment[];

      // If we have a current user, check which comments they've liked
      if (currentUserId && comments.length > 0) {
        const commentIds = comments.map(c => c.id);
        const { data: likedData } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', currentUserId)
          .in('comment_id', commentIds);

        const likedSet = new Set(likedData?.map(l => l.comment_id) || []);
        comments = comments.map(c => ({
          ...c,
          has_liked: likedSet.has(c.id),
        }));
      }

      // Sort: most liked first, then by created_at for ties
      comments.sort((a, b) => {
        const likeDiff = (b.likes_count || 0) - (a.likes_count || 0);
        if (likeDiff !== 0) return likeDiff;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      return { data: comments, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const likeComment = async (commentId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: commentId,
          user_id: userId,
        });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const unlikeComment = async (commentId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
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

  const blockUser = async (blockerId: string, blockedId: string) => {
    try {
      // Insert block record
      const { error: blockError } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: blockerId,
          blocked_id: blockedId,
        });

      if (blockError) throw blockError;

      // Unfollow in both directions
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', blockerId)
        .eq('following_id', blockedId);

      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', blockedId)
        .eq('following_id', blockerId);

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const unblockUser = async (blockerId: string, blockedId: string) => {
    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const isBlocked = async (blockerId: string, blockedId: string) => {
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId)
        .maybeSingle();

      if (error) throw error;
      return { isBlocked: !!data, error: null };
    } catch (error) {
      return { isBlocked: false, error: error as Error };
    }
  };

  const getBlockedUsers = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', userId);

      if (error) throw error;
      return { data: data?.map(d => d.blocked_id) || [], error: null };
    } catch (error) {
      return { data: [], error: error as Error };
    }
  };

  const reportContent = async (
    reporterId: string,
    reason: string,
    options: {
      userId?: string;
      ratingId?: string;
      commentId?: string;
    }
  ) => {
    try {
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: reporterId,
          reported_user_id: options.userId || null,
          reported_rating_id: options.ratingId || null,
          reported_comment_id: options.commentId || null,
          reason,
        });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
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
    likeComment,
    unlikeComment,
    deleteComment,
    searchUsers,
    getUserById,
    blockUser,
    unblockUser,
    isBlocked,
    getBlockedUsers,
    reportContent,
  };
}
