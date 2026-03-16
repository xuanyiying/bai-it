# 掰it 移动端 App 设计方案 V2

## 一、核心设计理念

**"无感后台处理 + 悬浮查看"** - 用户正常使用手机，掰it 在后台自动工作

## 二、关键改进

### ❌ V1 方案问题
- 需要用户选中文本 → 操作繁琐
- 长段落不好选中 → 体验差
- 需要手动触发 → 打断阅读流

### ✅ V2 方案优势
- **后台自动处理** - 无需用户操作
- **App 白名单** - 只在指定 App 中工作
- **悬浮查看** - 随时查看处理结果

## 三、交互形态设计

### 核心流程

```
用户打开 Twitter（在白名单中）
         ↓
  掰it 后台自动启动
         ↓
  监听屏幕上的英文内容
         ↓
  自动拆句 + 标注生词
         ↓
  悬浮球显示处理数量
         ↓
  用户点击悬浮球查看结果
```

### 界面示意

```
┌─────────────────────────────────────┐
│  Twitter                            │
├─────────────────────────────────────┤
│                                     │
│  @user: The quick brown fox jumps  │
│  over the lazy dog. This is a...   │
│  ↓ 后台自动处理                      │
│  ┌─────────────────────────────┐   │
│  │ The quick brown fox         │   │
│  │   └─ jumps over             │   │
│  │      └─ the lazy dog        │   │
│  │                             │   │
│  │ [fox]̲ [lazy]̲ ← 自动标注      │   │
│  └─────────────────────────────┘   │
│                                     │
│                              ┌───┐  │
│                              │3 │  │ ← 悬浮球显示处理数量
│                              └───┘  │
│                                     │
│  @another: In a hole in the...     │
│  ↓ 后台继续处理                      │
│                                     │
└─────────────────────────────────────┘
```

### 悬浮球状态

```
┌───┐     ┌───┐     ┌───┐     ┌───┐
│掰 │     │3 │     │● │     │💤│
└───┘     └───┘     └───┘     └───┘
 空闲      有新内容   处理中    白名单外
 (灰色)    (数字)    (动画)    (半透明)
```

## 四、App 白名单管理

### 设置界面

```
┌─────────────────────────────────────┐
│  设置                               │
├─────────────────────────────────────┤
│                                     │
│  📱 启用掰it 的应用                  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ✅ Twitter                  │   │
│  │    自动处理英文推文          │   │
│  ├─────────────────────────────┤   │
│  │ ✅ Safari                   │   │
│  │    自动处理网页内容          │   │
│  ├─────────────────────────────┤   │
│  │ ✅ 微信                     │   │
│  │    自动处理公众号文章        │   │
│  ├─────────────────────────────┤   │
│  │ ⬜ Reddit                   │   │
│  │    点击添加                 │   │
│  ├─────────────────────────────┤   │
│  │ ⬜ 微博                     │   │
│  │    点击添加                 │   │
│  └─────────────────────────────┘   │
│                                     │
│  ➕ 添加更多应用                     │
│                                     │
│  ⚙️ 高级设置                        │
│  ├─ 最小句子长度：10 词             │
│  ├─ 处理间隔：3 秒                  │
│  └─ 仅处理英文内容                  │
│                                     │
└─────────────────────────────────────┘
```

### 智能推荐

```
┌─────────────────────────────────────┐
│  💡 推荐启用的应用                   │
├─────────────────────────────────────┤
│                                     │
│  检测到您经常在这些应用中阅读英文：   │
│                                     │
│  • Twitter (推荐)                   │
│  • Medium (推荐)                    │
│  • 知乎 (检测到英文内容)             │
│                                     │
│  [一键启用推荐] [手动选择]           │
│                                     │
└─────────────────────────────────────┘
```

## 五、技术实现方案

### Android 实现（核心）

#### 1. 无障碍服务 (AccessibilityService)

