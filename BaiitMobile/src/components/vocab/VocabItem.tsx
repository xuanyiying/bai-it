import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { VocabStatus } from '../../services/database';

interface VocabItemProps {
  word: string;
  definition?: string;
  phonetic?: string;
  status: VocabStatus;
  encounterCount: number;
  onStatusChange?: (status: VocabStatus) => void;
  onPress?: () => void;
}

const STATUS_CONFIG: Record<VocabStatus, { icon: string; color: string; label: string }> = {
  new: { icon: 'ellipse-outline', color: '#2196F3', label: '新词' },
  learning: { icon: 'refresh-outline', color: '#FF9800', label: '学习中' },
  mastered: { icon: 'checkmark-circle-outline', color: '#4CAF50', label: '已掌握' },
};

export function VocabItem({ word, definition, phonetic, status, encounterCount, onStatusChange, onPress }: VocabItemProps) {
  const { theme } = useTheme();
  const config = STATUS_CONFIG[status];

  const handleStatusPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextStatus: Record<VocabStatus, VocabStatus> = {
      new: 'learning',
      learning: 'mastered',
      mastered: 'new',
    };
    onStatusChange?.(nextStatus[status]);
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.mainContent}>
        <View style={styles.wordInfo}>
          <Text style={[styles.word, { color: theme.colors.text }]}>{word}</Text>
          {phonetic && <Text style={[styles.phonetic, { color: theme.colors.textSecondary }]}>{phonetic}</Text>}
        </View>
        {definition && (
          <Text style={[styles.definition, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {definition}
          </Text>
        )}
      </View>
      <View style={styles.rightContent}>
        <TouchableOpacity style={styles.statusButton} onPress={handleStatusPress}>
          <Ionicons name={config.icon as any} size={20} color={config.color} />
        </TouchableOpacity>
        <View style={[styles.badge, { backgroundColor: config.color + '20' }]}>
          <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
        </View>
        <Text style={[styles.count, { color: theme.colors.textTertiary }]}>遇见 {encounterCount} 次</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  mainContent: {
    flex: 1,
  },
  wordInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  word: {
    fontSize: 18,
    fontWeight: '600',
  },
  phonetic: {
    fontSize: 14,
  },
  definition: {
    fontSize: 14,
    lineHeight: 20,
  },
  rightContent: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusButton: {
    padding: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  count: {
    fontSize: 11,
  },
});
