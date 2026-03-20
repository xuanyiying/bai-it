import { storage } from './storage';
import { AIMultiConfig, resolveAIConfig } from '../types';

const AI_CONFIG_KEY = 'AI_config';

export type SubscriptionPlan = 'monthly' | 'yearly' | 'lifetime';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'none';

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: number;
  expiryDate: number;
  autoRenew: boolean;
  paymentMethod?: string;
  transactionId?: string;
}

export interface SubscriptionProduct {
  id: string;
  plan: SubscriptionPlan;
  title: string;
  description: string;
  price: number;
  currency: string;
  period: string;
  features: string[];
  popular?: boolean;
}

const SUBSCRIPTION_KEY = 'user_subscription';

// 订阅产品配置
export const SUBSCRIPTION_PRODUCTS: SubscriptionProduct[] = [
  {
    id: 'monthly_plan',
    plan: 'monthly',
    title: '月度会员',
    description: '适合短期使用',
    price: 18,
    currency: 'CNY',
    period: '月',
    features: [
      '无限AI标注',
      '高级词典查询',
      '语境解析',
      '生词本同步',
      '优先客服支持',
    ],
  },
  {
    id: 'yearly_plan',
    plan: 'yearly',
    title: '年度会员',
    description: '最受欢迎',
    price: 128,
    currency: 'CNY',
    period: '年',
    features: [
      '无限AI标注',
      '高级词典查询',
      '语境解析',
      '生词本同步',
      '优先客服支持',
      '导出学习报告',
    ],
    popular: true,
  },
  {
    id: 'lifetime_plan',
    plan: 'lifetime',
    title: '终身会员',
    description: '一次购买，永久使用',
    price: 368,
    currency: 'CNY',
    period: '永久',
    features: [
      '所有年度会员功能',
      '终身免费更新',
      '专属标识',
      '优先体验新功能',
    ],
  },
];

export class SubscriptionService {
  /**
   * 获取当前订阅信息
   */
  static async getSubscription(): Promise<Subscription | null> {
    try {
      const subscription = await storage.get<Subscription>(SUBSCRIPTION_KEY);
      if (subscription) {
        // 检查是否过期
        if (subscription.status === 'active' && subscription.expiryDate < Date.now()) {
          subscription.status = 'expired';
          await this.saveSubscription(subscription);
        }
      }
      return subscription;
    } catch (error) {
      console.error('获取订阅信息失败:', error);
      return null;
    }
  }

  /**
   * 保存订阅信息
   */
  static async saveSubscription(subscription: Subscription): Promise<void> {
    await storage.set(SUBSCRIPTION_KEY, subscription);
  }

  /**
   * 检查是否有有效订阅
   */
  static async hasActiveSubscription(): Promise<boolean> {
    const subscription = await this.getSubscription();
    return subscription?.status === 'active';
  }

  /**
   * 检查是否可以使用AI功能
   * 有订阅 或 配置了自有API都可以使用
   */
  static async canUseAIFeatures(): Promise<{ can: boolean; reason?: string }> {
    const hasSubscription = await this.hasActiveSubscription();
    if (hasSubscription) {
      return { can: true };
    }

    const rawConfig = await storage.get<AIMultiConfig | { apiKey: string }>(AI_CONFIG_KEY);
    if (!rawConfig) {
      return {
        can: false,
        reason: '需要订阅会员或配置AI服务提供商'
      };
    }

    let hasApiKey = false;
    if ('activeProvider' in rawConfig) {
      const config = resolveAIConfig(rawConfig as AIMultiConfig);
      hasApiKey = !!(config?.apiKey && config.apiKey.length > 0);
    } else {
      hasApiKey = !!(rawConfig as { apiKey: string }).apiKey && (rawConfig as { apiKey: string }).apiKey.length > 0;
    }

    if (hasApiKey) {
      return { can: true };
    }

    return {
      can: false,
      reason: '需要订阅会员或配置AI服务提供商'
    };
  }

  /**
   * 购买订阅（模拟）
   */
  static async purchaseSubscription(plan: SubscriptionPlan): Promise<{ success: boolean; error?: string }> {
    try {
      // 模拟购买流程
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 生成订阅信息
      const now = Date.now();
      const subscription: Subscription = {
        id: `sub_${Date.now()}`,
        plan,
        status: 'active',
        startDate: now,
        expiryDate: this.calculateExpiryDate(plan, now),
        autoRenew: plan !== 'lifetime',
        transactionId: `txn_${Date.now()}`,
      };

      await this.saveSubscription(subscription);
      return { success: true };
    } catch (error) {
      console.error('购买订阅失败:', error);
      return { success: false, error: '购买失败，请重试' };
    }
  }

  /**
   * 计算过期时间
   */
  private static calculateExpiryDate(plan: SubscriptionPlan, startDate: number): number {
    const year = 365 * 24 * 60 * 60 * 1000;
    const month = 30 * 24 * 60 * 60 * 1000;

    switch (plan) {
      case 'monthly':
        return startDate + month;
      case 'yearly':
        return startDate + year;
      case 'lifetime':
        return startDate + year * 100; // 100年视为永久
      default:
        return startDate + month;
    }
  }

  /**
   * 取消订阅（停止自动续费）
   */
  static async cancelSubscription(): Promise<boolean> {
    try {
      const subscription = await this.getSubscription();
      if (subscription && subscription.status === 'active') {
        subscription.autoRenew = false;
        await this.saveSubscription(subscription);
        return true;
      }
      return false;
    } catch (error) {
      console.error('取消订阅失败:', error);
      return false;
    }
  }

  /**
   * 恢复购买
   */
  static async restorePurchases(): Promise<boolean> {
    try {
      // 模拟恢复购买流程
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 实际项目中应该调用应用商店API验证购买
      const subscription = await this.getSubscription();
      if (subscription && subscription.status === 'expired') {
        // 检查是否仍在宽限期内
        const gracePeriod = 3 * 24 * 60 * 60 * 1000; // 3天宽限期
        if (subscription.expiryDate + gracePeriod > Date.now()) {
          subscription.status = 'active';
          await this.saveSubscription(subscription);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('恢复购买失败:', error);
      return false;
    }
  }

  /**
   * 获取订阅剩余天数
   */
  static async getRemainingDays(): Promise<number> {
    const subscription = await this.getSubscription();
    if (!subscription || subscription.status !== 'active') {
      return 0;
    }

    const remaining = subscription.expiryDate - Date.now();
    return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)));
  }

  /**
   * 格式化过期日期
   */
  static formatExpiryDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
