import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { AccessibilityModule } = NativeModules;
const accessibilityEmitter = AccessibilityModule 
  ? new NativeEventEmitter(AccessibilityModule)
  : null;

export interface TextDetectedEvent {
  packageName: string;
  text: string;
  timestamp: number;
}

export const AccessibilityService = {
  /**
   * 检查无障碍服务是否运行
   */
  async isRunning(): Promise<boolean> {
    if (Platform.OS !== 'android' || !AccessibilityModule) {
      return false;
    }
    return AccessibilityModule.isServiceRunning();
  },

  /**
   * 打开系统无障碍设置
   */
  openSettings(): void {
    if (Platform.OS !== 'android' || !AccessibilityModule) {
      return;
    }
    AccessibilityModule.openAccessibilitySettings();
  },

  /**
   * 更新应用白名单
   */
  updateWhitelist(apps: string[]): void {
    if (Platform.OS !== 'android' || !AccessibilityModule) {
      return;
    }
    AccessibilityModule.updateWhitelist(apps);
  },

  /**
   * 监听文本检测事件
   */
  onTextDetected(callback: (event: TextDetectedEvent) => void): () => void {
    if (!accessibilityEmitter) {
      return () => {};
    }
    
    const subscription = accessibilityEmitter.addListener(
      'TEXT_DETECTED',
      (event: TextDetectedEvent) => callback(event)
    );
    
    return () => subscription.remove();
  },

  /**
   * 监听服务连接事件
   */
  onServiceConnected(callback: () => void): () => void {
    if (!accessibilityEmitter) {
      return () => {};
    }
    
    const subscription = accessibilityEmitter.addListener(
      'ACCESSIBILITY_SERVICE_CONNECTED',
      () => callback()
    );
    
    return () => subscription.remove();
  },

  /**
   * 监听服务断开事件
   */
  onServiceDisconnected(callback: () => void): () => void {
    if (!accessibilityEmitter) {
      return () => {};
    }
    
    const subscription = accessibilityEmitter.addListener(
      'ACCESSIBILITY_SERVICE_DISCONNECTED',
      () => callback()
    );
    
    return () => subscription.remove();
  },
};
