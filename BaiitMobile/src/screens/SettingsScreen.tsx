import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../contexts/AuthContext';
import { themeList } from '../themes';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { staggerDelay } from '../utils/animations';
import { storage } from '../services/storage';
import { LLMConfig, ProviderKey, DEFAULT_PROVIDERS } from '../types';

const LLM_CONFIG_KEY = 'llm_config';

export function SettingsScreen() {
  const { theme, themeName, setTheme } = useTheme();
  const { t, currentLanguage, setLanguage, languages } = useLanguage();
  const { user, isAuthenticated, signOut } = useAuth();

  // LLM 配置状态
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
    format: 'openai-compatible',
    apiKey: '',
    baseUrl: 'https://api.openai.com',
    model: 'gpt-4o-mini',
  });
  const [showLLMModal, setShowLLMModal] = useState(false);
  const [tempConfig, setTempConfig] = useState<LLMConfig>(llmConfig);

  // 加载 LLM 配置
  useEffect(() => {
    loadLLMConfig();
  }, []);

  const loadLLMConfig = async () => {
    try {
      const saved = await storage.get<LLMConfig>(LLM_CONFIG_KEY);
      if (saved) {
        setLlmConfig(saved);
        setTempConfig(saved);
      }
    } catch (error) {
      console.error('加载 LLM 配置失败:', error);
    }
  };

  const saveLLMConfig = async () => {
    try {
      await storage.set(LLM_CONFIG_KEY, tempConfig);
      setLlmConfig(tempConfig);
      setShowLLMModal(false);
      Alert.alert('成功', 'LLM 配置已保存');
    } catch (error) {
      console.error('保存 LLM 配置失败:', error);
      Alert.alert('错误', '保存配置失败');
    }
  };

  const openLLMModal = () => {
    setTempConfig(llmConfig);
    setShowLLMModal(true);
  };

  const handleThemeChange = async (name: 'light' | 'dark' | 'ocean') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setTheme(name);
  };

  const handleSignOut = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      '退出登录',
      '确定要退出登录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '退出',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('登出失败:', error);
            }
          },
        },
      ]
    );
  };

  const handleLogin = () => {
    // 导航到登录页面需要访问 navigation，这里简化处理
    // 实际项目中应该使用 useNavigation hook
    Alert.alert('提示', '请重启应用以登录');
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

        {/* LLM Configuration Section */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              {
                color: theme.colors.textSecondary,
                fontWeight: theme.typography.fontWeight.semibold,
                fontSize: theme.typography.fontSize.xs,
              }
            ]}>
              AI 模型配置
            </Text>
            <Card variant="elevated" padding="sm">
              <TouchableOpacity
                style={styles.llmConfigItem}
                onPress={openLLMModal}
              >
                <View style={styles.llmConfigLeft}>
                  <View style={[styles.llmIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Ionicons name="sparkles" size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.llmConfigDetails}>
                    <Text style={[styles.llmConfigTitle, { color: theme.colors.text, fontWeight: theme.typography.fontWeight.semibold }]}>
                      LLM API 配置
                    </Text>
                    <Text style={[styles.llmConfigSubtitle, { color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm }]}>
                      {llmConfig.apiKey ? '已配置' : '未配置'}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            </Card>
          </View>
        </Animated.View>

        {/* Account Section */}
        <Animated.View entering={FadeInDown.delay(350).springify()}>
          <View style={styles.section}>
            <Text style={[
              styles.sectionTitle,
              {
                color: theme.colors.textSecondary,
                fontWeight: theme.typography.fontWeight.semibold,
                fontSize: theme.typography.fontSize.xs,
              }
            ]}>
              账户
            </Text>
            <Card variant="elevated" padding="sm">
              {isAuthenticated ? (
                <>
                  <View style={styles.accountInfo}>
                    <View style={[styles.accountIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                      <Ionicons name="person" size={20} color={theme.colors.primary} />
                    </View>
                    <View style={styles.accountDetails}>
                      <Text style={[styles.accountName, { color: theme.colors.text, fontWeight: theme.typography.fontWeight.semibold }]}>
                        {user?.name || 'User'}
                      </Text>
                      <Text style={[styles.accountEmail, { color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm }]}>
                        {user?.email}
                      </Text>
                      <View style={styles.providerBadge}>
                        <Ionicons
                          name={user?.provider === 'google' ? 'logo-google' : 'logo-apple'}
                          size={12}
                          color={theme.colors.textTertiary}
                        />
                        <Text style={[styles.providerText, { color: theme.colors.textTertiary, fontSize: theme.typography.fontSize.xs }]}>
                          {user?.provider === 'google' ? 'Google' : 'Apple'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.logoutButton, { borderTopColor: theme.colors.border }]}
                    onPress={handleSignOut}
                  >
                    <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
                    <Text style={[styles.logoutText, { color: theme.colors.error }]}>
                      退出登录
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.loginPrompt}
                  onPress={handleLogin}
                >
                  <View style={[styles.accountIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                    <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.accountDetails}>
                    <Text style={[styles.accountName, { color: theme.colors.text, fontWeight: theme.typography.fontWeight.semibold }]}>
                      未登录
                    </Text>
                    <Text style={[styles.accountEmail, { color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm }]}>
                      点击登录以同步数据
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
                </TouchableOpacity>
              )}
            </Card>
          </View>
        </Animated.View>
      </ScrollView>

      {/* LLM Configuration Modal */}
      <Modal
        visible={showLLMModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLLMModal(false)}
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={() => setShowLLMModal(false)} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.text, fontWeight: theme.typography.fontWeight.bold }]}>
              LLM API 配置
            </Text>
            <TouchableOpacity onPress={saveLLMConfig} style={styles.modalSaveButton}>
              <Text style={[styles.modalSaveText, { color: theme.colors.primary, fontWeight: theme.typography.fontWeight.semibold }]}>
                保存
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                API Base URL
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
                value={tempConfig.baseUrl}
                onChangeText={(text) => setTempConfig({ ...tempConfig, baseUrl: text })}
                placeholder="https://api.openai.com"
                placeholderTextColor={theme.colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={[styles.inputHint, { color: theme.colors.textTertiary }]}>
                例如: https://api.openai.com, https://api.deepseek.com
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                API Key
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
                value={tempConfig.apiKey}
                onChangeText={(text) => setTempConfig({ ...tempConfig, apiKey: text })}
                placeholder="sk-..."
                placeholderTextColor={theme.colors.textTertiary}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={[styles.inputHint, { color: theme.colors.textTertiary }]}>
                您的 OpenAI API Key 或其他兼容服务的密钥
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                模型名称
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
                value={tempConfig.model}
                onChangeText={(text) => setTempConfig({ ...tempConfig, model: text })}
                placeholder="gpt-4o-mini"
                placeholderTextColor={theme.colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={[styles.inputHint, { color: theme.colors.textTertiary }]}>
                例如: gpt-4o-mini, gpt-4, deepseek-chat
              </Text>
            </View>

            <View style={[styles.infoCard, { backgroundColor: theme.colors.primary + '10' }]}>
              <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                支持 OpenAI 兼容格式的 API，包括 DeepSeek、Kimi、Qwen 等
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountDetails: {
    marginLeft: 12,
    flex: 1,
  },
  accountName: {
    fontSize: 16,
  },
  accountEmail: {
    marginTop: 2,
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  providerText: {
    fontSize: 11,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
  },
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  // LLM Config Styles
  llmConfigItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  llmConfigLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  llmIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  llmConfigDetails: {
    marginLeft: 12,
    flex: 1,
  },
  llmConfigTitle: {
    fontSize: 16,
  },
  llmConfigSubtitle: {
    marginTop: 2,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    padding: 8,
    width: 44,
  },
  modalTitle: {
    fontSize: 17,
    flex: 1,
    textAlign: 'center',
  },
  modalSaveButton: {
    padding: 8,
    width: 60,
  },
  modalSaveText: {
    fontSize: 15,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    borderWidth: 1,
  },
  inputHint: {
    fontSize: 12,
    marginTop: 6,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});
