import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { SavedSentence } from '../../services/database';

interface SentenceItemProps {
  sentence: SavedSentence;
  onPress?: () => void;
  onDelete?: () => void;
}

export function SentenceItem({ sentence, onPress, onDelete }: SentenceItemProps) {
  const { theme } = useTheme();

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDelete?.();
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={[styles.text, { color: theme.colors.text }]} numberOfLines={3}>
          {sentence.text}
        </Text>
        {sentence.translation && (
          <Text style={[styles.translation, { color: theme.colors.textSecondary }]} numberOfLines={2}>
            {sentence.translation}
          </Text>
        )}
        <View style={styles.meta}>
          <View style={styles.sourceTag}>
            <Ionicons name="globe-outline" size={12} color={theme.colors.primary} />
            <Text style={[styles.sourceText, { color: theme.colors.primary }]}>
              {sentence.sourceApp || '未知来源'}
            </Text>
          </View>
          <Text style={[styles.date, { color: theme.colors.textTertiary }]}>
            {new Date(sentence.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      {onDelete && (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  translation: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sourceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
    justifyContent: 'center',
  },
});
