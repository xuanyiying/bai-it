/**
 * 认证服务
 * 支持 Google 和 Apple 第三方登录
 */

import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { storage } from './storage';

WebBrowser.maybeCompleteAuthSession();

const AUTH_STORAGE_KEY = 'auth_user';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  photoUrl?: string;
  provider: 'google' | 'apple';
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

// Google OAuth 配置
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';

// 使用 discovery 文档
const googleDiscovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

/**
 * 认证服务
 */
export class AuthService {
  /**
   * 获取 Google 登录配置
   */
  private static getGoogleConfig() {
    const clientId = Platform.OS === 'ios' && GOOGLE_IOS_CLIENT_ID
      ? GOOGLE_IOS_CLIENT_ID
      : GOOGLE_CLIENT_ID;

    return {
      clientId,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'com.baiit.mobile',
        path: 'auth',
      }),
    };
  }

  /**
   * Google 登录
   */
  static async signInWithGoogle(): Promise<AuthUser | null> {
    try {
      const config = this.getGoogleConfig();

      const request = new AuthSession.AuthRequest({
        clientId: config.clientId,
        scopes: config.scopes,
        redirectUri: config.redirectUri,
        responseType: AuthSession.ResponseType.Token,
        usePKCE: false,
      });

      const discovery = await AuthSession.fetchDiscoveryAsync('https://accounts.google.com');
      const result = await request.promptAsync(discovery);

      if (result.type === 'success' && result.authentication) {
        const { accessToken } = result.authentication;

        // 获取用户信息
        const userInfo = await this.fetchGoogleUserInfo(accessToken);

        const user: AuthUser = {
          id: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name,
          photoUrl: userInfo.picture,
          provider: 'google',
          accessToken,
          expiresAt: Date.now() + 3600 * 1000, // 1小时
        };

        await this.saveUser(user);
        return user;
      }

      return null;
    } catch (error) {
      console.error('Google 登录失败:', error);
      throw error;
    }
  }

  /**
   * 获取 Google 用户信息
   */
  private static async fetchGoogleUserInfo(accessToken: string) {
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      throw new Error('获取用户信息失败');
    }

    return await response.json();
  }

  /**
   * Apple 登录
   */
  static async signInWithApple(): Promise<AuthUser | null> {
    try {
      // 检查是否支持 Apple 登录
      const isAvailable = await AppleAuthentication.isAvailableAsync();

      if (!isAvailable) {
        throw new Error('此设备不支持 Apple 登录');
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential) {
        const user: AuthUser = {
          id: credential.user,
          email: credential.email || '',
          name: credential.fullName
            ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
            : 'Apple User',
          provider: 'apple',
          accessToken: credential.identityToken || '',
          expiresAt: Date.now() + 3600 * 1000,
        };

        await this.saveUser(user);
        return user;
      }

      return null;
    } catch (error) {
      // 用户取消登录
      if ((error as any).code === 'ERR_REQUEST_CANCELED') {
        return null;
      }
      console.error('Apple 登录失败:', error);
      throw error;
    }
  }

  /**
   * 保存用户信息
   */
  static async saveUser(user: AuthUser): Promise<void> {
    await storage.set(AUTH_STORAGE_KEY, user);
  }

  /**
   * 获取当前用户
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    const user = await storage.get<AuthUser>(AUTH_STORAGE_KEY);

    if (!user) return null;

    // 检查 token 是否过期
    if (Date.now() > user.expiresAt) {
      // Token 过期，清除用户数据
      await this.signOut();
      return null;
    }

    return user;
  }

  /**
   * 检查是否已登录
   */
  static async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
  }

  /**
   * 登出
   */
  static async signOut(): Promise<void> {
    const user = await this.getCurrentUser();

    if (user?.provider === 'google') {
      // 撤销 Google token
      try {
        await fetch('https://oauth2.googleapis.com/revoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `token=${user.accessToken}`,
        });
      } catch (error) {
        console.error('撤销 Google token 失败:', error);
      }
    }

    await storage.remove(AUTH_STORAGE_KEY);
  }

  /**
   * 刷新用户信息
   */
  static async refreshUser(): Promise<AuthUser | null> {
    const user = await this.getCurrentUser();

    if (!user) return null;

    if (user.provider === 'google') {
      try {
        const userInfo = await this.fetchGoogleUserInfo(user.accessToken);
        const updatedUser: AuthUser = {
          ...user,
          email: userInfo.email,
          name: userInfo.name,
          photoUrl: userInfo.picture,
        };
        await this.saveUser(updatedUser);
        return updatedUser;
      } catch (error) {
        console.error('刷新用户信息失败:', error);
        return user;
      }
    }

    return user;
  }
}
