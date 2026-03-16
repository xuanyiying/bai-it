import React, { useCallback } from 'react';
import { StyleSheet, ViewStyle, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { animation } from '../../themes/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'glass' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  onPress?: () => void;
  animated?: boolean;
  pressable?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({
  children,
  style,
  variant = 'default',
  padding = 'md',
  onPress,
  animated = true,
  pressable = false,
}: CardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);

  const getPaddingStyles = (): ViewStyle => {
    switch (padding) {
      case 'none':
        return {};
      case 'sm':
        return { padding: theme.spacing[3] };
      case 'lg':
        return { padding: theme.spacing[6] };
      case 'xl':
        return { padding: theme.spacing[8] };
      default:
        return { padding: theme.spacing[4] };
    }
  };

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'glass':
        return {
          backgroundColor: theme.colors.glass.background,
          borderWidth: 1,
          borderColor: theme.colors.glass.border,
        };
      case 'elevated':
        return {
          backgroundColor: theme.colors.card,
          ...theme.shadows.lg,
        };
      case 'outlined':
        return {
          backgroundColor: theme.colors.card,
          borderWidth: 1.5,
          borderColor: theme.colors.border,
        };
      case 'filled':
        return {
          backgroundColor: theme.colors.surfaceSecondary,
        };
      default:
        return {
          backgroundColor: theme.colors.card,
          ...theme.shadows.md,
        };
    }
  };

  const handlePressIn = useCallback(() => {
    if (onPress || pressable) {
      scale.value = withSpring(0.98, {
        damping: animation.spring.bouncy.damping,
        stiffness: animation.spring.bouncy.stiffness,
      });
      pressed.value = withSpring(1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [onPress, pressable]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, {
      damping: animation.spring.bouncy.damping,
      stiffness: animation.spring.bouncy.stiffness,
    });
    pressed.value = withSpring(0);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    if (!animated) return {};

    return {
      transform: [{ scale: scale.value }],
    };
  });

  const shadowAnimatedStyle = useAnimatedStyle(() => {
    if (!animated || variant === 'outlined' || variant === 'filled') return {};

    const shadowOpacity = interpolate(
      pressed.value,
      [0, 1],
      [variant === 'elevated' ? 0.12 : 0.1, 0.06],
      Extrapolation.CLAMP
    );

    return {
      shadowOpacity,
    };
  });

  const cardStyle = [
    styles.card,
    { borderRadius: theme.borderRadius.xl },
    getVariantStyles(),
    getPaddingStyles(),
    animatedStyle,
    shadowAnimatedStyle,
    style,
  ];

  if (variant === 'glass') {
    const glassContent = (
      <BlurView
        intensity={theme.isDark ? 40 : 80}
        tint={theme.isDark ? 'dark' : 'light'}
        style={[
          styles.blurContainer,
          { borderRadius: theme.borderRadius.xl },
          getPaddingStyles(),
        ]}
      >
        {children}
      </BlurView>
    );

    if (onPress) {
      return (
        <AnimatedPressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={cardStyle}
        >
          {glassContent}
        </AnimatedPressable>
      );
    }

    return <Animated.View style={cardStyle}>{glassContent}</Animated.View>;
  }

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={cardStyle}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return <Animated.View style={cardStyle}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  blurContainer: {
    overflow: 'hidden',
  },
});
