import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { RootStackParamList } from '../../App';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../contexts/AuthContext';
import { AuthService } from '../services/auth';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

const AnimatedView = Animated.createAnimatedComponent(View);

export function LoginScreen({ navigation }: LoginScreenProps) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const { theme } = useTheme();
  const { signInWithGoogle, signInWithApple } = useAuth();

  const handleGoogleSignIn = async () => {
    if (isGoogleLoading || isAppleLoading) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGoogleLoading(true);

    try {
      await signInWithGoogle();
      // 登录成功，导航到主页面
      navigation.replace('Main');
    } catch (error) {
      console.error('Google 登录失败:', error);
      Alert.alert('登录失败', 'Google 登录出现问题，请重试');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (isGoogleLoading || isAppleLoading) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsAppleLoading(true);

    try {
      await signInWithApple();
      // 登录成功，导航到主页面
      navigation.replace('Main');
    } catch (error) {
      console.error('Apple 登录失败:', error);
      Alert.alert('登录失败', 'Apple 登录出现问题，请重试');
    } finally {
      setIsAppleLoading(false);
    }
  };

  const handleSkip = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.replace('Main');
  };

  // 模拟登录（用于开发和测试）
  const handleMockSignIn = async () => {
    if (isGoogleLoading || isAppleLoading) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGoogleLoading(true);

    try {
      await AuthService.mockSignIn('google');
      navigation.replace('Main');
    } catch (error) {
      console.error('模拟登录失败:', error);
      Alert.alert('登录失败', '模拟登录出现问题');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={theme.colors.primaryGradientFull as [string, string, string]}
        style={styles.header}
      >
        <SafeAreaView edges={['top']} style={styles.headerContent}>
          <AnimatedView entering={FadeIn.delay(200)}>
            <View style={styles.logoContainer}>
              <Ionicons name="book-outline" size={64} color="#FFFFFF" />
            </View>
            <Text style={styles.appName}>掰 it</Text>
            <Text style={styles.tagline}>智能英语阅读助手</Text>
          </AnimatedView>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.content}>
        <AnimatedView entering={FadeInUp.delay(400)} style={styles.welcomeSection}>
          <Text style={[styles.welcomeTitle, { color: theme.colors.text }]}>
            欢迎使用
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: theme.colors.textSecondary }]}>
            登录以同步您的学习进度和生词本
          </Text>
        </AnimatedView>

        <AnimatedView entering={FadeInUp.delay(500)} style={styles.buttonsContainer}>
          {/* Google 登录按钮 */}
          <TouchableOpacity
            style={[styles.socialButton, { backgroundColor: '#FFFFFF' }]}
            onPress={handleGoogleSignIn}
            disabled={isGoogleLoading || isAppleLoading}
            activeOpacity={0.8}
          >
            {isGoogleLoading ? (
              <ActivityIndicator size="small" color="#4285F4" />
            ) : (
              <>
                <View style={styles.googleIcon}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={[styles.socialButtonText, { color: '#757575' }]}>
                  使用 Google 登录
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Apple 登录按钮（仅 iOS） */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.socialButton, { backgroundColor: '#000000' }]}
              onPress={handleAppleSignIn}
              disabled={isGoogleLoading || isAppleLoading}
              activeOpacity={0.8}
            >
              {isAppleLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                  <Text style={[styles.socialButtonText, { color: '#FFFFFF' }]}>
                    使用 Apple 登录
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* 跳过分隔线 */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            <Text style={[styles.dividerText, { color: theme.colors.textTertiary }]}>
              或者
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          </View>

          {/* 模拟登录按钮（仅开发环境显示） */}
          {__DEV__ && (
            <TouchableOpacity
              style={[styles.mockButton, { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary }]}
              onPress={handleMockSignIn}
              disabled={isGoogleLoading || isAppleLoading}
              activeOpacity={0.8}
            >
              <Ionicons name="bug-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.mockButtonText, { color: theme.colors.primary }]}>
                模拟登录（开发测试）
              </Text>
            </TouchableOpacity>
          )}

          {/* 跳过登录 */}
          <TouchableOpacity
            style={[styles.skipButton, { borderColor: theme.colors.border }]}
            onPress={handleSkip}
            disabled={isGoogleLoading || isAppleLoading}
          >
            <Text style={[styles.skipButtonText, { color: theme.colors.textSecondary }]}>
              暂不登录
            </Text>
          </TouchableOpacity>
        </AnimatedView>

        <AnimatedView entering={FadeIn.delay(600)} style={styles.termsContainer}>
          <Text style={[styles.termsText, { color: theme.colors.textTertiary }]}>
            登录即表示您同意我们的服务条款和隐私政策
          </Text>
        </AnimatedView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 320,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    flex: 1,
    padding: 32,
    paddingTop: 40,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  buttonsContainer: {
    gap: 16,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
    marginHorizontal: 16,
  },
  skipButton: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  mockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingHorizontal: 24,
    gap: 10,
  },
  mockButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  termsContainer: {
    marginTop: 'auto',
    paddingBottom: 16,
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
