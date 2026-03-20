import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function SearchBar({
  value,
  onChangeText,
  placeholder = '搜索...',
  onFocus,
  onBlur,
}: SearchBarProps) {
  const { theme } = useTheme();
  const isFocused = useSharedValue(0);

  const handleFocus = () => {
    isFocused.value = withSpring(1);
    onFocus?.();
  };

  const handleBlur = () => {
    isFocused.value = withSpring(0);
    onBlur?.();
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChangeText('');
  };

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: isFocused.value === 1 ? theme.colors.primary : theme.colors.border,
    backgroundColor: theme.colors.surface,
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: isFocused.value === 1 ? 1 : 0.6,
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        {
          borderRadius: theme.borderRadius.xl,
          shadowColor: theme.colors.primary,
        },
        containerAnimatedStyle,
      ]}
    >
      <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
        <Ionicons
          name="search-outline"
          size={20}
          color={theme.colors.primary}
        />
      </Animated.View>

      <TextInput
        style={[
          styles.input,
          {
            color: theme.colors.text,
            fontSize: theme.typography.fontSize.base,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        onFocus={handleFocus}
        onBlur={handleBlur}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {value.length > 0 && (
        <AnimatedTouchable
          onPress={handleClear}
          style={[styles.clearButton, { borderRadius: theme.borderRadius.full }]}
        >
          <Ionicons
            name="close-circle"
            size={18}
            color={theme.colors.textTertiary}
          />
        </AnimatedTouchable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  iconContainer: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
});