import React, { useCallback } from 'react';
import {
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { animation } from '../../themes/tokens';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(
  require('react-native').Pressable
);

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
  fullWidth = false,
}: ButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);

  const handlePress = useCallback(async () => {
    if (!disabled && !loading) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  }, [disabled, loading, onPress]);

  const handlePressIn = useCallback(() => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.96, {
        damping: animation.spring.bouncy.damping,
        stiffness: animation.spring.bouncy.stiffness,
      });
      pressed.value = withSpring(1);
    }
  }, [disabled, loading]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, {
      damping: animation.spring.bouncy.damping,
      stiffness: animation.spring.bouncy.stiffness,
    });
    pressed.value = withSpring(0);
  }, []);

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: theme.spacing[2],
          paddingHorizontal: theme.spacing[4],
          minHeight: 36,
        };
      case 'lg':
        return {
          paddingVertical: theme.spacing[4],
          paddingHorizontal: theme.spacing[6],
          minHeight: 52,
        };
      case 'xl':
        return {
          paddingVertical: theme.spacing[5],
          paddingHorizontal: theme.spacing[8],
          minHeight: 60,
        };
      default:
        return {
          paddingVertical: theme.spacing[3],
          paddingHorizontal: theme.spacing[5],
          minHeight: 44,
        };
    }
  };

  const getTextSize = (): number => {
    switch (size) {
      case 'sm':
        return theme.typography.fontSize.sm;
      case 'lg':
        return theme.typography.fontSize.md;
      case 'xl':
        return theme.typography.fontSize.lg;
      default:
        return theme.typography.fontSize.base;
    }
  };

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: theme.colors.surfaceSecondary,
          borderWidth: 0,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: theme.colors.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      case 'danger':
        return {
          backgroundColor: theme.colors.error,
        };
      default:
        return {};
    }
  };

  const getTextColor = (): string => {
    if (disabled) return theme.colors.textTertiary;
    
    switch (variant) {
      case 'secondary':
        return theme.colors.text;
      case 'outline':
        return theme.colors.primary;
      case 'ghost':
        return theme.colors.primary;
      case 'danger':
        return '#FFFFFF';
      default:
        return '#FFFFFF';
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      disabled ? 1 : pressed.value,
      [0, 1],
      [1, 0.8],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale: scale.value }],
      opacity: disabled ? 0.5 : opacity,
    };
  });

  const shadowAnimatedStyle = useAnimatedStyle(() => {
    if (variant !== 'primary' && variant !== 'danger') return {};
    
    const shadowOpacity = interpolate(
      pressed.value,
      [0, 1],
      [0.3, 0.1],
      Extrapolation.CLAMP
    );

    return {
      shadowOpacity,
    };
  });

  const buttonStyle = [
    styles.button,
    getSizeStyles(),
    getVariantStyles(),
    animatedStyle,
    shadowAnimatedStyle,
    fullWidth && styles.fullWidth,
    style,
  ];

  const textStyleCombined = [
    styles.text,
    {
      fontSize: getTextSize(),
      color: getTextColor(),
      fontWeight: theme.typography.fontWeight.semibold,
    },
    icon && iconPosition === 'left' ? { marginLeft: theme.spacing[2] } : null,
    icon && iconPosition === 'right' ? { marginRight: theme.spacing[2] } : null,
    textStyle,
  ].filter(Boolean);

  if (variant === 'primary') {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={buttonStyle}
      >
        <LinearGradient
          colors={theme.colors.primaryGradient as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, getSizeStyles()]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              {icon && iconPosition === 'left' && icon}
              <Text style={textStyleCombined}>{title}</Text>
              {icon && iconPosition === 'right' && icon}
            </>
          )}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={buttonStyle}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text style={textStyleCombined}>{title}</Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  gradient: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  text: {
    textAlign: 'center',
  },
  fullWidth: {
    width: '100%',
  },
});
