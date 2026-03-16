import { Clipboard } from 'react-native';
import * as ExpoClipboard from 'expo-clipboard';

export interface ClipboardTextEvent {
  text: string;
  timestamp: number;
}

type ClipboardCallback = (event: ClipboardTextEvent) => void;

let isMonitoring = false;
let lastContent = '';
let checkInterval: ReturnType<typeof setInterval> | null = null;
const subscribers: Set<ClipboardCallback> = new Set();

export const ClipboardService = {
  startMonitoring(callback: ClipboardCallback): () => void {
    subscribers.add(callback);

    if (!isMonitoring) {
      isMonitoring = true;
      lastContent = '';

      checkInterval = setInterval(async () => {
        try {
          const hasContent = await ExpoClipboard.hasStringAsync();
          if (!hasContent) return;

          const content = await ExpoClipboard.getStringAsync();
          if (content && content !== lastContent && content.trim().length > 0) {
            lastContent = content;

            const event: ClipboardTextEvent = {
              text: content,
              timestamp: Date.now(),
            };

            subscribers.forEach(cb => {
              try {
                cb(event);
              } catch (e) {
                console.error('Clipboard callback error:', e);
              }
            });
          }
        } catch (error) {
          console.error('Clipboard check error:', error);
        }
      }, 1000);
    }

    return () => {
      subscribers.delete(callback);
      if (subscribers.size === 0) {
        stopMonitoring();
      }
    };
  },

  stopMonitoring(): void {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
    isMonitoring = false;
    lastContent = '';
  },

  async getText(): Promise<string | null> {
    try {
      const hasContent = await ExpoClipboard.hasStringAsync();
      if (!hasContent) return null;
      return await ExpoClipboard.getStringAsync();
    } catch (error) {
      console.error('Get clipboard error:', error);
      return null;
    }
  },

  async setText(text: string): Promise<boolean> {
    try {
      await ExpoClipboard.setStringAsync(text);
      lastContent = text;
      return true;
    } catch (error) {
      console.error('Set clipboard error:', error);
      return false;
    }
  },

  isMonitoring(): boolean {
    return isMonitoring;
  },
};

function stopMonitoring() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
  isMonitoring = false;
}
