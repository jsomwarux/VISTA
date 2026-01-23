import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, getScoreColor, getGenreColor } from '../constants/theme';

interface GenrePillProps {
  genre: string;
  score?: number;
  count?: number;
  onPress?: () => void;
  style?: ViewStyle;
  showScore?: boolean;
}

export function GenrePill({ genre, score, count, onPress, style, showScore = true }: GenrePillProps) {
  const genreColor = getGenreColor(genre);
  const scoreColor = score ? getScoreColor(score) : colors.textMuted;

  const content = (
    <View style={[styles.container, { borderColor: genreColor + '40' }, style]}>
      <View style={[styles.dot, { backgroundColor: genreColor }]} />
      <Text style={styles.genre}>{genre}</Text>
      {showScore && score !== undefined && (
        <Text style={[styles.score, { color: scoreColor }]}>{score}</Text>
      )}
      {count !== undefined && (
        <Text style={styles.count}>({count})</Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  genre: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  score: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
  count: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
});
