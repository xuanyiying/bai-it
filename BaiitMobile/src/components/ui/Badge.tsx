import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
  dot?: boolean;
}

export function Badge({
  label,
  variant = 'default',
  size = 'md',
  style,
  textStyle,
  dot = false,
}: BadgeProps) {
  const { theme } = useTheme();

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: theme.colors.statusBadge.mastered,
        };
      case 'warning':
        return {
          backgroundColor: theme.colors.statusBadge.learning,
        };
      case 'error':
        return {
          backgroundColor: theme.colors.statusBadge.new,
        };
      case 'info':
        return {
          backgroundColor: theme.colors.info,
        };
      case 'primary':
        return {
          backgroundColor: theme.colors.primary,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: theme.colors.primary,
        };
      default:
        return {
          backgroundColor: theme.colors.surfaceSecondary,
        };
    }
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'xs':
        return {
          paddingVertical: 2,
          paddingHorizontal: 6,
          minHeight: 18,
        };
      case 'sm':
        return {
          paddingVertical: 3,
          paddingHorizontal: 8,
          minHeight: 22,
        };
      case 'lg':
        return {
          paddingVertical: 6,
          paddingHorizontal: 14,
          minHeight: 30,
        };
      default:
        return {
          paddingVertical: 4,
          paddingHorizontal: 10,
          minHeight: 26,
        };
    }
  };

  const getTextSize = (): number => {
    switch (size) {
      case 'xs':
        return 9;
      case 'sm':
        return 11;
      case 'lg':
        return 14;
      default:
        return 12;
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'success':
      case 'warning':
      case 'error':
      case 'info':
      case 'primary':
        return '#FFFFFF';
      case 'outline':
        return theme.colors.primary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getDotColor = (): string => {
    switch (variant) {
      case 'success':
        return theme.colors.statusBadge.masteredLight;
      case 'warning':
        return theme.colors.statusBadge.learningLight;
      case 'error':
        return theme.colors.statusBadge.newLight;
      case 'info':
        return theme.colors.infoLight;
      case 'primary':
        return theme.colors.brand.primaryLight;
      default:
        return theme.colors.textSecondary;
    }
  };

  return (
    <View
      style={[
        styles.badge,
        { borderRadius: theme.borderRadius.full },
        getVariantStyles(),
        getSizeStyles(),
        style,
      ]}
    >
      {dot && (
        <View
          style={[
            styles.dot,
            {
              backgroundColor: getTextColor(),
              marginRight: theme.spacing[1.5],
            },
          ]}
        />
      )}
      <Text
        style={[
          styles.text,
          {
            fontSize: getTextSize(),
            color: getTextColor(),
            fontWeight: theme.typography.fontWeight.semibold,
            letterSpacing: theme.typography.letterSpacing.tight,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    textAlign: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
