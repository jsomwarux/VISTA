import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, shadows } from '../constants/theme';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function GradientButton({
  title,
  onPress,
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}: GradientButtonProps) {
  const isDisabled = disabled || loading;

  const sizeStyles = {
    small: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, fontSize: 14 },
    medium: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, fontSize: 16 },
    large: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl, fontSize: 18 },
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.container,
        shadows.md,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          {
            paddingVertical: sizeStyles[size].paddingVertical,
            paddingHorizontal: sizeStyles[size].paddingHorizontal,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.background} size="small" />
        ) : (
          <>
            {icon}
            <Text
              style={[
                styles.text,
                { fontSize: sizeStyles[size].fontSize },
                icon ? styles.textWithIcon : undefined,
                textStyle,
              ]}
            >
              {title}
            </Text>
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
  },
  text: {
    color: colors.background,
    fontWeight: '700',
  },
  textWithIcon: {
    marginLeft: spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
