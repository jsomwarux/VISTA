import React, { useRef, ReactNode } from 'react';
import { Pressable, Animated, ViewStyle, PressableProps } from 'react-native';

interface AnimatedPressableProps extends PressableProps {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  scaleAmount?: number;
  duration?: number;
}

export function AnimatedPressable({
  children,
  style,
  scaleAmount = 0.97,
  duration = 100,
  onPress,
  onPressIn,
  onPressOut,
  ...props
}: AnimatedPressableProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    Animated.spring(scaleAnim, {
      toValue: scaleAmount,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
    onPressOut?.(e);
  };

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} {...props}>
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