```kotlin
// android/app/src/main/java/com/baiit/app/BaitAccessibilityService.kt

class BaitAccessibilityService : AccessibilityService() {
    
    private val whitelistApps = mutableSetOf<String>()
    private val handler = Handler(Looper.getMainLooper())
    private var lastProcessedTime = 0L
    private val processInterval = 3000L // 3秒间隔
    
    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        // 检查是否在白名单 App 中
        val packageName = event.packageName?.toString() ?: return
        if (!whitelistApps.contains(packageName)) {
            updateFloatingButton(state = "idle")
            return
        }
        
        // 获取屏幕文本
        val node = rootInActiveWindow ?: return
        val screenText = extractText(node)
        
        // 防抖：避免频繁处理
        if (System.currentTimeMillis() - lastProcessedTime < processInterval) {
            return
        }
        
        // 检测是否为英文内容
        if (!isEnglishContent(screenText)) {
            return
        }
        
        // 后台处理
        updateFloatingButton(state = "processing")
        processTextAsync(screenText) { result ->
            lastProcessedTime = System.currentTimeMillis()
            updateFloatingButton(state = "ready", count = result.size)
        }
    }
    
    private fun extractText(node: AccessibilityNodeInfo): String {
        val textBuilder = StringBuilder()
        extractTextRecursive(node, textBuilder)
        return textBuilder.toString()
    }
    
    private fun extractTextRecursive(node: AccessibilityNodeInfo, builder: StringBuilder) {
        node.text?.let { builder.append(it).append(" ") }
        for (i in 0 until node.childCount) {
            node.getChild(i)?.let { extractTextRecursive(it, builder) }
        }
    }
    
    private fun isEnglishContent(text: String): Boolean {
        // 至少 50 个英文字符，且英文占比超过 70%
        val englishChars = text.count { it in 'a'..'z' || it in 'A'..'Z' }
        return englishChars >= 50 && englishChars.toFloat() / text.length > 0.7f
    }
    
    override fun onInterrupt() {}
}
```

#### 2. 悬浮窗服务

```kotlin
// android/app/src/main/java/com/baiit/app/FloatingButtonService.kt

class FloatingButtonService : Service() {
    
    private lateinit var windowManager: WindowManager
    private lateinit var floatingView: View
    private lateinit var badgeView: TextView
    
    override fun onCreate() {
        super.onCreate()
        
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        
        // 创建悬浮球布局
        floatingView = LayoutInflater.from(this).inflate(
            R.layout.floating_button, null
        )
        
        // 设置拖拽
        floatingView.setOnTouchListener(FloatingTouchListener())
        
        // 设置点击
        floatingView.setOnClickListener {
            showResultCard()
        }
        
        // 添加到窗口
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        )
        
        params.gravity = Gravity.TOP or Gravity.END
        params.x = 32
        params.y = 200
        
        windowManager.addView(floatingView, params)
    }
    
    fun updateState(state: String, count: Int = 0) {
        when (state) {
            "idle" -> {
                badgeView.visibility = View.GONE
                floatingView.alpha = 0.5f
            }
            "processing" -> {
                // 显示加载动画
                floatingView.startAnimation(AnimationUtils.loadAnimation(
                    this, R.anim.pulse
                ))
            }
            "ready" -> {
                floatingView.clearAnimation()
                floatingView.alpha = 1f
                badgeView.visibility = View.VISIBLE
                badgeView.text = count.toString()
            }
        }
    }
    
    private fun showResultCard() {
        // 展开结果卡片
        val cardView = LayoutInflater.from(this).inflate(
            R.layout.result_card, null
        )
        
        // 填充数据
        // ...
        
        windowManager.addView(cardView, cardParams)
    }
}
```

#### 3. AndroidManifest.xml 配置

```xml
<!-- android/app/src/main/AndroidManifest.xml -->

<manifest>
    <!-- 权限 -->
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    <uses-permission android:name="android.permission.BIND_ACCESSIBILITY_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    
    <application>
        <!-- 无障碍服务 -->
        <service
            android:name=".BaitAccessibilityService"
            android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE">
            <intent-filter>
                <action android:name="android.accessibilityservice.AccessibilityService" />
            </intent-filter>
            <meta-data
                android:name="android.accessibilityservice"
                android:resource="@xml/accessibility_service_config" />
        </service>
        
        <!-- 悬浮窗服务 -->
        <service android:name=".FloatingButtonService" />
    </application>
</manifest>
```

#### 4. 无障碍服务配置

