import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../src/constants/theme';
import { useAuth } from '../src/hooks/useAuth';
import { useNotifications } from '../src/hooks/useNotifications';
import { Avatar, LoadingSpinner, MoviePoster, ScoreBadge, CustomBackButton } from '../src/components';
import { AppNotification } from '../src/types';

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getNotificationText(notification: AppNotification): string {
  switch (notification.type) {
    case 'like':
      return `liked your rating of ${notification.rating?.movie_title || 'a movie'}`;
    case 'comment':
      return `commented on your rating of ${notification.rating?.movie_title || 'a movie'}`;
    case 'follow':
      return 'started following you';
    default:
      return 'interacted with your content';
  }
}

function getNotificationIcon(type: string): { name: string; color: string } {
  switch (type) {
    case 'like':
      return { name: 'heart', color: colors.coral };
    case 'comment':
      return { name: 'chatbubble', color: colors.primary };
    case 'follow':
      return { name: 'person-add', color: '#8B5CF6' };
    default:
      return { name: 'notifications', color: colors.textMuted };
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { getNotifications, markAsRead, markAllAsRead, loading } = useNotifications();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    const result = await getNotifications(user.id);
    if (result.data) {
      setNotifications(result.data);
    }
    setInitialLoading(false);
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: AppNotification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
    }

    // Navigate to relevant content
    switch (notification.type) {
      case 'like':
      case 'comment':
        if (notification.rating_id) {
          router.push(`/rating/${notification.rating_id}`);
        }
        break;
      case 'follow':
        router.push(`/user/${notification.actor_id}`);
        break;
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllAsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const hasUnread = notifications.some(n => !n.read);

  const renderNotification = ({ item }: { item: AppNotification }) => {
    const icon = getNotificationIcon(item.type);

    return (
      <Pressable
        style={({ pressed }) => [
          styles.notificationItem,
          !item.read && styles.notificationUnread,
          pressed && styles.notificationPressed,
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        {/* Unread indicator */}
        {!item.read && <View style={styles.unreadDot} />}

        {/* Actor avatar with type icon overlay */}
        <View style={styles.avatarContainer}>
          <Avatar
            uri={item.actor?.avatar_url ?? null}
            name={item.actor?.display_name}
            size="medium"
          />
          <View style={[styles.typeIconBadge, { backgroundColor: icon.color }]}>
            <Ionicons name={icon.name as any} size={10} color="#fff" />
          </View>
        </View>

        {/* Content */}
        <View style={styles.notificationContent}>
          <Text style={styles.notificationText} numberOfLines={2}>
            <Text style={styles.actorName}>{item.actor?.display_name}</Text>
            {' '}{getNotificationText(item)}
          </Text>
          <Text style={styles.notificationTime}>
            {getTimeAgo(new Date(item.created_at))}
          </Text>
        </View>

        {/* Movie poster thumbnail for like/comment */}
        {item.rating?.movie_poster && (item.type === 'like' || item.type === 'comment') && (
          <View style={styles.posterThumbnail}>
            <MoviePoster posterPath={item.rating.movie_poster} size="tiny" />
          </View>
        )}
      </Pressable>
    );
  };

  if (initialLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            title: 'Notifications',
            headerLeft: () => <CustomBackButton />,
          }}
        />
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          title: 'Notifications',
          headerLeft: () => <CustomBackButton />,
          headerRight: hasUnread
            ? () => (
                <Pressable onPress={handleMarkAllRead} style={styles.markAllButton}>
                  <Text style={styles.markAllText}>Read All</Text>
                </Pressable>
              )
            : undefined,
        }}
      />

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="notifications-outline" size={64} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyMessage}>
            When someone likes your ratings, comments, or follows you, you'll see it here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingVertical: spacing.sm,
  },

  // Notification item
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  notificationUnread: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  notificationPressed: {
    opacity: 0.7,
  },
  unreadDot: {
    position: 'absolute',
    left: spacing.sm,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  // Avatar
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  typeIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },

  // Content
  notificationContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  notificationText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  actorName: {
    fontWeight: '600',
    color: colors.text,
  },
  notificationTime: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },

  // Poster thumbnail
  posterThumbnail: {
    width: 40,
    height: 60,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },

  // Mark all
  markAllButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
