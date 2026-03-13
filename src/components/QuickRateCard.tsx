import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Image } from 'react-native';
import { colors, spacing, borderRadius, shadows, getScoreColor } from '../constants/theme';
import { getImageUrl } from '../lib/tmdb';
import { ScoreBadge } from './ScoreBadge';
import { Movie } from '../types';

interface QuickRateCardProps {
  movie: Movie;
  score: number;
  onScoreChange: (score: number) => void;
  onRate: () => void;
  onSkip: () => void;
  loading?: boolean;
  seenRecently: boolean;
  onSeenRecentlyChange: (value: boolean) => void;
}

export function QuickRateCard({
  movie,
  score,
  onScoreChange,
  onRate,
  onSkip,
  loading = false,
  seenRecently,
  onSeenRecentlyChange,
}: QuickRateCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [movie.id]);

  const posterUrl = getImageUrl(movie.poster_path, 'w342');
  const year = movie.release_date ? movie.release_date.substring(0, 4) : '';
  const genres = movie.genres?.slice(0, 3).map(g => g.name) || [];
  const scoreColor = getScoreColor(score);

  const quickScores = [25, 50, 75, 90];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Top section: Poster + Info side by side */}
      <View style={styles.topSection}>
        <View style={styles.posterContainer}>
          {posterUrl ? (
            <Image source={{ uri: posterUrl }} style={styles.poster} resizeMode="cover" />
          ) : (
            <View style={[styles.poster, styles.posterPlaceholder]}>
              <Text style={styles.posterPlaceholderText}>No Poster</Text>
            </View>
          )}
        </View>

        <View style={styles.infoColumn}>
          <Text style={styles.title} numberOfLines={2}>{movie.title}</Text>
          <View style={styles.metaRow}>
            {year ? <Text style={styles.year}>{year}</Text> : null}
            {genres.length > 0 && (
              <Text style={styles.genres} numberOfLines={1}>
                {year ? '  •  ' : ''}{genres.join(', ')}
              </Text>
            )}
          </View>

          {/* Seen Recently Toggle */}
          <Pressable
            style={styles.recentToggle}
            onPress={() => onSeenRecentlyChange(!seenRecently)}
          >
            <View style={[styles.toggleDot, seenRecently && styles.toggleDotActive]} />
            <Text style={[styles.recentToggleText, seenRecently && styles.recentToggleTextActive]}>
              Watched recently
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Score Display */}
      <View style={styles.scoreSection}>
        <ScoreBadge score={score} size="large" showGlow />
      </View>

      {/* Score Track Bar */}
      <View style={styles.trackContainer}>
        <View style={styles.track}>
          <View
            style={[
              styles.trackFill,
              { width: `${score}%`, backgroundColor: scoreColor },
            ]}
          />
        </View>
      </View>

      {/* Quick Score Buttons */}
      <View style={styles.quickScoreRow}>
        {quickScores.map((qs) => (
          <Pressable
            key={qs}
            style={[
              styles.quickScoreButton,
              score === qs && { backgroundColor: `${getScoreColor(qs)}30`, borderColor: getScoreColor(qs) },
            ]}
            onPress={() => onScoreChange(qs)}
          >
            <Text
              style={[
                styles.quickScoreText,
                score === qs && { color: getScoreColor(qs) },
              ]}
            >
              {qs}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Fine-tune buttons */}
      <View style={styles.finetuneRow}>
        <Pressable
          style={styles.finetuneButton}
          onPress={() => onScoreChange(Math.max(1, score - 5))}
        >
          <Text style={styles.finetuneText}>-5</Text>
        </Pressable>
        <Pressable
          style={styles.finetuneButton}
          onPress={() => onScoreChange(Math.max(1, score - 1))}
        >
          <Text style={styles.finetuneText}>-1</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          style={styles.finetuneButton}
          onPress={() => onScoreChange(Math.min(100, score + 1))}
        >
          <Text style={styles.finetuneText}>+1</Text>
        </Pressable>
        <Pressable
          style={styles.finetuneButton}
          onPress={() => onScoreChange(Math.min(100, score + 5))}
        >
          <Text style={styles.finetuneText}>+5</Text>
        </Pressable>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <Pressable
          style={[styles.actionButton, styles.skipButton]}
          onPress={onSkip}
          disabled={loading}
        >
          <Text style={styles.skipButtonText}>Haven't Seen</Text>
        </Pressable>
        <Pressable
          style={[
            styles.actionButton,
            styles.rateButton,
            { backgroundColor: scoreColor },
            loading && styles.buttonDisabled,
          ]}
          onPress={onRate}
          disabled={loading}
        >
          <Text style={styles.rateButtonText}>
            {loading ? 'Saving...' : 'Rate'}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  // Top: poster + info side by side
  topSection: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  posterContainer: {
    ...shadows.lg,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: borderRadius.lg,
  },
  posterPlaceholder: {
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterPlaceholderText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  infoColumn: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  year: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  genres: {
    fontSize: 13,
    color: colors.textMuted,
    flexShrink: 1,
  },
  recentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    gap: spacing.xs,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  toggleDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.textMuted,
    backgroundColor: 'transparent',
  },
  toggleDotActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  recentToggleText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },
  recentToggleTextActive: {
    color: colors.primary,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  trackContainer: {
    width: '100%',
    marginBottom: spacing.sm,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceLighter,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 3,
  },
  quickScoreRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  quickScoreButton: {
    width: 52,
    height: 34,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: colors.surfaceLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickScoreText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  finetuneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  finetuneButton: {
    width: 44,
    height: 34,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finetuneText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.surfaceLighter,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  rateButton: {
    ...shadows.md,
  },
  rateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
