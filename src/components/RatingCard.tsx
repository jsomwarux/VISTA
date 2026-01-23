import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../constants/theme';
import { Rating } from '../types';
import { MoviePoster } from './MoviePoster';
import { Avatar } from './Avatar';
import { ScoreBadge } from './ScoreBadge';
import { AnimatedPressable } from './AnimatedPressable';
import { AnimatedHeart } from './AnimatedHeart';

interface RatingCardProps {
  rating: Rating;
  showUser?: boolean;
  onPress?: () => void;
  onUserPress?: () => void;
  onMoviePress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
}

export function RatingCard({
  rating,
  showUser = true,
  onPress,
  onUserPress,
  onMoviePress,
  onLike,
  onComment,
}: RatingCardProps) {
  const timeAgo = getTimeAgo(new Date(rating.created_at));

  return (
    <Pressable
      style={({ pressed }) => [styles.container, { opacity: pressed && onPress ? 0.9 : 1 }]}
      onPress={onPress}
    >
      {showUser && rating.user && (
        <Pressable style={styles.userRow} onPress={onUserPress}>
          <Avatar
            uri={rating.user.avatar_url}
            name={rating.user.display_name}
            size="small"
          />
          <View style={styles.userInfo}>
            <Text style={styles.displayName}>{rating.user.display_name}</Text>
            <Text style={styles.timeAgo}>{timeAgo}</Text>
          </View>
        </Pressable>
      )}

      <View style={styles.content}>
        <AnimatedPressable onPress={onMoviePress} scaleAmount={0.95}>
          <View style={styles.posterWrapper}>
            <MoviePoster posterPath={rating.movie_poster || null} size="small" />
          </View>
        </AnimatedPressable>

        <View style={styles.details}>
          <Pressable onPress={onMoviePress}>
            <Text style={styles.movieTitle} numberOfLines={2}>
              {rating.movie_title}
            </Text>
            {rating.movie_year && (
              <Text style={styles.movieYear}>{rating.movie_year}</Text>
            )}
          </Pressable>

          {rating.review && (
            <Text style={styles.review} numberOfLines={3}>
              "{rating.review}"
            </Text>
          )}
        </View>

        <ScoreBadge score={rating.score} size="medium" />
      </View>

      <View style={styles.actions}>
        <View style={styles.actionButton}>
          <AnimatedHeart
            liked={rating.has_liked || false}
            onPress={onLike || (() => {})}
            size={20}
          />
          {(rating.likes_count ?? 0) > 0 && (
            <Text style={[styles.actionCount, rating.has_liked && styles.actionCountActive]}>
              {rating.likes_count}
            </Text>
          )}
        </View>

        <Pressable style={styles.actionButton} onPress={onComment}>
          <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} />
          {(rating.comments_count ?? 0) > 0 && (
            <Text style={styles.actionCount}>{rating.comments_count}</Text>
          )}
        </Pressable>
      </View>
    </Pressable>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  posterWrapper: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  userInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  displayName: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
  timeAgo: {
    fontSize: 13,
    color: colors.textMuted,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  details: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.md,
  },
  movieTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  movieYear: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  review: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
    paddingVertical: spacing.xs,
  },
  actionCount: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  actionCountActive: {
    color: colors.coral,
  },
});
