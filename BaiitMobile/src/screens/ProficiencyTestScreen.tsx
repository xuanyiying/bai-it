import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeInRight,
  FadeOut,
  FadeOutLeft,
  SlideInRight,
} from 'react-native-reanimated';
import { RootStackParamList } from '../../App';
import { ProficiencyTest, ProficiencyResult, TestQuestion } from '../services/proficiency-test';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

type ProficiencyTestScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ProficiencyTest'>;
};

const { width } = Dimensions.get('window');

const AnimatedView = Animated.createAnimatedComponent(View);

export function ProficiencyTestScreen({ navigation }: ProficiencyTestScreenProps) {
  const [currentStep, setCurrentStep] = useState<'intro' | 'testing' | 'result'>('intro');
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: number; selected: number }[]>([]);
  const [result, setResult] = useState<ProficiencyResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { theme } = useTheme();
  const { t } = useLanguage();

  useEffect(() => {
    const allQuestions = ProficiencyTest.getQuestions();
    // 打乱顺序
    setQuestions(allQuestions.sort(() => Math.random() - 0.5));
  }, []);

  const startTest = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentStep('testing');
    setCurrentIndex(0);
    setAnswers([]);
  };

  const selectAnswer = async (optionIndex: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const currentQuestion = questions[currentIndex];
    const newAnswers = [...answers, { questionId: currentQuestion.id, selected: optionIndex }];
    setAnswers(newAnswers);

    // 延迟后进入下一题
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        finishTest(newAnswers);
      }
    }, 500);
  };

  const finishTest = async (finalAnswers: { questionId: number; selected: number }[]) => {
    setIsSubmitting(true);

    // 模拟计算延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    const testResult = ProficiencyTest.calculateResult(finalAnswers);
    setResult(testResult);
    await ProficiencyTest.saveResult(testResult);

    setIsSubmitting(false);
    setCurrentStep('result');

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const goBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const completeTest = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Main');
  };

  const retakeTest = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentStep('intro');
    setCurrentIndex(0);
    setAnswers([]);
    setResult(null);
  };

  // 介绍页面
  const renderIntro = () => (
    <AnimatedView entering={FadeIn} style={styles.introContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="school-outline" size={64} color={theme.colors.primary} />
      </View>

      <Text style={[
        styles.introTitle,
        { color: theme.colors.text, fontWeight: theme.typography.fontWeight.bold }
      ]}>
        语言能力测试
      </Text>

      <Text style={[
        styles.introDescription,
        { color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.md }
      ]}>
        通过简单的测试，我们将了解您的英语水平，为您推荐合适的学习内容，并在阅读时智能标注适合您的生词。
      </Text>

      <View style={styles.featuresContainer}>
        {[
          { icon: 'bookmark-outline', text: '个性化生词标注' },
          { icon: 'trending-up-outline', text: '适合难度的阅读材料' },
          { icon: 'time-outline', text: '仅需 2-3 分钟' },
        ].map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Ionicons name={feature.icon as any} size={20} color={theme.colors.primary} />
            <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
              {feature.text}
            </Text>
          </View>
        ))}
      </View>

      <Button
        title="开始测试"
        onPress={startTest}
        variant="primary"
        size="lg"
        style={styles.startButton}
      />

      <TouchableOpacity onPress={goBack} style={styles.skipButton}>
        <Text style={[styles.skipText, { color: theme.colors.textTertiary }]}>
          稍后再说
        </Text>
      </TouchableOpacity>
    </AnimatedView>
  );

  // 测试页面
  const renderTesting = () => {
    if (questions.length === 0) return null;

    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
      <AnimatedView entering={FadeIn} style={styles.testingContainer}>
        {/* 进度条 */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: theme.colors.primary, width: `${progress}%` }
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
            {currentIndex + 1} / {questions.length}
          </Text>
        </View>

        {/* 题目卡片 */}
        <AnimatedView
          key={currentQuestion.id}
          entering={SlideInRight}
          exiting={FadeOutLeft}
          style={styles.questionCard}
        >
          <Card variant="elevated" style={styles.questionContent}>
            <View style={styles.questionTypeBadge}>
              <Text style={[styles.questionTypeText, { color: theme.colors.primary }]}
              >
                {currentQuestion.type === 'vocabulary' ? '词汇' :
                  currentQuestion.type === 'grammar' ? '语法' : '阅读'}
              </Text>
            </View>

            <Text style={[
              styles.questionText,
              { color: theme.colors.text, fontWeight: theme.typography.fontWeight.semibold }
            ]}>
              {currentQuestion.question}
            </Text>

            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, index) => {
                const isAnswered = answers.some(a => a.questionId === currentQuestion.id);
                const userAnswer = answers.find(a => a.questionId === currentQuestion.id);
                const isSelected = userAnswer?.selected === index;
                const isCorrect = index === currentQuestion.correctAnswer;

                let optionStyle = {};
                if (isAnswered) {
                  if (isSelected && isCorrect) {
                    optionStyle = { backgroundColor: theme.colors.success + '20', borderColor: theme.colors.success };
                  } else if (isSelected && !isCorrect) {
                    optionStyle = { backgroundColor: theme.colors.error + '20', borderColor: theme.colors.error };
                  } else if (isCorrect) {
                    optionStyle = { backgroundColor: theme.colors.success + '20', borderColor: theme.colors.success };
                  }
                }

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      },
                      optionStyle,
                    ]}
                    onPress={() => !isAnswered && selectAnswer(index)}
                    disabled={isAnswered}
                  >
                    <Text style={[
                      styles.optionLabel,
                      { color: isSelected ? theme.colors.primary : theme.colors.textSecondary }
                    ]}>
                      {String.fromCharCode(65 + index)}
                    </Text>
                    <Text style={[
                      styles.optionText,
                      { color: theme.colors.text }
                    ]}>
                      {option}
                    </Text>
                    {isAnswered && isCorrect && (
                      <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                    )}
                    {isAnswered && isSelected && !isCorrect && (
                      <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        </AnimatedView>

        {isSubmitting && (
          <View style={styles.submittingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.submittingText, { color: theme.colors.textSecondary }]}>
              正在分析您的水平...
            </Text>
          </View>
        )}
      </AnimatedView>
    );
  };

  // 结果页面
  const renderResult = () => {
    if (!result) return null;

    const levelDescription = ProficiencyTest.getLevelDescription(result.level);

    return (
      <AnimatedView entering={FadeIn} style={styles.resultContainer}>
        <LinearGradient
          colors={theme.colors.primaryGradientFull as [string, string, string]}
          style={styles.resultHeader}
        >
          <Ionicons name="trophy" size={48} color="#FFFFFF" />
          <Text style={styles.resultLevel}>{levelDescription}</Text>
          <Text style={styles.resultScore}>测试得分: {Math.round(result.score)}%</Text>
        </LinearGradient>

        <ScrollView style={styles.resultContent} showsVerticalScrollIndicator={false}>
          {/* 词汇量估算 */}
          <Card variant="elevated" style={styles.statCard}>
            <View style={styles.statHeader}>
              <Ionicons name="book-outline" size={24} color={theme.colors.primary} />
              <Text style={[
                styles.statTitle,
                { color: theme.colors.text, fontWeight: theme.typography.fontWeight.semibold }
              ]}>
                预估词汇量
              </Text>
            </View>
            <Text style={[
              styles.vocabSize,
              { color: theme.colors.primary, fontWeight: theme.typography.fontWeight.bold }
            ]}>
              {result.vocabularySize.toLocaleString()}
            </Text>
            <Text style={[styles.vocabLabel, { color: theme.colors.textSecondary }]}>
              单词
            </Text>
          </Card>

          {/* 推荐学习重点 */}
          <Card variant="elevated" style={styles.focusCard}>
            <View style={styles.statHeader}>
              <Ionicons name="bulb-outline" size={24} color={theme.colors.warning} />
              <Text style={[
                styles.statTitle,
                { color: theme.colors.text, fontWeight: theme.typography.fontWeight.semibold }
              ]}>
                推荐学习重点
              </Text>
            </View>
            <View style={styles.focusList}>
              {result.recommendedFocus.map((focus, index) => (
                <View key={index} style={styles.focusItem}>
                  <View style={[styles.focusDot, { backgroundColor: theme.colors.primary }]} />
                  <Text style={[styles.focusText, { color: theme.colors.textSecondary }]}>
                    {focus}
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          {/* 说明 */}
          <View style={styles.noteContainer}>
            <Ionicons name="information-circle-outline" size={16} color={theme.colors.textTertiary} />
            <Text style={[styles.noteText, { color: theme.colors.textTertiary }]}>
              您可以在设置中随时重新测试以更新您的水平评估
            </Text>
          </View>
        </ScrollView>

        <View style={styles.resultActions}>
          <Button
            title="开始使用"
            onPress={completeTest}
            variant="primary"
            size="lg"
            style={styles.completeButton}
          />
          <TouchableOpacity onPress={retakeTest} style={styles.retakeButton}>
            <Text style={[styles.retakeText, { color: theme.colors.primary }]}>
              重新测试
            </Text>
          </TouchableOpacity>
        </View>
      </AnimatedView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        {currentStep === 'intro' && renderIntro()}
        {currentStep === 'testing' && renderTesting()}
        {currentStep === 'result' && renderResult()}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  // Intro styles
  introContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  introTitle: {
    fontSize: 28,
    marginBottom: 16,
    textAlign: 'center',
  },
  introDescription: {
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderRadius: 12,
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 15,
  },
  startButton: {
    width: '100%',
    marginBottom: 16,
  },
  skipButton: {
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
  },
  // Testing styles
  testingContainer: {
    flex: 1,
    padding: 20,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'right',
  },
  questionCard: {
    flex: 1,
  },
  questionContent: {
    padding: 24,
  },
  questionTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  questionTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 18,
    lineHeight: 28,
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  optionLabel: {
    width: 28,
    fontSize: 16,
    fontWeight: '600',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
  },
  submittingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submittingText: {
    marginTop: 16,
    fontSize: 16,
  },
  // Result styles
  resultContainer: {
    flex: 1,
  },
  resultHeader: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  resultLevel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  resultScore: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
  resultContent: {
    flex: 1,
    padding: 20,
  },
  statCard: {
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 16,
    marginLeft: 8,
  },
  vocabSize: {
    fontSize: 48,
  },
  vocabLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  focusCard: {
    padding: 20,
    marginBottom: 16,
  },
  focusList: {
    marginTop: 12,
  },
  focusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  focusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  focusText: {
    fontSize: 15,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  noteText: {
    fontSize: 12,
    marginLeft: 6,
  },
  resultActions: {
    padding: 20,
    paddingBottom: 32,
  },
  completeButton: {
    marginBottom: 12,
  },
  retakeButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  retakeText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
