import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, DimensionValue } from 'react-native';
import { colors, borderRadius, spacing } from '../constants/theme';

interface SkeletonLoaderProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({
  width = '100%',
  height = 16,
  borderRadius: customBorderRadius = borderRadius.md,
  style,
}: SkeletonLoaderProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius: customBorderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

// Preset skeleton patterns
export function MoviePosterSkeleton({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) {
  const dimensions = {
    small: { width: 80, height: 120 },
    medium: { width: 110, height: 165 },
    large: { width: 140, height: 210 },
  };

  return (
    <SkeletonLoader
      width={dimensions[size].width}
      height={dimensions[size].height}
      borderRadius={borderRadius.lg}
    />
  );
}

export function RatingCardSkeleton() {
  return (
    <View style={styles.ratingCard}>
      <View style={styles.ratingCardHeader}>
        <SkeletonLoader width={40} height={40} borderRadius={20} />
        <View style={styles.ratingCardHeaderText}>
          <SkeletonLoader width={120} height={14} />
          <SkeletonLoader width={80} height={12} style={{ marginTop: spacing.xs }} />
        </View>
        <SkeletonLoader width={44} height={44} borderRadius={22} />
      </View>
      <SkeletonLoader width="100%" height={60} style={{ marginTop: spacing.md }} />
      <View style={styles.ratingCardPoster}>
        <MoviePosterSkeleton size="small" />
        <View style={styles.ratingCardPosterText}>
          <SkeletonLoader width={150} height={16} />
          <SkeletonLoader width={60} height={12} style={{ marginTop: spacing.xs }} />
        </View>
      </View>
    </View>
  );
}

export function ProfileHeaderSkeleton() {
  return (
    <View style={styles.profileHeader}>
      <SkeletonLoader width={80} height={80} borderRadius={40} />
      <View style={styles.profileInfo}>
        <SkeletonLoader width={140} height={20} />
        <SkeletonLoader width={100} height={14} style={{ marginTop: spacing.xs }} />
        <SkeletonLoader width={180} height={14} style={{ marginTop: spacing.sm }} />
      </View>
    </View>
  );
}

export function MovieDetailSkeleton() {
  return (
    <View style={styles.movieDetail}>
      <SkeletonLoader width="100%" height={300} borderRadius={0} />
      <View style={styles.movieDetailContent}>
        <View style={styles.movieDetailHeader}>
          <MoviePosterSkeleton size="large" />
          <View style={styles.movieDetailInfo}>
            <SkeletonLoader width={200} height={24} />
            <SkeletonLoader width={100} height={14} style={{ marginTop: spacing.sm }} />
            <SkeletonLoader width={150} height={14} style={{ marginTop: spacing.xs }} />
          </View>
        </View>
        <SkeletonLoader width="100%" height={100} style={{ marginTop: spacing.lg }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.surfaceLight,
  },
  ratingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  ratingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingCardHeaderText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  ratingCardPoster: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ratingCardPosterText: {
    marginLeft: spacing.md,
    flex: 1,
    justifyContent: 'center',
  },
  profileHeader: {
    flexDirection: 'row',
    padding: spacing.md,
  },
  profileInfo: {
    marginLeft: spacing.md,
    flex: 1,
    justifyContent: 'center',
  },
  movieDetail: {
    flex: 1,
  },
  movieDetailContent: {
    padding: spacing.md,
    marginTop: -80,
  },
  movieDetailHeader: {
    flexDirection: 'row',
  },
  movieDetailInfo: {
    flex: 1,
    marginLeft: spacing.md,
    paddingTop: spacing.md,
  },
});
