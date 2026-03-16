import React, { useState, useCallback, useRef } from 'react';
import { TextInput, View, StyleSheet, ViewStyle, TextInputProps, Text, Animated as RNAnimated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { animation } from '../../themes/tokens';

interface InputProps extends TextInputProps {
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  variant?: 'default' | 'filled' | 'outline';
  label?: string;
  error?: string;
  helperText?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(
  require('react-native').Pressable
);

export function Input({
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  variant = 'default',
  label,
  error,
  helperText,
  style,
  placeholder,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  
  const focusAnim = useSharedValue(0);
  const scale = useSharedValue(1);

  const handleFocus = useCallback((e: any) => {
    setIsFocused(true);
    focusAnim.value = withSpring(1, {
      damping: animation.spring.snappy.damping,
      stiffness: animation.spring.snappy.stiffness,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFocus?.(e);
  }, [onFocus]);

  const handleBlur = useCallback((e: any) => {
    setIsFocused(false);
    focusAnim.value = withSpring(0, {
      damping: animation.spring.snappy.damping,
      stiffness: animation.spring.snappy.stiffness,
    });
    onBlur?.(e);
  }, [onBlur]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.995, {
      damping: animation.spring.gentle.damping,
      stiffness: animation.spring.gentle.stiffness,
    });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, {
      damping: animation.spring.gentle.damping,
      stiffness: animation.spring.gentle.stiffness,
    });
  }, []);

  const getVariantStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: theme.colors.surface,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
    };

    if (error) {
      baseStyle.borderColor = theme.colors.error;
    } else if (isFocused) {
      baseStyle.borderColor = theme.colors.primary;
    }

    switch (variant) {
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surfaceSecondary,
          borderWidth: 0,
          borderBottomWidth: isFocused ? 2 : 1.5,
          borderBottomColor: error ? theme.colors.error : isFocused ? theme.colors.primary : theme.colors.border,
          borderRadius: theme.borderRadius.md,
          borderTopLeftRadius: theme.borderRadius.md,
          borderTopRightRadius: theme.borderRadius.md,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: isFocused ? 2 : 1.5,
        };
      default:
        return baseStyle;
    }
  };

  const animatedBorderStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(
      focusAnim.value,
      [0, 1],
      [0, 0.15],
      Extrapolation.CLAMP
    );

    const shadowRadius = interpolate(
      focusAnim.value,
      [0, 1],
      [0, 8],
      Extrapolation.CLAMP
    );

    return {
      shadowColor: theme.colors.primary,
      shadowOpacity,
      shadowRadius,
      shadowOffset: { width: 0, height: 0 },
      elevation: focusAnim.value * 2,
    };
  });

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const labelAnimatedStyle = useAnimatedStyle(() => {
    if (!label) return {};
    
    const translateY = interpolate(
      focusAnim.value,
      [0, 1],
      [0, -2],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateY }],
    };
  });

  return (
    <View style={containerStyle}>
      {label && (
        <Animated.Text
          style={[
            styles.label,
            {
              color: error ? theme.colors.error : isFocused ? theme.colors.primary : theme.colors.textSecondary,
              fontWeight: theme.typography.fontWeight.medium,
              marginBottom: theme.spacing[2],
            },
            labelAnimatedStyle,
          ]}
        >
          {label}
        </Animated.Text>
      )}
      
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.container,
          { borderRadius: theme.borderRadius.lg },
          getVariantStyles(),
          animatedBorderStyle,
          animatedContainerStyle,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={isFocused ? theme.colors.primary : theme.colors.textSecondary}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              color: theme.colors.text,
              paddingLeft: leftIcon ? 0 : theme.spacing[4],
              paddingRight: rightIcon ? 0 : theme.spacing[4],
              fontSize: theme.typography.fontSize.md,
            },
            style,
          ]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor={theme.colors.primary}
          {...props}
        />
        {rightIcon && (
          <AnimatedPressable
            onPress={onRightIconPress}
            style={styles.rightIconContainer}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={theme.colors.textSecondary}
            />
          </AnimatedPressable>
        )}
      </AnimatedPressable>

      {(error || helperText) && (
        <Animated.View style={[styles.helperContainer, { marginTop: theme.spacing[1.5] }]}>
          {error && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={14} color={theme.colors.error} />
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {error}
              </Text>
            </View>
          )}
          {!error && helperText && (
            <Text style={[styles.helperText, { color: theme.colors.textTertiary }]}>
              {helperText}
            </Text>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: 16,
  },
  leftIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 14,
  },
  rightIconContainer: {
    padding: 4,
  },
  label: {
    fontSize: 14,
  },
  helperContainer: {
    flexDirection: 'row',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
  },
});
