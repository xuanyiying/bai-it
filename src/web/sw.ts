// Service Worker for PWA
// 提供离线缓存功能

/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'baiit-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/options.css',
  '/icons/icon16.png',
  '/icons/icon48.png',
  '/icons/icon128.png'
];

// 安装时缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  // 跳过非 GET 请求
  if (event.request.method !== 'GET') {
    return;
  }

  // 跳过 Chrome 扩展请求
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // 如果缓存中有，返回缓存
      if (response) {
        return response;
      }

      // 否则发起网络请求
      return fetch(event.request).then((networkResponse) => {
        // 只缓存成功的响应
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // 克隆响应（因为响应流只能读取一次）
        const responseToCache = networkResponse.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});

export {};
