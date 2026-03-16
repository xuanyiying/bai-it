import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { themeList } from '../themes';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { staggerDelay } from '../utils/animations';

export function SettingsScreen() {
  const { theme, themeName, setTheme } = useTheme();
  const { t, currentLanguage, setLanguage, languages } = useLanguage();

  const handleThemeChange = async (name: 'light' | 'dark' | 'ocean') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setTheme(name);
  };

  const handleLanguageChange = async (code: 'zh-CN' | 'en-US' | 'ja-JP') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setLanguage(code);
  };

  const getThemeLabel = (name: string) => {
    const themeItem = themeList.find(t => t.name === name);
    if (!themeItem) return name;
    
    switch (currentLanguage) {
      case 'en-US':
        return themeItem.labelEn;
      case 'ja-JP':
        return themeItem.labelJa;
      default:
        return themeItem.label;
    }
  };

  const getThemeIcon = (name: string): keyof typeof Ionicons.glyphMap => {
    switch (name) {
      case 'light':
        return 'sunny';
      case 'dark':
        return 'moon';
      case 'ocean':
        return 'water';
      default:
        return 'color-palette';
    }
  };

  const renderLanguageItem = (lang: typeof languages[0], index: number) => {
    const isSelected = currentLanguage === lang.code;
    
    return (
      <Animated.View
        key={lang.code}
        entering={FadeInDown.delay(staggerDelay(index, 50)).springify()}
      >
        <TouchableOpacity
          style={[
            styles.item,
            {
              backgroundColor: isSelected ? theme.colors.primary + '10' : 'transparent',
              borderRadius: theme.borderRadius.lg,
            },
          ]}
          onPress={() => handleLanguageChange(lang.code as 'zh-CN' | 'en-US' | 'ja-JP')}
        >
          <View style={styles.itemLeft}>
            <View style={[
              styles.itemIcon,
              { backgroundColor: isSelected ? theme.colors.primary + '20' : theme.colors.surfaceSecondary }
            ]}>
              <Text style={styles.flagEmoji}>
                {lang.code === 'zh-CN' ? '🇨🇳' : lang.code === 'en-US' ? '🇺🇸' : '🇯🇵'}
              </Text>
            </View>
            <View>
              <Text style={[
                styles.itemLabel, 
                { 
                  color: theme.colors.text,
                  fontWeight: theme.typography.fontWeight.semibold,
                }
              ]}>
                {lang.nativeName}
              </Text>
              <Text style={[
                styles.itemSubtext, 
                { 
                  color: theme.colors.textSecondary,
                  fontSize: theme.typography.fontSize.sm,
                }
              ]}>
                {lang.name}
              </Text>
            </View>
          </View>
          {isSelected && (
            <View style={[styles.checkIcon, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderThemeItem = (themeItem: typeof themeList[0], index: number) => {
    const isSelected = themeName === themeItem.name;
    
    return (
      <Animated.View
        key={themeItem.name}
        entering={FadeInDown.delay(staggerDelay(index + languages.length, 50)).springify()}
      >
        <TouchableOpacity
          style={[
            styles.item,
            {
              backgroundColor: isSelected ? theme.colors.primary + '10' : 'transparent',
              borderRadius: theme.borderRadius.lg,
            },
          ]}
          onPress={() => handleThemeChange(themeItem.name)}
        >
          <View style={styles.itemLeft}>
            <View style={[
              styles.itemIcon,
              { backgroundColor: isSelected ? theme.colors.primary + '20' : theme.colors.surfaceSecondary }
            ]}>
              <Ionicons 
                name={getThemeIcon(themeItem.name)} 
                size={20} 
                color={isSelected ? theme.colors.primary : theme.colors.textSecondary} 
              />
            </View>
            <View style={styles.themeInfo}>
              <Text style={[
                styles.itemLabel, 
                { 
                  color: theme.colors.text,
                  fontWeight: theme.typography.fontWeight.semibold,
                }
              ]}>
                {getThemeLabel(themeItem.name)}
              </Text>
              {themeItem.name === 'dark' && (
                <Badge label="Dark Mode" variant="primary" size="xs" />
              )}
              {themeItem.name === 'ocean' && (
                <Badge label="Glass" variant="success" size="xs" />
              )}
            </View>
          </View>
          {isSelected && (
            <View style={[styles.checkIcon, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.delay(50)}>
          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle, 
              { 
                color: theme.colors.textSecondary,
                fontWeight: theme.typography.fontWeight.semibold,
                fontSize: theme.typography.fontSize.xs,
              }
            ]}>
              {t('settings.language')}
            </Text>
            <Card variant="elevated" padding="sm">
              {languages.map((lang, index) => renderLanguageItem(lang, index))}
            </Card>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle, 
              { 
                color: theme.colors.textSecondary,
                fontWeight: theme.typography.fontWeight.semibold,
                fontSize: theme.typography.fontSize.xs,
              }
            ]}>
              {t('settings.theme')}
            </Text>
            <Card variant="elevated" padding="sm">
              {themeList.map((themeItem, index) => renderThemeItem(themeItem, index))}
            </Card>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle, 
              { 
                color: theme.colors.textSecondary,
                fontWeight: theme.typography.fontWeight.semibold,
                fontSize: theme.typography.fontSize.xs,
              }
            ]}>
              About
            </Text>
            <Card variant="elevated">
              <View style={styles.aboutContent}>
                <View style={[styles.appIcon, { backgroundColor: theme.colors.primary }]}>
                  <Ionicons name="book" size={32} color="#FFFFFF" />
                </View>
                <Text style={[
                  styles.appName, 
                  { 
                    color: theme.colors.text,
                    fontWeight: theme.typography.fontWeight.bold,
                  }
                ]}>
                  Bai-it Mobile
                </Text>
                <Text style={[
                  styles.version, 
                  { 
                    color: theme.colors.textSecondary,
                    fontSize: theme.typography.fontSize.sm,
                  }
                ]}>
                  Version 1.0.0
                </Text>
                <Text style={[
                  styles.description, 
                  { 
                    color: theme.colors.textTertiary,
                    fontSize: theme.typography.fontSize.sm,
                    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
                  }
                ]}>
                  Smart English Reading Assistant
                </Text>
              </View>
            </Card>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginVertical: 2,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagEmoji: {
    fontSize: 22,
  },
  itemLabel: {
    fontSize: 16,
  },
  itemSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  themeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 22,
  },
  version: {
    fontSize: 14,
    marginTop: 6,
  },
  description: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
});
