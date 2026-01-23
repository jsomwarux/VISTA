import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, getScoreColor } from '../constants/theme';

interface RatingDistributionProps {
  ratings: { score: number }[];
}

interface Bucket {
  label: string;
  min: number;
  max: number;
  count: number;
  color: string;
}

export function RatingDistribution({ ratings }: RatingDistributionProps) {
  const buckets: Bucket[] = [
    { label: '90+', min: 90, max: 100, count: 0, color: colors.scoreExcellent },
    { label: '80-89', min: 80, max: 89, count: 0, color: colors.scoreGreat },
    { label: '70-79', min: 70, max: 79, count: 0, color: colors.scoreGood },
    { label: '60-69', min: 60, max: 69, count: 0, color: colors.scoreMid },
    { label: '50-59', min: 50, max: 59, count: 0, color: colors.scoreAverage },
    { label: '<50', min: 0, max: 49, count: 0, color: colors.scorePoor },
  ];

  // Count ratings in each bucket
  ratings.forEach(rating => {
    for (const bucket of buckets) {
      if (rating.score >= bucket.min && rating.score <= bucket.max) {
        bucket.count++;
        break;
      }
    }
  });

  const maxCount = Math.max(...buckets.map(b => b.count), 1);
  const totalRatings = ratings.length;

  return (
    <View style={styles.container}>
      {buckets.map((bucket, index) => {
        const percentage = totalRatings > 0 ? (bucket.count / totalRatings) * 100 : 0;
        const barWidth = maxCount > 0 ? (bucket.count / maxCount) * 100 : 0;

        return (
          <View key={bucket.label} style={styles.row}>
            <Text style={styles.label}>{bucket.label}</Text>
            <View style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${barWidth}%`,
                    backgroundColor: bucket.color,
                  },
                ]}
              />
            </View>
            <Text style={styles.count}>
              {bucket.count}
              {percentage > 0 && (
                <Text style={styles.percentage}> ({Math.round(percentage)}%)</Text>
              )}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    width: 50,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  barContainer: {
    flex: 1,
    height: 12,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: borderRadius.sm,
    minWidth: 4,
  },
  count: {
    width: 60,
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
  },
  percentage: {
    fontSize: 10,
    color: colors.textMuted,
  },
});
