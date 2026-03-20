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
  FadeInUp,
  SlideInUp,
  SlideOutDown,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width - 32, 380);

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
  onMarkAsMastered?: () => void;
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
  onMarkAsMastered,
}: WordDetailCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 20, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 200 });
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
    scale.value = withSpring(0.95, { damping: 20 });
    opacity.value = withTiming(0, { duration: 150 });
    setTimeout(onClose, 150);
  };

  const handleAddToVocab = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAddToVocab();
  };

  return (
    <View style={styles.overlay}>
      <BlurView
        intensity={30}
        tint={theme.isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />

      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={handleClose}
      />

      <Animated.View
        entering={SlideInUp.springify().damping(20).stiffness(200)}
        exiting={SlideOutDown.duration(150)}
        style={[
          styles.card,
          cardAnimatedStyle,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        {/* 顶部操作栏 */}
        <View style={styles.header}>
          {isNew && (
            <View style={[styles.newTag, { backgroundColor: theme.colors.error }]}>
            </View>
          )}
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* 单词区域 */}
        <View style={styles.wordArea}>
          <Text style={[styles.word, { color: theme.colors.text }]}>{word}</Text>

          <View style={styles.metaRow}>
            {phonetic && (
              <Text style={[styles.phonetic, { color: theme.colors.textSecondary }]}>
                {phonetic}
              </Text>
            )}
            {pos && (
              <View style={[styles.posTag, { backgroundColor: theme.colors.primary + '15' }]}>
                <Text style={[styles.posText, { color: theme.colors.primary }]}>{pos}</Text>
              </View>
            )}
          </View>
        </View>

        {/* 释义区域 */}
        <View style={[styles.section, { backgroundColor: theme.colors.background }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="text-outline" size={14} color={theme.colors.textTertiary} />
            <Text style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}>释义</Text>
          </View>
          <Text style={[styles.definition, { color: theme.colors.text }]}>
            {definition || '暂无释义'}
          </Text>
        </View>

        {/* 语境解释 */}
        {contextExplanation && (
          <Animated.View entering={FadeInUp.delay(100)} style={[styles.section, { backgroundColor: theme.colors.background }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={theme.colors.textTertiary} />
              <Text style={[styles.sectionLabel, { color: theme.colors.textTertiary }]}>语境</Text>
            </View>
            <Text style={[styles.context, { color: theme.colors.textSecondary }]}>
              {contextExplanation}
            </Text>
          </Animated.View>
        )}

        {/* 底部操作栏 */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: theme.colors.primary + '12' }]}
            onPress={handleSpeak}
          >
            <Ionicons name="volume-high-outline" size={20} color={theme.colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainBtn, { backgroundColor: theme.colors.primary }]}
            onPress={handleAddToVocab}
          >
            <Ionicons name="bookmark-outline" size={18} color="#FFF" />
            <Text style={styles.mainBtnText}>加入生词本</Text>
          </TouchableOpacity>

          {onMarkAsMastered && (
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: theme.colors.success + '15' }]}
              onPress={onMarkAsMastered}
              onLongPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onMarkAsMastered();
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.success} />
            </TouchableOpacity>
          )}

          {onViewDetails && (
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: theme.colors.surfaceSecondary }]}
              onPress={onViewDetails}
            >
              <Ionicons name="arrow-forward" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  newTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  newTagText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordArea: {
    marginBottom: 20,
  },
  word: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  phonetic: {
    fontSize: 15,
    fontWeight: '500',
  },
  posTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  posText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  definition: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  context: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    gap: 6,
  },
  mainBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
