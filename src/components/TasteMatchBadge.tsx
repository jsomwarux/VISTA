import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, getScoreColor } from '../constants/theme';
import { TasteMatchResult } from '../types';

interface TasteMatchBadgeProps {
  result: TasteMatchResult;
  onPress?: () => void;
}

export function TasteMatchBadge({ result, onPress }: TasteMatchBadgeProps) {
  const { score, overlapCount, status, message } = result;

  // Loading state
  if (status === 'loading') {
    return (
      <View style={styles.container}>
        <View style={[styles.badge, styles.loadingBadge]}>
          <Ionicons name="sync" size={14} color={colors.textMuted} />
        </View>
      </View>
    );
  }

  // Insufficient overlap or error state
  if (status === 'insufficient_overlap' || status === 'error' || score === null) {
    return (
      <Pressable style={styles.container} onPress={onPress} disabled={!onPress}>
        <View style={[styles.badge, styles.pendingBadge]}>
          <Ionicons name="heart-half-outline" size={14} color={colors.textMuted} />
          <Text style={styles.pendingText}>?</Text>
        </View>
        <Text style={styles.labelMuted}>{message || 'Rate more films'}</Text>
      </Pressable>
    );
  }

  // Calculated score state
  const scoreColor = getScoreColor(score);

  return (
    <Pressable style={styles.container} onPress={onPress} disabled={!onPress}>
      <View style={[styles.badge, { borderColor: scoreColor, backgroundColor: `${scoreColor}20` }]}>
        <Ionicons name="heart" size={12} color={scoreColor} />
        <Text style={[styles.scoreText, { color: scoreColor }]}>{score}%</Text>
      </View>
      <Text style={styles.label}>Taste Match</Text>
      <Text style={styles.overlap}>{overlapCount} films</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    gap: 4,
    ...shadows.sm,
  },
  pendingBadge: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  loadingBadge: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    width: 48,
    height: 28,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pendingText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 3,
  },
  labelMuted: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 3,
    textAlign: 'center',
    maxWidth: 80,
  },
  overlap: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 1,
  },
});