```xml
<!-- android/app/src/main/res/xml/accessibility_service_config.xml -->

<accessibility-service
    xmlns:android="http://schemas.android.com/apk/res/android"
    android:accessibilityEventTypes="typeWindowStateChanged|typeWindowContentChanged"
    android:accessibilityFeedbackType="feedbackGeneric"
    android:accessibilityFlags="flagDefault|flagRequestEnhancedWebAccessibility"
    android:canRetrieveWindowContent="true"
    android:description="@string/accessibility_service_description"
    android:notificationTimeout="100"
    android:settingsActivity="com.baiit.app.SettingsActivity" />
```

### iOS 实现（受限方案）

由于 iOS 系统限制，无法像 Android 一样监听其他 App 的内容，提供替代方案：

#### 方案 A：内置浏览器（推荐）

```swift
// ios/App/App/BrowserViewController.swift

class BrowserViewController: UIViewController {
    private var webView: WKWebView!
    private var floatingButton: UIButton!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // 创建 WebView
        webView = WKWebView(frame: view.bounds)
        webView.navigationDelegate = self
        view.addSubview(webView)
        
        // 创建悬浮球
        floatingButton = createFloatingButton()
        view.addSubview(floatingButton)
        
        // 监听页面加载完成
        // 自动处理页面内容
    }
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // 页面加载完成，提取文本
        webView.evaluateJavaScript("document.body.innerText") { result, error in
            if let text = result as? String {
                self.processText(text)
            }
        }
    }
    
    private func processText(_ text: String) {
        // 调用 JS 处理逻辑
        // 拆句 + 标注生词
        // 更新悬浮球状态
    }
}
```

#### 方案 B：剪贴板监听（自动）

```swift
// ios/App/App/ClipboardMonitor.swift

class ClipboardMonitor {
    private var timer: Timer?
    private var lastContent: String = ""
    
    func startMonitoring() {
        // 每秒检查一次剪贴板
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            if let content = UIPasteboard.general.string,
               content != self.lastContent {
                self.lastContent = content
                self.processClipboard(content)
            }
        }
    }
    
    private func processClipboard(_ text: String) {
        // 检测是否为英文
        guard isEnglish(text) else { return }
        
        // 后台处理
        // 更新悬浮球
    }
}
```

#### 方案 C：App Clips + 分享扩展

```swift
// Share Extension 入口

class ShareViewController: SLComposeServiceViewController {
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // 自动获取分享内容
        if let content = extensionContext?.inputItems.first as? NSExtensionItem,
           let itemProvider = content.attachments?.first {
            
            itemProvider.loadItem(forTypeIdentifier: "public.text", options: nil) { data, error in
                if let text = data as? String {
                    self.processText(text)
                }
            }
        }
    }
}
```

## 六、前端实现

### 1. 白名单管理组件

```typescript
// src/mobile/components/AppWhitelist.tsx

import React, { useState, useEffect } from 'react';
import { AppLauncher } from '@capacitor/app-launcher';
import { Preferences } from '@capacitor/preferences';

interface AppInfo {
  packageName: string;
  name: string;
  icon: string;
  enabled: boolean;
}

export function AppWhitelist() {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [recommendedApps, setRecommendedApps] = useState<AppInfo[]>([]);
  
  useEffect(() => {
    loadInstalledApps();
    loadWhitelist();
  }, []);
  
  const loadInstalledApps = async () => {
    // 获取已安装的应用列表
    const installedApps = await getInstalledApps();
    
    // 智能推荐
    const recommended = installedApps.filter(app => 
      isReadingApp(app.packageName)
    );
    
    setRecommendedApps(recommended);
  };
  
  const toggleApp = async (packageName: string) => {
    const updatedApps = apps.map(app => 
      app.packageName === packageName 
        ? { ...app, enabled: !app.enabled }
        : app
    );
    
    setApps(updatedApps);
    
    // 保存到本地
    await Preferences.set({
      key: 'whitelist',
      value: JSON.stringify(updatedApps.filter(a => a.enabled))
    });
    
    // 通知原生层
    await updateNativeWhitelist(updatedApps.filter(a => a.enabled));
  };
  
  const isReadingApp = (packageName: string): boolean => {
    const readingApps = [
      'com.twitter.android',
      'com.reddit.frontpage',
      'com.medium.reader',
      'com.tencent.mm', // 微信
      'com.sina.weibo', // 微博
      'com.zhihu.android', // 知乎
    ];
    return readingApps.includes(packageName);
  };
  
  return (
    <div className="app-whitelist">
      <h2>📱 启用掰it 的应用</h2>
      
      {/* 推荐应用 */}
      {recommendedApps.length > 0 && (
        <div className="recommended-section">
          <h3>💡 推荐启用</h3>
          {recommendedApps.map(app => (
            <AppToggle 
              key={app.packageName}
              app={app}
              onToggle={() => toggleApp(app.packageName)}
            />
          ))}
        </div>
      )}
      
      {/* 所有应用 */}
      <div className="all-apps-section">
        {apps.map(app => (
          <AppToggle 
            key={app.packageName}
            app={app}
            onToggle={() => toggleApp(app.packageName)}
          />
        ))}
      </div>
      
      {/* 添加更多 */}
      <button className="add-more-btn">
        ➕ 添加更多应用
      </button>
    </div>
  );
}
```

