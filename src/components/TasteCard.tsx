import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ViewStyle, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, getGenreColor } from '../constants/theme';

interface TasteCardProps {
  title: string;
  description: string;
  topGenre?: string;
  backgroundPoster?: string;
  style?: ViewStyle;
}

export function TasteCard({ title, description, topGenre, backgroundPoster, style }: TasteCardProps) {
  const genreColor = topGenre ? getGenreColor(topGenre) : colors.primary;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.15, 0],
  });

  // Get genre icon
  const getGenreIcon = (genre?: string): keyof typeof Ionicons.glyphMap => {
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      'Action': 'flash',
      'Adventure': 'compass',
      'Animation': 'color-palette',
      'Comedy': 'happy',
      'Crime': 'skull',
      'Documentary': 'videocam',
      'Drama': 'heart',
      'Family': 'people',
      'Fantasy': 'sparkles',
      'History': 'time',
      'Horror': 'skull-outline',
      'Music': 'musical-notes',
      'Mystery': 'search',
      'Romance': 'heart-circle',
      'Science Fiction': 'planet',
      'Thriller': 'alert-circle',
      'War': 'shield',
      'Western': 'sunny',
    };
    return icons[genre || ''] || 'star';
  };

  return (
    <View style={[styles.container, shadows.lg, style]}>
      {/* Background poster if available */}
      {backgroundPoster && (
        <Image
          source={{ uri: backgroundPoster }}
          style={styles.backgroundImage}
          blurRadius={30}
        />
      )}

      {/* Gradient overlay */}
      <LinearGradient
        colors={[genreColor + '40', genreColor + '15', colors.surface + 'F0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Shimmer effect */}
        <Animated.View
          style={[
            styles.shimmer,
            {
              transform: [{ translateX: shimmerTranslate }],
              opacity: shimmerOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={['transparent', genreColor + '60', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shimmerGradient}
          />
        </Animated.View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={[styles.iconBg, { backgroundColor: genreColor + '30' }]}>
              <Ionicons name={getGenreIcon(topGenre)} size={24} color={genreColor} />
            </View>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.preTitle}>You're a</Text>
            <Text style={[styles.title, { color: genreColor }]}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
        </View>

        {/* Decorative elements */}
        <View style={[styles.decorCircle, styles.decorCircle1, { borderColor: genreColor + '20' }]} />
        <View style={[styles.decorCircle, styles.decorCircle2, { borderColor: genreColor + '15' }]} />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
  },
  gradient: {
    padding: spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
  },
  shimmerGradient: {
    flex: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    zIndex: 1,
  },
  iconContainer: {
    marginRight: spacing.md,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  preTitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  decorCircle: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 999,
  },
  decorCircle1: {
    width: 120,
    height: 120,
    top: -40,
    right: -40,
  },
  decorCircle2: {
    width: 80,
    height: 80,
    bottom: -20,
    left: -20,
  },
});
