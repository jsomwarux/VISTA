import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, getScoreColor, shadows, getGlowStyle } from '../constants/theme';

interface ScoreBadgeProps {
  score: number;
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'hero';
  style?: ViewStyle;
  showGlow?: boolean;
}

export function ScoreBadge({ score, size = 'medium', style, showGlow = false }: ScoreBadgeProps) {
  const scoreColor = getScoreColor(score);

  const sizeStyles = {
    tiny: { width: 24, height: 24, fontSize: 10, borderWidth: 1.5 },
    small: { width: 32, height: 32, fontSize: 12, borderWidth: 2 },
    medium: { width: 44, height: 44, fontSize: 16, borderWidth: 2 },
    large: { width: 64, height: 64, fontSize: 24, borderWidth: 2.5 },
    hero: { width: 80, height: 80, fontSize: 32, borderWidth: 3 },
  };

  const { width, height, fontSize, borderWidth } = sizeStyles[size];

  return (
    <View
      style={[
        styles.container,
        shadows.sm,
        showGlow && getGlowStyle(scoreColor),
        {
          width,
          height,
          borderColor: scoreColor,
          borderWidth,
          backgroundColor: `${scoreColor}20`,
        },
        style,
      ]}
    >
      <Text style={[styles.score, { fontSize, color: scoreColor }]}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  score: {
    fontWeight: '800',
  },
});