### 2. 悬浮球组件（React Native Web）

```typescript
// src/mobile/components/FloatingButton.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Haptics } from '@capacitor/haptics';

interface FloatingButtonProps {
  count: number;
  state: 'idle' | 'processing' | 'ready';
  results: ParseResult[];
}

export function FloatingButton({ count, state, results }: FloatingButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 200 });
  
  const handleClick = async () => {
    await Haptics.impact({ style: 'light' });
    setIsExpanded(!isExpanded);
  };
  
  const handleDrag = (event: any, info: any) => {
    setPosition({ x: info.point.x, y: info.point.y });
  };
  
  return (
    <>
      {/* 悬浮球 */}
      <motion.div
        className={`floating-button ${state}`}
        drag
        dragMomentum={false}
        dragElastic={0}
        onDragEnd={handleDrag}
        onClick={handleClick}
        animate={{
          scale: state === 'processing' ? [1, 1.1, 1] : 1,
          opacity: state === 'idle' ? 0.5 : 1
        }}
        transition={{
          duration: 0.5,
          repeat: state === 'processing' ? Infinity : 0
        }}
        style={{
          position: 'fixed',
          right: 16,
          top: position.y,
          zIndex: 9999
        }}
      >
        <div className="button-content">
          {state === 'processing' ? (
            <span className="loading-icon">⏳</span>
          ) : (
            <span className="app-icon">掰</span>
          )}
          
          {count > 0 && (
            <motion.span 
              className="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              {count}
            </motion.span>
          )}
        </div>
      </motion.div>
      
      {/* 展开卡片 */}
      <AnimatePresence>
        {isExpanded && results.length > 0 && (
          <motion.div
            className="result-card"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
          >
            <ResultList results={results} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

### 3. 后台处理服务

```typescript
// src/mobile/services/BackgroundProcessor.ts

import { BackgroundTask } from '@capacitor/background-task';
import { Preferences } from '@capacitor/preferences';

export class BackgroundProcessor {
  private isProcessing = false;
  private queue: string[] = [];
  
  async start() {
    // 注册后台任务
    BackgroundTask.beforeExit(async ({ stayAwake }) => {
      const taskId = stayAwake();
      
      try {
        await this.processQueue();
      } finally {
        BackgroundTask.finish({ taskId });
      }
    });
  }
  
  async addText(text: string) {
    this.queue.push(text);
    
    if (!this.isProcessing) {
      await this.processNext();
    }
  }
  
