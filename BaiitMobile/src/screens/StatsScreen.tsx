import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Database, AppStats, LearningRecord } from '../services/database';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { Card } from '../components/ui/Card';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Button } from '../components/ui/Button';

const { width } = Dimensions.get('window');

export const StatsScreen: React.FC = () => {
  const [stats, setStats] = useState<AppStats | null>(null);
  const [todayRecord, setTodayRecord] = useState<LearningRecord | null>(null);
  const [weeklyRecords, setWeeklyRecords] = useState<LearningRecord[]>([]);
  const [reviewCount, setReviewCount] = useState(0);

  const { theme } = useTheme();
  const { t } = useLanguage();

  const loadData = useCallback(async () => {
    const [appStats, today, reviews] = await Promise.all([
      Database.getStats(),
      Database.getLearningRecord(getTodayString()),
      Database.getReviewItems(Date.now() + 24 * 60 * 60 * 1000),
    ]);

    setStats(appStats);
    setTodayRecord(today);
    setReviewCount(reviews.length);

    const endDate = getTodayString();
    const startDate = getDateString(-6);
    const weekly = await Database.getLearningRecords(startDate, endDate);
    setWeeklyRecords(weekly);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const renderWeeklyChart = () => {
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    const today = new Date().getDay();

    const orderedDays: string[] = [];
    for (let i = 0; i < 7; i++) {
      orderedDays.push(days[(today - i + 7) % 7]);
    }
    orderedDays.reverse();

    const dailyData = orderedDays.map((_, index) => {
      const date = getDateString(index - 6);
      const record = weeklyRecords.find(r => r.date === date);
      return {
        date,
        studied: !!record && (record.newWords > 0 || record.reviewedWords > 0),
        newWords: record?.newWords || 0,
        reviewedWords: record?.reviewedWords || 0,
      };
    });

    const maxWords = Math.max(...dailyData.map(d => d.newWords + d.reviewedWords), 1);

    return (
      <Card variant="elevated">
        <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
          {t('stats.weeklyTrend')}
        </Text>
        <View style={styles.chart}>
          {dailyData.map((data, index) => {
            const totalWords = data.newWords + data.reviewedWords;
            const height = maxWords > 0 ? (totalWords / maxWords) * 100 : 0;

            return (
              <View key={`chart-bar-${data.date}-${index}`} style={styles.chartBarContainer}>
                <View style={styles.chartBarWrapper}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: `${Math.max(height, 5)}%`,
                        backgroundColor: data.studied ? theme.colors.primary : theme.colors.border,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.chartLabel, { color: theme.colors.textSecondary }]}>
                  {orderedDays[index]}
                </Text>
                {totalWords > 0 && (
                  <Text style={[styles.chartValue, { color: theme.colors.textSecondary }]}>
                    {totalWords}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </Card>
    );
  };

  if (!stats) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={theme.colors.primaryGradient as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.streakContainer}
      >
        <View style={styles.streakHeader}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakValue}>{stats.currentStreak}</Text>
          <Text style={styles.streakLabel}>{t('stats.days')}</Text>
        </View>
        <Text style={styles.streakText}>{t('stats.streak')}</Text>
        {stats.longestStreak > stats.currentStreak && (
          <Text style={styles.streakRecord}>
            {t('stats.longestRecord', { count: stats.longestStreak })}
          </Text>
        )}
      </LinearGradient>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('stats.todayOverview')}
        </Text>
        <View style={styles.todayGrid}>
          <Card variant="elevated" style={styles.statCard}>
            <Ionicons name="book-outline" size={24} color={theme.colors.success} />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {todayRecord?.newWords || 0}
            </Text>
            <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>
              {t('stats.newWords')}
            </Text>
          </Card>
          <Card variant="elevated" style={styles.statCard}>
            <Ionicons name="refresh-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {todayRecord?.reviewedWords || 0}
            </Text>
            <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>
              {t('stats.reviewedWords')}
            </Text>
          </Card>
          <Card variant="elevated" style={styles.statCard}>
            <Ionicons name="document-text-outline" size={24} color={theme.colors.warning} />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {todayRecord?.sentencesCollected || 0}
            </Text>
            <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>
              {t('stats.collectedSentences')}
            </Text>
          </Card>
          <Card variant="elevated" style={styles.statCard}>
            <Ionicons name="time-outline" size={24} color={theme.colors.error} />
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {todayRecord?.studyTimeMinutes || 0}
            </Text>
            <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>
              {t('stats.minutes')}
            </Text>
          </Card>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('stats.vocabMastery')}
        </Text>
        <Card variant="elevated">
          <View style={styles.vocabStats}>
            <View style={styles.vocabStatItem}>
              <Text style={[styles.vocabStatValue, { color: theme.colors.text }]}>
                {stats.totalWords}
              </Text>
              <Text style={[styles.vocabStatLabel, { color: theme.colors.textSecondary }]}>
                {t('stats.totalVocab')}
              </Text>
            </View>
            <View style={styles.vocabStatItem}>
              <Text style={[styles.vocabStatValue, { color: theme.colors.error }]}>
                {stats.newWords}
              </Text>
              <Text style={[styles.vocabStatLabel, { color: theme.colors.textSecondary }]}>
                {t('stats.newVocab')}
              </Text>
            </View>
            <View style={styles.vocabStatItem}>
              <Text style={[styles.vocabStatValue, { color: theme.colors.warning }]}>
                {stats.learningWords}
              </Text>
              <Text style={[styles.vocabStatLabel, { color: theme.colors.textSecondary }]}>
                {t('stats.learningVocab')}
              </Text>
            </View>
            <View style={styles.vocabStatItem}>
              <Text style={[styles.vocabStatValue, { color: theme.colors.success }]}>
                {stats.masteredWords}
              </Text>
              <Text style={[styles.vocabStatLabel, { color: theme.colors.textSecondary }]}>
                {t('stats.masteredVocab')}
              </Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
              {t('stats.progress')}
            </Text>
            <ProgressBar
              current={stats.masteredWords}
              total={stats.totalWords}
              color={theme.colors.success}
            />
          </View>
        </Card>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('stats.sentenceCollection')}
        </Text>
        <Card variant="elevated" style={styles.sentenceCard}>
          <Ionicons name="document-text" size={32} color={theme.colors.primary} />
          <Text style={[styles.sentenceCount, { color: theme.colors.primary }]}>
            {stats.totalSentences}
          </Text>
          <Text style={[styles.sentenceLabel, { color: theme.colors.textSecondary }]}>
            {t('stats.collected')}
          </Text>
        </Card>
      </View>

      {reviewCount > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('stats.reviewReminder')}
          </Text>
          <Card variant="elevated" style={styles.reviewCard}>
            <View style={styles.reviewContent}>
              <View>
                <Text style={[styles.reviewTitle, { color: theme.colors.text }]}>
                  {t('stats.todayReview')}
                </Text>
                <Text style={[styles.reviewSubtitle, { color: theme.colors.textSecondary }]}>
                  {t('stats.reviewCount', { count: reviewCount })}
                </Text>
              </View>
              <Button
                title={t('stats.startReview')}
                onPress={() => {}}
                variant="primary"
                size="sm"
              />
            </View>
          </Card>
        </View>
      )}

      <View style={styles.section}>
        {renderWeeklyChart()}
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

function getDateString(daysOffset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
  },
  streakContainer: {
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  streakEmoji: {
    fontSize: 32,
    marginRight: 8,
  },
  streakValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  streakLabel: {
    fontSize: 20,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  streakText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
  },
  streakRecord: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  todayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 48) / 2,
    marginBottom: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statTitle: {
    fontSize: 14,
    marginTop: 4,
  },
  vocabStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  vocabStatItem: {
    alignItems: 'center',
  },
  vocabStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  vocabStatLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  progressSection: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  sentenceCard: {
    alignItems: 'center',
  },
  sentenceCount: {
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 8,
  },
  sentenceLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  reviewCard: {
    backgroundColor: '#FFF3E0',
  },
  reviewContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 150,
    alignItems: 'flex-end',
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
  },
  chartBarWrapper: {
    width: 30,
    height: 100,
    justifyContent: 'flex-end',
    borderRadius: 4,
    overflow: 'hidden',
  },
  chartBar: {
    width: '100%',
    borderRadius: 4,
  },
  chartLabel: {
    fontSize: 12,
    marginTop: 8,
  },
  chartValue: {
    fontSize: 10,
    marginTop: 2,
  },
  bottomPadding: {
    height: 32,
  },
});
