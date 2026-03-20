/**
 * IndexedDB 缓存层
 * 按句子内容哈希缓存 AI 分块结果，同一句话第二次出现时直接读缓存。
 */

import type { ChunkResult, CacheEntry } from "../types";

const CACHE_TTL = {
  VOCAB: 24 * 60 * 60 * 1000, // 1天
  SENTENCE: 7 * 24 * 60 * 60 * 1000, // 7天
  ANALYSIS: 30 * 24 * 60 * 60 * 1000, // 30天
};

const DB_NAME = "openen-cache";
const DB_VERSION = 1;
const STORE_NAME = "chunks";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "hash" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * 简单的字符串哈希（FNV-1a 变体）
 */
export function hashString(str: string): string {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash.toString(36);
}

/**
 * 从缓存获取分块结果
 */
export async function getCached(sentence: string): Promise<ChunkResult | null> {
  try {
    const db = await openDB();
    const hash = hashString(sentence);

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(hash);

      request.onsuccess = () => {
        const entry = request.result as { hash: string; result: ChunkResult; timestamp: number } | undefined;
        if (!entry) {
          resolve(null);
          return;
        }
        if (Date.now() - entry.timestamp > CACHE_TTL.SENTENCE) {
          deleteEntry(hash).catch(() => { });
          resolve(null);
          return;
        }
        resolve(entry.result);
      };
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * 批量查缓存
 */
export async function getCachedBatch(
  sentences: string[]
): Promise<Map<string, ChunkResult>> {
  const results = new Map<string, ChunkResult>();
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    await Promise.all(
      sentences.map(
        (sentence) =>
          new Promise<void>((resolve) => {
            const hash = hashString(sentence);
            const request = store.get(hash);
            request.onsuccess = () => {
              const entry = request.result as { hash: string; result: ChunkResult; timestamp: number } | undefined;
              if (entry && Date.now() - entry.timestamp <= CACHE_TTL.SENTENCE) {
                results.set(sentence, entry.result);
              }
              resolve();
            };
            request.onerror = () => resolve();
          })
      )
    );
  } catch {
    // 缓存失败不阻塞
  }
  return results;
}

/**
 * 存入缓存
 */
export async function setCache(sentence: string, result: ChunkResult): Promise<void> {
  try {
    const db = await openDB();
    const hash = hashString(sentence);

    const entry = {
      hash,
      result,
      timestamp: Date.now(),
    };

    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(entry);
  } catch {
    // 缓存失败不阻塞
  }
}

/**
 * 批量存入缓存
 */
export async function setCacheBatch(
  pairs: { sentence: string; result: ChunkResult }[]
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    for (const { sentence, result } of pairs) {
      const hash = hashString(sentence);
      store.put({ hash, result, timestamp: Date.now() });
    }
  } catch {
    // 缓存失败不阻塞
  }
}

async function deleteEntry(hash: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).delete(hash);
}