  private async processNext() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }
    
    this.isProcessing = true;
    const text = this.queue.shift()!;
    
    try {
      // 1. 拆句
      const sentences = await this.splitSentences(text);
      
      // 2. 标注生词
      const annotated = await this.annotateVocab(sentences);
      
      // 3. 保存到历史
      await this.saveToHistory(annotated);
      
      // 4. 通知 UI 更新
      this.notifyUpdate(annotated);
      
    } catch (error) {
      console.error('Processing failed:', error);
    }
    
    // 处理下一个
    await this.processNext();
  }
  
  private async splitSentences(text: string): Promise<Sentence[]> {
    // 复用现有的拆句逻辑
    // 从 src/shared/scan-rules.ts
    const rules = await loadScanRules();
    return applyRules(text, rules);
  }
  
  private async annotateVocab(sentences: Sentence[]): Promise<AnnotatedSentence[]> {
    // 复用现有的生词标注逻辑
    // 从 src/shared/vocab.ts
    const vocab = await loadVocab();
    return sentences.map(s => annotateSentence(s, vocab));
  }
}
```

## 七、权限引导流程

### Android 权限引导

```
┌─────────────────────────────────────┐
│  欢迎使用掰it！                      │
├─────────────────────────────────────┤
│                                     │
│  为了自动处理屏幕内容，需要以下权限： │
│                                     │
│  1. ✅ 无障碍服务                    │
│     用于读取屏幕上的英文内容         │
│                                     │
│  2. ✅ 悬浮窗权限                    │
│     用于显示悬浮球和结果卡片         │
│                                     │
│  [下一步：开启权限]                  │
│                                     │
└─────────────────────────────────────┘
```

### 权限检测代码

```typescript
// src/mobile/utils/permissions.ts

import { Capacitor } from '@capacitor/core';

export async function checkPermissions(): Promise<PermissionStatus> {
  const platform = Capacitor.getPlatform();
  
  if (platform === 'android') {
    return {
      accessibility: await checkAccessibilityPermission(),
      overlay: await checkOverlayPermission(),
    };
  }
  
  // iOS 不需要特殊权限
  return { all: true };
}

export async function requestPermissions(): Promise<void> {
  const platform = Capacitor.getPlatform();
  
  if (platform === 'android') {
    // 引导用户开启无障碍服务
    if (!await checkAccessibilityPermission()) {
      await openAccessibilitySettings();
    }
    
    // 引导用户开启悬浮窗权限
    if (!await checkOverlayPermission()) {
      await openOverlaySettings();
    }
  }
}
```

## 八、完整使用流程

### 首次使用

```
1. 打开掰it App
2. 引导开启权限（无障碍 + 悬浮窗）
3. 选择要启用的 App（白名单）
4. 完成！
```

### 日常使用

```
1. 用户打开 Twitter（在白名单中）
2. 掰it 悬浮球自动出现
3. 用户正常浏览，后台自动处理
4. 悬浮球显示处理数量
5. 点击悬浮球查看结果
6. 查看拆句、生词标注
7. 标记已掌握的单词
```

## 九、性能优化

### 1. 防抖处理

```typescript
// 避免频繁处理
const DEBOUNCE_TIME = 3000; // 3秒

let lastProcessTime = 0;

function shouldProcess(): boolean {
  const now = Date.now();
  if (now - lastProcessTime < DEBOUNCE_TIME) {
    return false;
  }
  lastProcessTime = now;
  return true;
}
```

### 2. 增量处理

```typescript
// 只处理新增内容
let lastContent = '';

function getNewContent(current: string): string | null {
  if (current === lastContent) return null;
  
  const newContent = current.replace(lastContent, '');
  lastContent = current;
  
  return newContent || null;
}
```

### 3. 智能过滤

```typescript
// 过滤不需要处理的内容
function shouldSkip(text: string): boolean {
  // 太短
  if (text.length < 50) return true;
  
  // 非英文
  if (!isEnglish(text)) return true;
  
  // 重复内容
  if (isDuplicate(text)) return true;
  
  return false;
}
```

## 十、总结

### 核心优势

1. **无感使用** - 用户无需任何操作
2. **精准控制** - 只在指定 App 中工作
3. **性能优化** - 智能防抖、增量处理
4. **隐私保护** - 本地处理，不上传数据

### 平台差异

| 功能 | Android | iOS |
|------|---------|-----|
| 自动监听 | ✅ 无障碍服务 | ❌ 系统限制 |
| 内置浏览器 | ✅ 支持 | ✅ 支持 |
| 剪贴板监听 | ✅ 支持 | ✅ 支持 |
| 分享扩展 | ✅ 支持 | ✅ 支持 |

### 推荐方案

- **Android**: 无障碍服务 + 悬浮球（完整体验）
- **iOS**: 内置浏览器 + 剪贴板监听（受限但可用）

这个方案真正实现了"无感使用"，用户只需要设置一次白名单，之后就能在指定 App 中自动享受掰it 的功能！
