import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeIn,
  SlideInRight,
  Layout,
} from 'react-native-reanimated';
import { storage } from '../services/storage';
import { ClipboardService, ClipboardTextEvent } from '../services/clipboard';
import { Database, VocabRecord } from '../services/database';
import { Dictionary } from '../services/dictionary';
import { ProficiencyTest } from '../services/proficiency-test';
import { ScanResult, WordInfo } from '../types';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { RootStackParamList } from '../../App';
import { isEnglish, splitSentences, estimateComplexity } from '../utils/rule-engine';
import { staggerDelay } from '../utils/animations';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Main'>;
};

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export function HomeScreen({ navigation }: HomeScreenProps) {
  const [clipboardEnabled, setClipboardEnabled] = useState(false);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [todayStats, setTodayStats] = useState({
    newWords: 0,
    sentences: 0,
    scanRecords: 0,
  });
  const [proficiencyLevel, setProficiencyLevel] = useState<string | null>(null);

  const { theme } = useTheme();
  const { t } = useLanguage();

  useEffect(() => {
    loadSettings();
    loadTodayStats();
    loadProficiencyLevel();

    return () => {
      ClipboardService.stopMonitoring();
    };
  }, []);

  const loadProficiencyLevel = async () => {
    const result = await ProficiencyTest.getResult();
    if (result) {
      setProficiencyLevel(ProficiencyTest.getLevelDescription(result.level));
    }
  };

  const loadSettings = async () => {
    const savedEnabled = await storage.get<boolean>('clipboardEnabled');
    const savedResults = await storage.get<ScanResult[]>('results');

    if (savedEnabled !== undefined && savedEnabled !== null) {
      setClipboardEnabled(savedEnabled);
      if (savedEnabled) {
        startClipboardMonitoring();
      }
    }
    if (savedResults) setResults(savedResults);
  };

  const loadTodayStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    const record = await Database.getLearningRecord(today);

    // 计算今日识别记录数
    const savedResults = await storage.get<ScanResult[]>('results');
    const todayResults = savedResults?.filter(r => {
      const resultDate = new Date(r.timestamp).toISOString().split('T')[0];
      return resultDate === today;
    }) || [];

    setTodayStats({
      newWords: record?.newWords || 0,
      sentences: record?.sentencesCollected || 0,
      scanRecords: todayResults.length,
    });
  };

  const startClipboardMonitoring = useCallback(() => {
    return ClipboardService.startMonitoring(async (event: ClipboardTextEvent) => {
      if (isProcessing) return;

      const text = event.text.trim();
      if (!isEnglish(text)) return;

      setIsProcessing(true);

      try {
        const sentences = splitSentences(text);
        const complexSentences = sentences.filter(s => estimateComplexity(s) >= 2);

        if (complexSentences.length === 0) {
          setIsProcessing(false);
          return;
        }

        const analysis = await Dictionary.analyzeText(text);

        if (analysis.newWordsCount === 0) {
          setIsProcessing(false);
          return;
        }

        const wordInfos: WordInfo[] = analysis.words.map(w => ({
          word: w.word,
          isNew: w.isNew,
          definition: w.definition,
        }));

        for (const wordInfo of wordInfos.filter(w => w.isNew)) {
          const existingVocab = await Database.getVocabByWord(wordInfo.word);

          if (existingVocab) {
            await Database.incrementEncounterCount(wordInfo.word);
          } else {
            const vocabRecord: VocabRecord = {
              id: `${Date.now()}-${wordInfo.word}`,
              word: wordInfo.word,
              status: 'new',
              phonetic: wordInfo.definition?.match(/\/.*?\//)?.[0],
              definition: wordInfo.definition,
              encounterCount: 1,
              firstSeenAt: Date.now(),
              updatedAt: Date.now(),
            };
            await Database.saveVocab(vocabRecord);
            await Database.recordLearningActivity('new');
          }
        }

        const result: ScanResult = {
          id: Date.now().toString(),
          text: text.slice(0, 500),
          words: wordInfos,
          timestamp: event.timestamp,
        };

        setResults(prev => {
          const newResults = [result, ...prev].slice(0, 50);
          storage.set('results', newResults);
          return newResults;
        });

        await loadTodayStats();
      } catch (error) {
        console.error('处理剪贴板文本失败:', error);
      } finally {
        setIsProcessing(false);
      }
    });
  }, [isProcessing]);

  const toggleClipboard = async (value: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (value) {
      startClipboardMonitoring();
    } else {
      ClipboardService.stopMonitoring();
    }

    setClipboardEnabled(value);
    await storage.set('clipboardEnabled', value);
  };

  const clearResults = async () => {
    Alert.alert(
      t('common.confirm'),
      '确定要清空所有识别记录吗？',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.clear'),
          style: 'destructive',
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setResults([]);
            await storage.set('results', []);
          },
        },
      ]
    );
  };

  const openSettings = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Settings');
  };

  const openBrowser = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Browser');
  };

  const openProficiencyTest = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('ProficiencyTest');
  };

  const renderStatCard = (value: number, label: string, icon: keyof typeof Ionicons.glyphMap, index: number) => (
    <Animated.View
      entering={FadeInDown.delay(staggerDelay(index, 80)).springify()}
      style={styles.statItem}
    >
      <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
        <Ionicons name={icon} size={22} color={theme.colors.primary} />
      </View>
      <Text style={[
        styles.statValue,
        {
          color: theme.colors.text,
          fontWeight: theme.typography.fontWeight.bold,
        }
      ]}>
        {value}
      </Text>
      <Text style={[
        styles.statLabel,
        {
          color: theme.colors.textSecondary,
          fontSize: theme.typography.fontSize.xs,
        }
      ]}>
        {label}
      </Text>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={theme.colors.primaryGradientFull as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <Animated.View
            entering={FadeIn.delay(100)}
            style={styles.headerContent}
          >
            <View>
              <Text style={[
                styles.title,
                { fontWeight: theme.typography.fontWeight.bold }
              ]}>
                {t('home.title')}
              </Text>
              <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
            </View>
            <TouchableOpacity onPress={openSettings} style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>

      <AnimatedScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <Card variant="glass" style={styles.statsCard}>
            <View style={styles.statsRow}>
              {renderStatCard(todayStats.newWords, t('home.todayNewWords'), 'book-outline', 0)}
              <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
              {renderStatCard(todayStats.sentences, t('home.collectedSentences'), 'document-text-outline', 1)}
              <View style={[styles.statDivider, { backgroundColor: theme.colors.border }]} />
              {renderStatCard(todayStats.scanRecords, t('home.scanRecords'), 'scan-outline', 2)}
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(220).springify()}>
          <Card
            variant="elevated"
            style={styles.proficiencyCard}
            onPress={openProficiencyTest}
          >
            <View style={styles.proficiencyContent}>
              <View style={[styles.proficiencyIcon, { backgroundColor: proficiencyLevel ? theme.colors.success + '15' : theme.colors.warning + '15' }]}>
                <Ionicons
                  name={proficiencyLevel ? "checkmark-circle" : "school-outline"}
                  size={24}
                  color={proficiencyLevel ? theme.colors.success : theme.colors.warning}
                />
              </View>
              <View style={styles.proficiencyText}>
                <Text style={[
                  styles.proficiencyTitle,
                  {
                    color: theme.colors.text,
                    fontWeight: theme.typography.fontWeight.semibold,
                  }
                ]}>
                  {proficiencyLevel || '语言能力测试'}
                </Text>
                <Text style={[
                  styles.proficiencySubtext,
                  {
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.fontSize.sm,
                  }
                ]}>
                  {proficiencyLevel ? '点击重新测试' : '完成测试获得个性化标注'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(280).springify()}>
          <Card
            variant="elevated"
            style={styles.browserButton}
            onPress={openBrowser}
          >
            <View style={styles.browserContent}>
              <View style={[styles.browserIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                <Ionicons name="globe-outline" size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.browserText}>
                <Text style={[
                  styles.browserTitle,
                  {
                    color: theme.colors.text,
                    fontWeight: theme.typography.fontWeight.semibold,
                  }
                ]}>
                  {t('home.browser')}
                </Text>
                <Text style={[
                  styles.browserSubtext,
                  {
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.fontSize.sm,
                  }
                ]}>
                  {t('home.browserHint')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350).springify()}>
          <Card variant="elevated" style={styles.card}>
            <View style={styles.serviceRow}>
              <View style={styles.serviceInfo}>
                <View style={[
                  styles.statusIndicator,
                  { backgroundColor: clipboardEnabled ? theme.colors.success : theme.colors.border }
                ]}>
                  {clipboardEnabled && (
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  )}
                </View>
                <Text style={[
                  styles.label,
                  {
                    color: theme.colors.text,
                    fontWeight: theme.typography.fontWeight.semibold,
                    fontSize: theme.typography.fontSize.md,
                  }
                ]}>
                  {t('home.clipboardMonitor')}
                </Text>
              </View>
              {isProcessing && (
                <View style={styles.processingIndicator}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text style={[
                    styles.processingText,
                    {
                      color: theme.colors.primary,
                      fontSize: theme.typography.fontSize.xs,
                    }
                  ]}>
                    {t('home.processing')}
                  </Text>
                </View>
              )}
              <Switch
                value={clipboardEnabled}
                onValueChange={toggleClipboard}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={clipboardEnabled ? '#FFFFFF' : theme.colors.surface}
                ios_backgroundColor={theme.colors.border}
              />
            </View>
            <Text style={[
              styles.hint,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.sm,
                lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
              }
            ]}>
              {clipboardEnabled ? t('home.clipboardEnabled') : t('home.clipboardDisabled')}
            </Text>
          </Card>
        </Animated.View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[
              styles.sectionTitle,
              {
                color: theme.colors.text,
                fontWeight: theme.typography.fontWeight.bold,
                fontSize: theme.typography.fontSize.lg,
              }
            ]}>
              {t('home.scanRecords')}
            </Text>
            {results.length > 0 && (
              <TouchableOpacity onPress={clearResults}>
                <Text style={[
                  styles.clearText,
                  {
                    color: theme.colors.error,
                    fontWeight: theme.typography.fontWeight.semibold,
                  }
                ]}>
                  {t('common.clear')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {results.length === 0 ? (
            <EmptyState
              icon="📋"
              title={t('home.noRecords')}
              message={t('home.clipboardHint')}
            />
          ) : (
            results.map((result, index) => (
              <Animated.View
                key={result.id}
                entering={SlideInRight.delay(staggerDelay(index, 50)).springify()}
                layout={Layout.springify()}
              >
                <Card variant="elevated" style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <Text style={[
                      styles.resultTime,
                      {
                        color: theme.colors.textSecondary,
                        fontSize: theme.typography.fontSize.xs,
                      }
                    ]}>
                      {new Date(result.timestamp).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    {result.sourceApp && (
                      <Badge label={result.sourceApp} variant="primary" size="xs" />
                    )}
                  </View>
                  <Text style={[
                    styles.resultText,
                    {
                      color: theme.colors.text,
                      fontSize: theme.typography.fontSize.base,
                      lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.relaxed,
                    }
                  ]}>
                    {result.text}
                  </Text>
                  {result.words.filter(w => w.isNew).length > 0 && (
                    <View style={styles.newWordsContainer}>
                      {result.words.filter(w => w.isNew).map((word, idx) => (
                        <Badge
                          key={`${result.id}-${word.word}-${idx}`}
                          label={word.word}
                          variant="error"
                          size="sm"
                        />
                      ))}
                    </View>
                  )}
                </Card>
              </Animated.View>
            ))
          )}
        </View>
      </AnimatedScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 12,
  },
  statsCard: {
    marginTop: -36,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    marginTop: 4,
  },
  statLabel: {
    marginTop: 4,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 48,
  },
  proficiencyCard: {
    marginBottom: 12,
  },
  proficiencyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proficiencyIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proficiencyText: {
    flex: 1,
    marginLeft: 16,
  },
  proficiencyTitle: {
    fontSize: 16,
  },
  proficiencySubtext: {
    marginTop: 2,
  },
  browserButton: {
    marginBottom: 16,
  },
  browserContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  browserIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  browserText: {
    flex: 1,
    marginLeft: 14,
  },
  browserTitle: {
    fontSize: 16,
  },
  browserSubtext: {
    marginTop: 4,
  },
  card: {
    marginBottom: 16,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  statusIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
  },
  processingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    gap: 6,
  },
  processingText: {
    fontSize: 12,
  },
  hint: {
    fontSize: 13,
  },
  section: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
  },
  clearText: {
    fontSize: 14,
  },
  resultCard: {
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  resultTime: {
    fontSize: 12,
  },
  resultText: {
    fontSize: 15,
  },
  newWordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
});
