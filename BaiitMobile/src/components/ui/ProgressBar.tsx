import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { animation } from '../../themes/tokens';

interface ProgressBarProps {
  current: number;
  total: number;
  showLabel?: boolean;
  color?: string;
  gradient?: boolean;
  height?: number;
  animated?: boolean;
  style?: ViewStyle;
}

export function ProgressBar({
  current,
  total,
  showLabel = true,
  color,
  gradient = true,
  height = 8,
  animated = true,
  style,
}: ProgressBarProps) {
  const { theme } = useTheme();
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;

  useEffect(() => {
    if (animated) {
      opacity.value = withTiming(1, { duration: animation.duration.fast });
      progress.value = withDelay(
        100,
        withSpring(percentage, {
          damping: animation.spring.snappy.damping,
          stiffness: animation.spring.snappy.stiffness,
        })
      );
    } else {
      progress.value = percentage;
      opacity.value = 1;
    }
  }, [percentage, animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
    opacity: opacity.value,
  }));

  const progressColor = color || theme.colors.primary;

  const renderProgress = () => {
    if (gradient) {
      return (
        <LinearGradient
          colors={theme.colors.primaryGradient as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { height, borderRadius: theme.borderRadius.full }]}
        />
      );
    }
    return (
      <View
        style={[
          styles.fill,
          {
            height,
            backgroundColor: progressColor,
            borderRadius: theme.borderRadius.full,
          },
        ]}
      />
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor: theme.colors.surfaceSecondary,
            borderRadius: theme.borderRadius.full,
          },
        ]}
      >
        <Animated.View style={[styles.fillContainer, animatedStyle]}>
          {renderProgress()}
        </Animated.View>
      </View>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text
            style={[
              styles.label,
              { color: theme.colors.textSecondary },
            ]}
          >
            {current} / {total}
          </Text>
          <Text
            style={[
              styles.percentage,
              { color: theme.colors.primary },
            ]}
          >
            {percentage.toFixed(0)}%
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fillContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  percentage: {
    fontSize: 12,
    fontWeight: '600',
  },
});
