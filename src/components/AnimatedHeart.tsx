import React, { useRef, useEffect } from 'react';
import { Pressable, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';

interface AnimatedHeartProps {
  liked: boolean;
  onPress: () => void;
  size?: number;
  style?: ViewStyle;
}

export function AnimatedHeart({ liked, onPress, size = 22, style }: AnimatedHeartProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const previousLiked = useRef(liked);

  useEffect(() => {
    // Only animate when transitioning from unliked to liked
    if (liked && !previousLiked.current) {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.3,
          useNativeDriver: true,
          speed: 50,
          bounciness: 12,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 40,
          bounciness: 8,
        }),
      ]).start();
    }
    previousLiked.current = liked;
  }, [liked, scaleAnim]);

  const handlePress = () => {
    if (!liked) {
      // Trigger a quick scale down/up for tap feedback
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 50,
          bounciness: 10,
        }),
      ]).start();
    }
    onPress();
  };

  return (
    <Pressable onPress={handlePress} style={style}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={size}
          color={liked ? colors.coral : colors.textMuted}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({});
