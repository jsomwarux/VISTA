import React, { useState, useCallback, useRef, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { AppNotification, NotificationType } from '../types';

interface NotificationContextType {
  loading: boolean;
  unreadCount: number;
  getNotifications: (userId: string, page?: number, limit?: number) => Promise<{ data: AppNotification[] | null; error: Error | null }>;
  getUnreadCount: (userId: string) => Promise<number>;
  markAsRead: (notificationId: string) => Promise<{ error: Error | null }>;
  markAllAsRead: (userId: string) => Promise<{ error: Error | null }>;
  createNotification: (userId: string, actorId: string, type: NotificationType, ratingId?: string, commentId?: string) => Promise<{ error: Error | null }>;
  subscribeToNotifications: (userId: string, onNew?: () => void) => () => void;
  unsubscribe: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const subscriptionRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const getNotifications = async (userId: string, page: number = 1, limit: number = 30) => {
    try {
      setLoading(true);
      const offset = (page - 1) * limit;

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:users!notifications_actor_id_fkey(*),
          rating:ratings(id, movie_title, movie_poster, movie_year, score)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data: data as AppNotification[], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const getUnreadCount = async (userId: string) => {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      const newCount = count || 0;
      setUnreadCount(newCount);
      return newCount;
    } catch (error) {
      return 0;
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      setUnreadCount(prev => Math.max(0, prev - 1));
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const markAllAsRead = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      setUnreadCount(0);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const createNotification = async (
    userId: string,
    actorId: string,
    type: NotificationType,
    ratingId?: string,
    commentId?: string,
  ) => {
    if (userId === actorId) return { error: null };

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          actor_id: actorId,
          type,
          rating_id: ratingId || null,
          comment_id: commentId || null,
        });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const subscribeToNotifications = useCallback((userId: string, onNew?: () => void) => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          setUnreadCount(prev => prev + 1);
          onNew?.();
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      subscriptionRef.current = null;
    };
  }, []);

  const unsubscribe = useCallback(() => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
  }, []);

  const value = {
    loading,
    unreadCount,
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    createNotification,
    subscribeToNotifications,
    unsubscribe,
  };

  return React.createElement(NotificationContext.Provider, { value }, children);
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
