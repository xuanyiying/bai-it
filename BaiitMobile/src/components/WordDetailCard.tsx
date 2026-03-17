import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInUp,
  SlideInUp,
  SlideOutDown,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

interface WordDetailCardProps {
  word: string;
  definition?: string;
  pos?: string;
  phonetic?: string;
  isNew?: boolean;
  contextExplanation?: string;
  onClose: () => void;
  onSpeak: () => void;
  onAddToVocab: () => void;
  onViewDetails?: () => void;
}

export function WordDetailCard({
  word,
  definition,
  pos,
  phonetic,
  isNew = false,
  contextExplanation,
  onClose,
  onSpeak,
  onAddToVocab,
  onViewDetails,
}: WordDetailCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 250 });
  }, []);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handleSpeak = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSpeak();
  };

  const handleClose = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.9, { damping: 15 });
    opacity.value = withTiming(0, { duration: 200 });
    setTimeout(onClose, 200);
  };

  const handleAddToVocab = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAddToVocab();
  };

  return (
    <View style={styles.overlay}>
      {/* 背景模糊层 */}
      <BlurView
        intensity={20}
        tint={theme.isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />

      {/* 点击关闭区域 */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={handleClose}
      />

      {/* 卡片容器 */}
      <Animated.View
        entering={SlideInUp.springify().damping(15).stiffness(150)}
        exiting={SlideOutDown.duration(200)}
        style={[
          styles.cardContainer,
          cardAnimatedStyle,
          {
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        {/* 顶部装饰条 */}
        <View style={[styles.accentBar, { backgroundColor: isNew ? theme.colors.error : theme.colors.primary }]} />

        {/* 关闭按钮 */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Ionicons name="close" size={20} color={theme.colors.textTertiary} />
        </TouchableOpacity>

        {/* 单词头部区域 */}
        <View style={styles.headerSection}>
          {/* NEW 标签 */}
          {isNew && (
            <Animated.View
              entering={FadeIn.delay(100)}
              style={[styles.newBadge, { backgroundColor: theme.colors.error + '15' }]}
            >
              <View style={[styles.newDot, { backgroundColor: theme.colors.error }]} />
              <Text style={[styles.newBadgeText, { color: theme.colors.error }]}>
                NEW
              </Text>
            </Animated.View>
          )}

          {/* 单词主体 */}
          <View style={styles.wordSection}>
            <Text style={[styles.word, { color: theme.colors.text }]}>
              {word}
            </Text>

            {/* 音标和朗读按钮 */}
            <View style={styles.phoneticRow}>
              {phonetic ? (
                <Text style={[styles.phonetic, { color: theme.colors.textSecondary }]}>
                  {phonetic}
                </Text>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.speakButton,
                  { backgroundColor: theme.colors.primary + '12' }
                ]}
                onPress={handleSpeak}
                activeOpacity={0.7}
              >
                <Ionicons name="volume-medium" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 词性标签 */}
          {pos && (
            <Animated.View
              entering={FadeInUp.delay(150)}
              style={[styles.posBadge, { backgroundColor: theme.colors.primary + '10' }]}
            >
              <Text style={[styles.posText, { color: theme.colors.primary }]}>
                {pos}
              </Text>
            </Animated.View>
          )}
        </View>

        {/* 分隔线 */}
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        {/* 释义区域 */}
        <View style={styles.definitionSection}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}>
            释义
          </Text>
          <Text style={[styles.definition, { color: theme.colors.text }]}
          >
            {definition || '暂无释义'}
          </Text>
        </View>

        {/* 语境解释 */}
        {contextExplanation && (
          <Animated.View
            entering={FadeInUp.delay(200)}
            style={styles.contextSection}
          >
            <View style={styles.contextHeader}>
              <Ionicons name="chatbubble-outline" size={14} color={theme.colors.textTertiary} />
              <Text style={[styles.contextLabel, { color: theme.colors.textTertiary }]}>
                语境
              </Text>
            </View>
            <Text style={[styles.contextText, { color: theme.colors.textSecondary }]}>
              {contextExplanation}
            </Text>
          </Animated.View>
        )}

        {/* 操作按钮区域 */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.primaryButton,
              { backgroundColor: theme.colors.primary }
            ]}
            onPress={handleAddToVocab}
            activeOpacity={0.8}
          >
            <Ionicons name="bookmark-outline" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>加入生词本</Text>
          </TouchableOpacity>

          {onViewDetails && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.secondaryButton,
                { backgroundColor: theme.colors.surfaceSecondary }
              ]}
              onPress={onViewDetails}
              activeOpacity={0.8}
            >
              <Ionicons name="open-outline" size={18} color={theme.colors.text} />
              <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>
                查看详情
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  cardContainer: {
    width: CARD_WIDTH,
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  newDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  wordSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  word: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
    flex: 1,
  },
  phoneticRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  phonetic: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.7,
  },
  speakButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  posText: {
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 20,
    opacity: 0.5,
  },
  definitionSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  definition: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '500',
  },
  contextSection: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  contextLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  contextText: {
    fontSize: 14,
    lineHeight: 22,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    gap: 8,
  },
  primaryButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
