import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, spacing, borderRadius } from '../constants/theme';
import { Movie } from '../types';
import { MoviePoster } from './MoviePoster';
import { ScoreBadge } from './ScoreBadge';

interface MovieCardProps {
  movie: Movie;
  userScore?: number | null;
  vistaScore?: number | null;
  onPress?: () => void;
  compact?: boolean;
}

export function MovieCard({ movie, userScore, vistaScore, onPress, compact = false }: MovieCardProps) {
  const year = movie.release_date ? movie.release_date.split('-')[0] : '';

  if (compact) {
    return (
      <Pressable
        style={({ pressed }) => [styles.compactContainer, { opacity: pressed ? 0.8 : 1 }]}
        onPress={onPress}
      >
        <MoviePoster posterPath={movie.poster_path} size="small" />
        <Text style={styles.compactTitle} numberOfLines={2}>
          {movie.title}
        </Text>
        {userScore && <ScoreBadge score={userScore} size="small" style={styles.compactScore} />}
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.container, { opacity: pressed ? 0.9 : 1 }]}
      onPress={onPress}
    >
      <MoviePoster posterPath={movie.poster_path} size="medium" />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {movie.title}
        </Text>
        {year && <Text style={styles.year}>{year}</Text>}
        {movie.overview && (
          <Text style={styles.overview} numberOfLines={2}>
            {movie.overview}
          </Text>
        )}
        <View style={styles.scores}>
          {vistaScore && (
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>VISTA</Text>
              <ScoreBadge score={vistaScore} size="small" />
            </View>
          )}
          {userScore && (
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>YOU</Text>
              <ScoreBadge score={userScore} size="small" />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  year: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  overview: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  scores: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  scoreItem: {
    marginRight: spacing.md,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  compactContainer: {
    width: 80,
    marginRight: spacing.md,
  },
  compactTitle: {
    fontSize: 13,
    color: colors.text,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  compactScore: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
});
