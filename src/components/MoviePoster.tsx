import React from 'react';
import { View, Image, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { colors, borderRadius } from '../constants/theme';
import { getImageUrl } from '../lib/tmdb';

interface MoviePosterProps {
  posterPath: string | null;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  style?: ViewStyle;
}

export function MoviePoster({ posterPath, size = 'medium', onPress, style }: MoviePosterProps) {
  const sizeStyles = {
    small: { width: 60, height: 90 },
    medium: { width: 100, height: 150 },
    large: { width: 140, height: 210 },
  };

  const imageSize = size === 'small' ? 'w154' : size === 'medium' ? 'w342' : 'w500';
  const imageUrl = getImageUrl(posterPath, imageSize);

  const { width, height } = sizeStyles[size];

  const content = (
    <View style={[styles.container, { width, height }, style]}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder}>
          <View style={styles.placeholderIcon} />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceLight,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceLight,
  },
  placeholderIcon: {
    width: 24,
    height: 32,
    backgroundColor: colors.surfaceLighter,
    borderRadius: 4,
  },
});
