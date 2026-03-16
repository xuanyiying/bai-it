# 掰it - Web 与移动端构建指南

本项目现在支持三种运行模式：
1. **Chrome 扩展**（原有功能）
2. **Web 应用/PWA**（可在浏览器中运行）
3. **移动端 App**（iOS/Android，通过 Capacitor）

## 项目结构

```
bai-it/
├── src/
│   ├── options/          # Options 页面（React）
│   ├── web/              # Web/App 入口
│   │   ├── index.tsx     # Web 入口
│   │   ├── mock-chrome.ts # Chrome API Mock
│   │   └── sw.ts         # Service Worker
│   └── shared/           # 共享代码
├── dist/                 # Chrome 扩展构建输出
├── dist-web/             # Web/App 构建输出
├── ios/                  # iOS 项目（Capacitor 生成）
├── android/              # Android 项目（Capacitor 生成）
├── index.html            # Web 入口 HTML
├── vite.config.ts        # Vite + PWA 配置
└── capacitor.config.ts   # Capacitor 配置
```

## 脚本命令

### Chrome 扩展（原有）
```bash
# 开发模式
pnpm dev

# 构建
pnpm build

# 发布
pnpm release
```

### Web 应用/PWA
```bash
# 开发服务器
pnpm dev:web

# 生产构建
pnpm build:web

# 预览生产构建
pnpm preview:web
```

### 移动端 App
```bash
# 添加 iOS 平台
pnpm cap:add:ios

# 添加 Android 平台
pnpm cap:add:android

# 同步 Web 代码到原生项目
pnpm cap:sync

# 打开 iOS 项目（Xcode）
pnpm cap:open:ios

# 打开 Android 项目（Android Studio）
pnpm cap:open:android

# 构建并同步（完整流程）
pnpm build:mobile
```

## 使用说明

### Web 应用

1. **开发模式**：
   ```bash
   pnpm dev:web
   ```
   访问 http://localhost:5173

2. **生产构建**：
   ```bash
   pnpm build:web
   ```
   输出到 `dist-web/` 目录

3. **部署**：
   - 将 `dist-web/` 内容部署到任意静态托管服务
   - 支持 PWA，可离线使用

### iOS App

**前置要求**：macOS + Xcode

1. 构建 Web 代码：
   ```bash
   pnpm build:web
   ```

2. 添加 iOS 平台（首次）：
   ```bash
   pnpm cap:add:ios
   ```

3. 同步代码：
   ```bash
   pnpm cap:sync
   ```

4. 打开 Xcode：
   ```bash
   pnpm cap:open:ios
   ```

5. 在 Xcode 中：
   - 选择目标设备/模拟器
   - 点击运行按钮

### Android App

**前置要求**：Android Studio + Android SDK

1. 构建 Web 代码：
   ```bash
   pnpm build:web
   ```

2. 添加 Android 平台（首次）：
   ```bash
   pnpm cap:add:android
   ```

3. 同步代码：
   ```bash
   pnpm cap:sync
   ```

4. 打开 Android Studio：
   ```bash
   pnpm cap:open:android
   ```

5. 在 Android Studio 中：
   - 选择目标设备/模拟器
   - 点击运行按钮

## 技术说明

### Chrome API 兼容层

Web 和移动端使用 `mock-chrome.ts` 提供的 Mock 实现替代 Chrome 扩展 API：

- `chrome.storage.sync/local` → 内存存储（Mock）
- `chrome.runtime` → Mock 实现
- IndexedDB → 直接使用浏览器原生 API

### PWA 功能

- **离线支持**：Service Worker 缓存静态资源
- **添加到主屏幕**：支持 iOS Safari 和 Android Chrome
- **主题色**：白色主题，与扩展一致

### 已知限制

1. **Content Script 功能**：在 Web/App 模式下不可用（需要浏览器扩展环境）
2. **跨域请求**：部分 API 可能需要配置 CORS
3. **存储**：Mock storage 不会持久化（刷新页面后重置）

## 配置说明

### vite.config.ts

Vite + PWA 配置：
- 使用 esbuild 处理 JSX（与扩展构建一致）
- VitePWA 插件生成 PWA manifest 和 Service Worker
- 缓存 Google Fonts

### capacitor.config.ts

Capacitor 配置：
- App ID: `com.baiit.app`
- App 名称: `掰it`
- Web 目录: `dist-web`
- 启动屏: 白色背景，2秒显示时间

## 开发建议

1. **代码共享**：Options 页面的代码在三种模式下共用
2. **环境检测**：使用 `isChromeExtension()` 检测运行环境
3. **功能降级**：Web/App 模式下禁用需要 Content Script 的功能
4. **测试**：先在 Web 模式下测试，再构建到移动端
