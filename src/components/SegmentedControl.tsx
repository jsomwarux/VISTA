import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius } from '../constants/theme';

interface Segment {
  key: string;
  label: string;
  icon?: string;
}

interface SegmentedControlProps {
  segments: Segment[];
  activeKey: string;
  onChange: (key: string) => void;
}

export function SegmentedControl({ segments, activeKey, onChange }: SegmentedControlProps) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const segmentWidth = useRef(0);
  const activeIndex = segments.findIndex(s => s.key === activeKey);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeIndex * segmentWidth.current,
      useNativeDriver: true,
      tension: 300,
      friction: 30,
    }).start();
  }, [activeIndex]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    segmentWidth.current = width / segments.length;
    slideAnim.setValue(activeIndex * segmentWidth.current);
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Animated indicator */}
      <Animated.View
        style={[
          styles.indicator,
          {
            width: `${100 / segments.length}%`,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.indicatorGradient}
        />
      </Animated.View>

      {/* Segment buttons */}
      {segments.map((segment) => {
        const isActive = segment.key === activeKey;
        return (
          <Pressable
            key={segment.key}
            style={styles.segment}
            onPress={() => onChange(segment.key)}
          >
            {segment.icon && (
              <Text style={[styles.icon, isActive && styles.iconActive]}>
                {segment.icon}
              </Text>
            )}
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    padding: 4,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  indicatorGradient: {
    flex: 1,
    borderRadius: borderRadius.full,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    zIndex: 1,
  },
  icon: {
    fontSize: 14,
    marginRight: spacing.xs,
    color: colors.textMuted,
  },
  iconActive: {
    color: colors.background,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.background,
  },
});
