import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  title?: string;
  message?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
  animated?: boolean;
}

export function EmptyState({
  icon,
  title,
  message,
  action,
  style,
  animated = true,
}: EmptyStateProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const entering = animated ? FadeInDown.delay(100).springify().damping(20).stiffness(100) : undefined;
  const iconEntering = animated ? FadeIn.delay(50) : undefined;

  return (
    <Animated.View 
      entering={entering}
      style={[styles.container, style]}
    >
      {icon && (
        <Animated.Text 
          entering={iconEntering}
          style={styles.icon}
        >
          {icon}
        </Animated.Text>
      )}
      <Text 
        style={[
          styles.title, 
          { 
            color: theme.colors.text,
            fontWeight: theme.typography.fontWeight.semibold,
          }
        ]}
      >
        {title || t('common.noData')}
      </Text>
      {message && (
        <Text 
          style={[
            styles.message, 
            { 
              color: theme.colors.textSecondary,
              lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.relaxed,
            }
          ]}
        >
          {message}
        </Text>
      )}
      {action && (
        <View style={styles.action}>
          <Button
            title={action.label}
            onPress={action.onPress}
            variant="primary"
            size="md"
          />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  icon: {
    fontSize: 56,
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
  },
  action: {
    marginTop: 24,
  },
});
