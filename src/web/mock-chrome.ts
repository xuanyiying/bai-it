// Web 环境下的 Chrome API Mock 实现
// 用于在非 Chrome 扩展环境（Web、移动端 App）中运行

// Mock Chrome Storage API
class MockStorageArea implements chrome.storage.StorageArea {
  private data: Record<string, unknown> = {};

  // 重载签名以匹配 chrome.storage.StorageArea
  get(keys?: string | string[] | Record<string, unknown> | null): Promise<Record<string, unknown>>;
  get(callback: (items: Record<string, unknown>) => void): void;
  get(keys: string | string[] | Record<string, unknown> | null, callback: (items: Record<string, unknown>) => void): void;
  get(
    keysOrCallback?: string | string[] | Record<string, unknown> | null | ((items: Record<string, unknown>) => void),
    callback?: (items: Record<string, unknown>) => void
  ): Promise<Record<string, unknown>> | void {
    const execute = (keys?: string | string[] | Record<string, unknown> | null): Record<string, unknown> => {
      if (!keys) {
        return { ...this.data };
      }

      const result: Record<string, unknown> = {};
      if (typeof keys === 'string') {
        result[keys] = this.data[keys];
      } else if (Array.isArray(keys)) {
        keys.forEach(key => {
          result[key] = this.data[key];
        });
      } else {
        Object.keys(keys).forEach(key => {
          result[key] = this.data[key] ?? keys[key];
        });
      }
      return result;
    };

    if (typeof keysOrCallback === 'function') {
      keysOrCallback(execute());
    } else if (callback) {
      callback(execute(keysOrCallback));
    } else {
      return Promise.resolve(execute(keysOrCallback));
    }
  }

  set(items: Record<string, unknown>): Promise<void>;
  set(items: Record<string, unknown>, callback: () => void): void;
  set(items: Record<string, unknown>, callback?: () => void): Promise<void> | void {
    Object.assign(this.data, items);
    if (callback) {
      callback();
      return;
    }
    return Promise.resolve();
  }

  remove(keys: string | string[]): Promise<void>;
  remove(keys: string | string[], callback: () => void): void;
  remove(keys: string | string[], callback?: () => void): Promise<void> | void {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    keyArray.forEach(key => {
      delete this.data[key];
    });
    if (callback) {
      callback();
      return;
    }
    return Promise.resolve();
  }

  clear(): Promise<void>;
  clear(callback: () => void): void;
  clear(callback?: () => void): Promise<void> | void {
    this.data = {};
    if (callback) {
      callback();
      return;
    }
    return Promise.resolve();
  }

  getBytesInUse(keys?: string | string[] | null): Promise<number>;
  getBytesInUse(callback: (bytesInUse: number) => void): void;
  getBytesInUse(keys: string | string[] | null, callback: (bytesInUse: number) => void): void;
  getBytesInUse(
    keysOrCallback?: string | string[] | null | ((bytesInUse: number) => void),
    callback?: (bytesInUse: number) => void
  ): Promise<number> | void {
    const calculate = (keys?: string | string[] | null): number => {
      if (!keys) {
        return JSON.stringify(this.data).length;
      }
      const keyArray = Array.isArray(keys) ? keys : [keys];
      const subset: Record<string, unknown> = {};
      keyArray.forEach(key => {
        subset[key] = this.data[key];
      });
      return JSON.stringify(subset).length;
    };

    if (typeof keysOrCallback === 'function') {
      keysOrCallback(calculate());
    } else if (callback) {
      callback(calculate(keysOrCallback));
    } else {
      return Promise.resolve(calculate(keysOrCallback));
    }
  }

  // 新增方法
  setAccessLevel(_accessOptions: { accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' | 'TRUSTED_CONTEXTS' }): Promise<void> {
    return Promise.resolve();
  }

  getKeys(): Promise<string[]>;
  getKeys(callback: (keys: string[]) => void): void;
  getKeys(callback?: (keys: string[]) => void): Promise<string[]> | void {
    const keys = Object.keys(this.data);
    if (callback) {
      callback(keys);
      return;
    }
    return Promise.resolve(keys);
  }

  onChanged: chrome.events.Event<(changes: { [key: string]: chrome.storage.StorageChange }) => void> = {
    addListener: () => { },
    removeListener: () => { },
    hasListener: () => false,
    hasListeners: () => false,
    getRules: () => Promise.resolve([]),
    removeRules: () => Promise.resolve(),
    addRules: () => Promise.resolve([]),
  };
}

// 创建全局 mock chrome 对象
export function createMockChrome(): typeof chrome {
  const mockStorage = {
    local: new MockStorageArea(),
    sync: new MockStorageArea(),
    session: new MockStorageArea(),
    onChanged: {
      addListener: () => { },
      removeListener: () => { },
      hasListener: () => false,
      hasListeners: () => false,
      getRules: () => Promise.resolve([]),
      removeRules: () => Promise.resolve(),
      addRules: () => Promise.resolve([]),
    } as unknown as chrome.events.Event<(changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => void>
  };

  return {
    storage: mockStorage,
    runtime: {
      id: 'web-mode',
      onInstalled: { addListener: () => { } },
      onMessage: { addListener: () => { }, removeListener: () => { } },
      sendMessage: () => Promise.resolve(),
      getManifest: () => ({ version: '1.0.0' })
    },
    tabs: {
      query: () => Promise.resolve([]),
      sendMessage: () => Promise.resolve()
    },
    scripting: {
      executeScript: () => Promise.resolve([])
    }
  } as unknown as typeof chrome;
}

// 检测是否在 Chrome 扩展环境
export function isChromeExtension(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id && chrome.runtime.id !== 'web-mode';
}
