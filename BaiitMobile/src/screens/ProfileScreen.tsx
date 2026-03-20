import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../services/storage';
import { themeList } from '../themes';
import { AIStorageConfig, hasValidAIConfig, BUILT_IN_AI_CONFIG } from '../types';

const AI_CONFIG_KEY = 'ai_config';

export function ProfileScreen() {
  const { theme, themeName, setTheme } = useTheme();
  const { currentLanguage, setLanguage, languages } = useLanguage();
  const { user, isAuthenticated, signOut } = useAuth();

  const [hasAIConfig, setHasAIConfig] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIStorageConfig>({
    useBuiltIn: true,
  });

  // Modals
  const [showAIModal, setShowAIModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [tempConfig, setTempConfig] = useState<AIStorageConfig>(aiConfig);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const config = await storage.get<AIStorageConfig>(AI_CONFIG_KEY);
      if (config) {
        setAiConfig(config);
        setHasAIConfig(hasValidAIConfig(config));
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  const saveAIConfig = async () => {
    try {
      await storage.set(AI_CONFIG_KEY, tempConfig);
      setAiConfig(tempConfig);
      setHasAIConfig(hasValidAIConfig(tempConfig));
      setShowAIModal(false);
    } catch (error) {
      Alert.alert('错误', '保存配置失败');
    }
  };

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('退出登录', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      { text: '退出', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleThemeChange = async (name: 'light' | 'dark' | 'ocean') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setTheme(name);
    setShowThemeModal(false);
  };

  const handleLanguageChange = async (code: 'zh-CN' | 'en-US' | 'ja-JP') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setLanguage(code);
    setShowLangModal(false);
  };

  const getThemeIcon = (name: string) => {
    switch (name) {
      case 'light': return 'sunny' as const;
      case 'dark': return 'moon' as const;
      case 'ocean': return 'water' as const;
      default: return 'color-palette' as const;
    }
  };

  const getThemeLabel = (name: string) => {
    const item = themeList.find(t => t.name === name);
    if (!item) return name;
    switch (currentLanguage) {
      case 'en-US': return item.labelEn;
      case 'ja-JP': return item.labelJa;
      default: return item.label;
    }
  };

  const getFlag = (code: string) => {
    if (code === 'zh-CN') return '🇨🇳';
    if (code === 'en-US') return '🇺🇸';
    return '🇯🇵';
  };

  const mainMenuItems = [
    {
      icon: 'sparkles' as const,
      title: 'AI 模型配置',
      subtitle: hasAIConfig ? '已配置' : '未配置',
      onPress: () => { setTempConfig(aiConfig); setShowAIModal(true); },
      showBadge: !hasAIConfig,
    },
  ];

  const prefMenuItems = [
    {
      icon: 'color-palette-outline' as const,
      title: '主题',
      subtitle: getThemeLabel(themeName),
      onPress: () => setShowThemeModal(true),
    },
    {
      icon: 'language-outline' as const,
      title: '语言',
      subtitle: languages.find(l => l.code === currentLanguage)?.nativeName || '',
      onPress: () => setShowLangModal(true),
    },
  ];

  const renderMenuItem = (item: any, key: string | number, total: number) => {
    const index = typeof key === 'string' ? parseInt(key.split('-')[1] || '0') : key;
    return (
      <TouchableOpacity
        key={typeof key === 'string' ? key : `${item.title}-${key}`}
        style={[
          styles.menuItem,
          index < total - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
        ]}
        onPress={item.onPress}
      >
        <Ionicons name={item.icon} size={22} color={theme.colors.primary} />
        <View style={styles.menuText}>
          <Text style={[styles.menuTitle, { color: theme.colors.text }]}>{item.title}</Text>
          <Text style={[styles.menuSubtitle, { color: theme.colors.textSecondary }]}>{item.subtitle}</Text>
        </View>
        <View style={styles.menuRight}>
          {item.showBadge && <View style={[styles.dot, { backgroundColor: theme.colors.error }]} />}
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 用户信息 */}
        <View style={[styles.userCard, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="person" size={36} color="#FFFFFF" />
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.colors.text }]}>
              {isAuthenticated ? user?.name || 'User' : '游客'}
            </Text>
            <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
              {isAuthenticated ? user?.email || '' : '登录以同步数据'}
            </Text>
          </View>
        </View>

        {/* 主要功能 */}
        <View style={[styles.menuGroup, { backgroundColor: theme.colors.surface }]}>
          {mainMenuItems.map((item, index) => renderMenuItem(item, `main-${index}`, mainMenuItems.length))}
        </View>

        {/* 偏好设置 */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>偏好设置</Text>
        <View style={[styles.menuGroup, { backgroundColor: theme.colors.surface }]}>
          {prefMenuItems.map((item, index) => renderMenuItem(item, `pref-${index}`, prefMenuItems.length))}
        </View>

        {/* 退出登录 */}
        {isAuthenticated && (
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: theme.colors.error + '10' }]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={18} color={theme.colors.error} />
            <Text style={[styles.logoutText, { color: theme.colors.error }]}>退出登录</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.version, { color: theme.colors.textTertiary }]}>Bai-it Mobile v1.0.0</Text>
      </ScrollView>

      {/* AI 配置弹窗 */}
      <Modal visible={showAIModal} animationType="slide" transparent={false}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={() => setShowAIModal(false)}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>AI 模型配置</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView style={styles.modalBody}>
            {/* 配置方式选择 */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>配置方式</Text>

              {/* 内置配置选项 */}
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  { borderBottomColor: theme.colors.border },
                  tempConfig.useBuiltIn && { backgroundColor: theme.colors.primary + '10' }
                ]}
                onPress={() => setTempConfig({ ...tempConfig, useBuiltIn: true })}
              >
                <View style={styles.optionLeft}>
                  <Text style={[styles.optionText, { color: theme.colors.text }]}>使用内置配置</Text>
                  <Text style={[styles.optionSubtext, { color: theme.colors.textSecondary }]}>
                    {BUILT_IN_AI_CONFIG ? '已配置' : '未配置'}
                  </Text>
                </View>
                {tempConfig.useBuiltIn && <Ionicons name="checkmark" size={20} color={theme.colors.primary} />}
              </TouchableOpacity>

              {/* 自定义配置选项 */}
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  { borderBottomColor: theme.colors.border },
                  !tempConfig.useBuiltIn && { backgroundColor: theme.colors.primary + '10' }
                ]}
                onPress={() => setTempConfig({ ...tempConfig, useBuiltIn: false })}
              >
                <View style={styles.optionLeft}>
                  <Text style={[styles.optionText, { color: theme.colors.text }]}>自定义配置</Text>
                  <Text style={[styles.optionSubtext, { color: theme.colors.textSecondary }]}>
                    {tempConfig.userConfig?.apiKey ? '已填写' : '未填写'}
                  </Text>
                </View>
                {!tempConfig.useBuiltIn && <Ionicons name="checkmark" size={20} color={theme.colors.primary} />}
              </TouchableOpacity>
            </View>

            {/* 自定义配置表单 */}
            {!tempConfig.useBuiltIn && (
              <View style={styles.customSection}>
                <Text style={[styles.sectionDesc, { color: theme.colors.textSecondary }]}>
                  填写您的 AI Provider 配置（OpenAI 兼容格式）
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>API Key *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
                    value={tempConfig.userConfig?.apiKey || ''}
                    onChangeText={(text) => setTempConfig({
                      ...tempConfig,
                      userConfig: { ...(tempConfig.userConfig || { baseUrl: '', model: '' }), apiKey: text }
                    })}
                    placeholder="sk-..."
                    placeholderTextColor={theme.colors.textTertiary}
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Base URL *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
                    value={tempConfig.userConfig?.baseUrl || ''}
                    onChangeText={(text) => setTempConfig({
                      ...tempConfig,
                      userConfig: { ...(tempConfig.userConfig || { apiKey: '', model: '' }), baseUrl: text }
                    })}
                    placeholder="https://api.openai.com/v1"
                    placeholderTextColor={theme.colors.textTertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Model *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderColor: theme.colors.border }]}
                    value={tempConfig.userConfig?.model || ''}
                    onChangeText={(text) => setTempConfig({
                      ...tempConfig,
                      userConfig: { ...(tempConfig.userConfig || { apiKey: '', baseUrl: '' }), model: text }
                    })}
                    placeholder="gpt-4, gpt-3.5-turbo..."
                    placeholderTextColor={theme.colors.textTertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
            )}
          </ScrollView>
          {/* 底部保存按钮 */}
          <View style={[styles.modalFooter, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
              onPress={saveAIConfig}
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>保存</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* 主题选择弹窗 */}
      <Modal visible={showThemeModal} animationType="slide" transparent={false}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={() => setShowThemeModal(false)}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>选择主题</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView style={styles.modalBody}>
            {themeList.map((item) => (
              <TouchableOpacity
                key={item.name}
                style={[styles.optionItem, { borderBottomColor: theme.colors.border }, themeName === item.name && { backgroundColor: theme.colors.primary + '10' }]}
                onPress={() => handleThemeChange(item.name as 'light' | 'dark' | 'ocean')}
              >
                <Ionicons name={getThemeIcon(item.name)} size={22} color={theme.colors.primary} />
                <Text style={[styles.optionText, { color: theme.colors.text }]}>{getThemeLabel(item.name)}</Text>
                {themeName === item.name && <Ionicons name="checkmark" size={20} color={theme.colors.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 语言选择弹窗 */}
      <Modal visible={showLangModal} animationType="slide" transparent={false}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={() => setShowLangModal(false)}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>选择语言</Text>
            <View style={{ width: 40 }} />
          </View>
          <ScrollView style={styles.modalBody}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.optionItem, { borderBottomColor: theme.colors.border }, currentLanguage === lang.code && { backgroundColor: theme.colors.primary + '10' }]}
                onPress={() => handleLanguageChange(lang.code as 'zh-CN' | 'en-US' | 'ja-JP')}
              >
                <Text style={styles.flagEmoji}>{getFlag(lang.code)}</Text>
                <Text style={[styles.optionText, { color: theme.colors.text }]}>{lang.nativeName}</Text>
                {currentLanguage === lang.code && <Ionicons name="checkmark" size={20} color={theme.colors.primary} />}
              </TouchableOpacity>
            ))}
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
  content: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  menuGroup: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuText: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
    marginBottom: 20,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
  },
  version: {
    fontSize: 12,
    textAlign: 'center',
  },
  // Modal styles
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
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalSave: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
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
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  optionLeft: {
    flex: 1,
    flexDirection: 'column',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
  },
  optionSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionDesc: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  customSection: {
    marginTop: 8,
  },
  flagEmoji: {
    fontSize: 22,
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  saveButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
