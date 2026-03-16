// Web / 移动端 App 入口文件
// 提供与 Chrome 扩展相同的功能，但使用 Web API 替代 Chrome API

import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { App } from '../options/App';
import { isChromeExtension, createMockChrome } from './mock-chrome';

// 如果不是 Chrome 扩展环境，注入 mock chrome 对象
if (!isChromeExtension()) {
  (window as unknown as { chrome: typeof chrome }).chrome = createMockChrome();
  console.log('[Web Mode] Mock Chrome API injected');
}

// 注册 Service Worker（仅在支持的环境中）
if ('serviceWorker' in navigator && !isChromeExtension()) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('[PWA] Service Worker registered:', registration.scope);
      })
      .catch(error => {
        console.log('[PWA] Service Worker registration failed:', error);
      });
  });
}

const root = document.getElementById('app');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
