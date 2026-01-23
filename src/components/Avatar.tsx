import React from 'react';
import { View, Image, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, shadows, getGlowStyle } from '../constants/theme';

interface AvatarProps {
  uri: string | null;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'profile' | 'xlarge' | 'hero';
  onPress?: () => void;
  style?: ViewStyle;
  showRing?: boolean;
  ringColor?: string;
}

export function Avatar({
  uri,
  name,
  size = 'medium',
  onPress,
  style,
  showRing = false,
  ringColor,
}: AvatarProps) {
  const sizeStyles = {
    small: { width: 32, height: 32, fontSize: 12, ringWidth: 2 },
    medium: { width: 44, height: 44, fontSize: 16, ringWidth: 2 },
    large: { width: 64, height: 64, fontSize: 22, ringWidth: 3 },
    profile: { width: 80, height: 80, fontSize: 28, ringWidth: 3 },
    xlarge: { width: 100, height: 100, fontSize: 36, ringWidth: 3 },
    hero: { width: 110, height: 110, fontSize: 40, ringWidth: 4 },
  };

  const { width, height, fontSize, ringWidth } = sizeStyles[size];
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';

  const avatarContent = (
    <View style={[styles.innerContainer, { width: width - (showRing ? ringWidth * 2 + 4 : 0), height: height - (showRing ? ringWidth * 2 + 4 : 0) }]}>
      {uri ? (
        <Image source={{ uri }} style={styles.image} />
      ) : (
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.placeholder}
        >
          <Text style={[styles.initials, { fontSize: fontSize - (showRing ? 4 : 0) }]}>{initials}</Text>
        </LinearGradient>
      )}
    </View>
  );

  const content = showRing ? (
    <View style={[
      styles.ringContainer,
      { width, height },
      shadows.md,
      getGlowStyle(ringColor || colors.primary),
      style
    ]}>
      <LinearGradient
        colors={ringColor ? [ringColor, ringColor] : [colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.ring, { padding: ringWidth }]}
      >
        <View style={styles.ringInner}>
          {avatarContent}
        </View>
      </LinearGradient>
    </View>
  ) : (
    <View style={[styles.container, { width, height }, shadows.sm, style]}>
      {avatarContent}
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
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  ringContainer: {
    borderRadius: borderRadius.full,
  },
  ring: {
    borderRadius: borderRadius.full,
    width: '100%',
    height: '100%',
  },
  ringInner: {
    flex: 1,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    padding: 2,
    overflow: 'hidden',
  },
  innerContainer: {
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.background,
    fontWeight: '700',
  },
});
