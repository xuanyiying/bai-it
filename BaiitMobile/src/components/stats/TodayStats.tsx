import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';

interface TodayStatsProps {
  newWords: number;
  sentences: number;
  scanRecords: number;
  proficiencyLevel?: string | null;
}

export function TodayStats({ newWords, sentences, scanRecords, proficiencyLevel }: TodayStatsProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const stats = [
    { icon: 'book-outline' as const, value: newWords, label: '新词汇' },
    { icon: 'document-text-outline' as const, value: sentences, label: '句子' },
    { icon: 'scan-outline' as const, value: scanRecords, label: '扫描次数' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>今日学习</Text>
        {proficiencyLevel && (
          <View style={[styles.badge, { backgroundColor: theme.colors.primary + '20' }]}>
            <Ionicons name="school-outline" size={12} color={theme.colors.primary} />
            <Text style={[styles.badgeText, { color: theme.colors.primary }]}>{proficiencyLevel}</Text>
          </View>
        )}
      </View>
      <View style={styles.statsRow}>
        {stats.map((stat, index) => (
          <View key={`stat-${index}`} style={styles.statItem}>
            <View style={[styles.iconWrapper, { backgroundColor: theme.colors.primary + '15' }]}>
              <Ionicons name={stat.icon} size={20} color={theme.colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
});
