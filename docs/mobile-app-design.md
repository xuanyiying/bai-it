# 掰it 移动端 App 设计方案

## 一、核心设计理念

**"悬浮助手 + 智能剪贴板"** - 在任何 App 中都能使用掰it，无需切换应用

## 二、交互形态设计

### 方案 A：悬浮球模式（推荐）

类似 Apple AssistiveTouch、Facebook Chat Heads 的交互方式

```
┌─────────────────────────────────────┐
│  Twitter / 微博 / Safari 等任意 App  │
│                                     │
│  这是一段英文长句，用户正在阅读...    │
│  The quick brown fox jumps over... │
│                                     │
│                              ┌───┐  │
│                              │掰 │  │ ← 悬浮球（可拖动）
│                              └───┘  │
│                                     │
│  用户选中文本后，悬浮球变为激活状态   │
│                              ┌───┐  │
│  "selected text..."          │✓ │  │ ← 选中后变绿
│                              └───┘  │
└─────────────────────────────────────┘
```

**交互流程：**

1. **后台监听剪贴板**（需用户授权）
   - 用户在任意 App 复制英文文本
   - 掰it 自动识别并后台处理
   - 悬浮球显示小红点提示

2. **点击悬浮球**
   - 展开迷你卡片，显示拆句结果
   - 生词高亮，点击查看释义
   - 可快速标记"已掌握"

3. **上滑展开完整界面**
   - 进入完整的学习管理界面
   - 查看历史记录、每日回味等

### 方案 B：分享扩展模式

利用 iOS/Android 的系统分享机制

```
┌─────────────────────────────────────┐
│  Safari / Twitter 等应用            │
│                                     │
│  这是一段英文长句...                 │
│                                     │
│  [选中文字] → [分享按钮]             │
│       ↓                              │
│  ┌─────────────────────┐            │
│  │ 分享到：            │            │
│  │ 📱 掰it 拆句        │ ← 扩展入口 │
│  │ 💬 微信             │            │
│  │ 📧 邮件             │            │
│  └─────────────────────┘            │
└─────────────────────────────────────┘
```

**交互流程：**

1. 用户在任意 App 选中文本
2. 点击"分享"
3. 选择"掰it 拆句"
4. 弹出拆句结果卡片
5. 可保存到"难句集"

### 方案 C：内置浏览器模式（补充方案）

App 内置浏览器，自动处理所有网页

```
┌─────────────────────────────────────┐
│  掰it 浏览器                    [⚙] │
├─────────────────────────────────────┤
│ 📍 twitter.com                      │
├─────────────────────────────────────┤
│                                     │
│  自动拆句的网页内容...               │
│  ┌─────────────────────────────┐   │
│  │ The quick brown fox         │   │
│  │   └─ jumps over             │ ← 自动拆分
│  │      └─ the lazy dog        │   │
│  └─────────────────────────────┘   │
│                                     │
│  生词: [fox]̲ [lazy]̲ ← 点击查词     │
│                                     │
└─────────────────────────────────────┘
```

## 三、推荐组合方案

**悬浮球 + 分享扩展 + 内置浏览器** 三合一

### 主界面设计

```
┌─────────────────────────────────────┐
│  掰it                          [⚙] │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │  📖 今日阅读                 │   │
│  │  已拆 12 句 · 生词 8 个      │   │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━   │   │
│  │  [开始今日回味]              │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  📝 最近拆句                 │   │
│  │                             │   │
│  │  The quick brown fox...     │   │
│  │  来源: Twitter · 2分钟前    │   │
│  │                             │   │
│  │  In a hole in the ground... │   │
│  │  来源: Safari · 1小时前     │   │
│  │                             │   │
│  │  [查看全部 →]               │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  📚 生词本 (23个)            │   │
│  │                             │   │
│  │  [ubiquitous] [ephemeral]   │   │
│  │  [serendipity] [paradigm]   │   │
│  │                             │   │
│  │  [查看全部 →]               │   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│  [首页] [难句集] [生词] [设置]      │
└─────────────────────────────────────┘
```

### 悬浮球展开界面

```
┌─────────────────────────────────────┐
│  ●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●  │ ← 背景模糊
│                                     │
│  ┌─────────────────────────────┐   │
│  │  ✕                          │   │
│  ├─────────────────────────────┤   │
│  │                             │   │
│  │  The quick brown fox        │   │
│  │    └─ jumps over            │   │
│  │       └─ the lazy dog       │   │
│  │                             │   │
│  ├─────────────────────────────┤   │
│  │  生词:                      │   │
│  │  ┌──────┐ ┌──────┐         │   │
│  │  │ fox  │ │ lazy │         │   │
│  │  │ 狐狸 │ │ 懒惰 │         │   │
│  │  └──────┘ └──────┘         │   │
│  │                             │   │
│  ├─────────────────────────────┤   │
│  │  [📋 复制] [💾 保存] [🤖 AI分析] │   │
│  └─────────────────────────────┘   │
│                                     │
│              ┌───┐                  │
│              │掰 │                  │
│              └───┘                  │
└─────────────────────────────────────┘
```

## 四、技术实现方案

### iOS 实现

1. **悬浮球**
   - 使用 `UIWindow` + `UIVisualEffectView`
   - 监听 `UIPasteboard` 变化
   - 后台处理使用 `Background Tasks`

2. **分享扩展**
   - 创建 Share Extension
   - 使用 `NSExtensionContext` 获取选中文本
   - 共享数据使用 App Groups

3. **权限需求**
   - 剪贴板读取（iOS 14+ 需用户明确授权）
   - 通知权限（学习提醒）

### Android 实现

1. **悬浮球**
   - 使用 `WindowManager` + `TYPE_APPLICATION_OVERLAY`
   - 监听剪贴板 `ClipboardManager`
   - 后台服务 `ForegroundService`

2. **分享扩展**
   - 创建 `IntentFilter` 处理 `ACTION_SEND`
   - 使用 `SharedPreferences` 或 `ContentProvider` 共享数据

3. **权限需求**
   - 悬浮窗权限 (`SYSTEM_ALERT_WINDOW`)
   - 剪贴板读取（Android 10+ 需前台服务）

## 五、核心功能模块

### 1. 剪贴板监听服务

```typescript
// src/mobile/clipboard-service.ts

import { Clipboard } from '@capacitor/clipboard';
import { BackgroundTask } from '@capacitor/background-task';

export class ClipboardService {
  private lastContent: string = '';
  
  async startListening() {
    // 监听剪贴板变化
    Clipboard.addListener('clipboardContentChanged', async () => {
      const result = await Clipboard.read();
      
      if (result.value !== this.lastContent && this.isEnglishText(result.value)) {
        this.lastContent = result.value;
        await this.processText(result.value);
      }
    });
  }
  
  private isEnglishText(text: string): boolean {
    // 判断是否为英文文本
    const englishPattern = /[a-zA-Z]{10,}/;
    return englishPattern.test(text);
  }
  
  private async processText(text: string) {
    // 1. 拆句
    const sentences = await this.splitIntoSentences(text);
    
    // 2. 标注生词
    const annotated = await this.annotateVocab(sentences);
    
    // 3. 保存到本地数据库
    await this.saveToHistory(annotated);
    
    // 4. 显示通知
    await this.showNotification(annotated);
    
    // 5. 更新悬浮球状态
    this.updateFloatingButton(true);
  }
}
```

### 2. 悬浮球组件

```typescript
// src/mobile/floating-button.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Drag } from '@capacitor/drag';

export function FloatingButton() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasNewContent, setHasNewContent] = useState(false);
  const [currentResult, setCurrentResult] = useState<ParseResult | null>(null);
  
  useEffect(() => {
    // 初始化拖拽
    Drag.addListener('floating-button', {
      position: { x: window.innerWidth - 80, y: 100 }
    });
    
    // 监听新内容
    ClipboardService.onNewContent((result) => {
      setCurrentResult(result);
      setHasNewContent(true);
    });
  }, []);
  
  return (
    <>
      {/* 悬浮球 */}
      <motion.div
        className="floating-button"
        drag
        dragMomentum={false}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="icon">掰</span>
        {hasNewContent && <span className="badge" />}
      </motion.div>
      
      {/* 展开卡片 */}
      <AnimatePresence>
        {isExpanded && currentResult && (
          <motion.div
            className="result-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <SentenceDisplay result={currentResult} />
            <VocabList words={currentResult.words} />
            <ActionBar onSave={() => saveResult(currentResult)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

### 3. 分享扩展处理

```typescript
// src/mobile/share-extension.ts

import { Share } from '@capacitor/share';

export async function handleShare() {
  // 接收分享内容
  const { value: sharedText } = await Share.canShare();
  
  if (sharedText) {
    // 处理文本
    const result = await processText(sharedText);
    
    // 显示结果
    showResultModal(result);
    
    // 可选：保存到历史
    await saveToHistory(result);
  }
}
```

## 六、用户使用流程

### 场景 1：浏览 Twitter

```
1. 用户在 Twitter App 浏览英文推文
2. 看到长句，选中并复制
3. 掰it 悬浮球显示红点
4. 点击悬浮球，查看拆句结果
5. 点击生词查看释义，标记已掌握
6. 上滑保存到难句集
```

### 场景 2：阅读文章

```
1. 用户在 Safari 阅读英文文章
2. 选中段落，点击分享
3. 选择"掰it 拆句"
4. 查看拆句结果和生词标注
5. 点击"AI 深度分析"（需配置 API）
6. 保存到学习计划
```

### 场景 3：每日学习

```
1. 收到每日学习提醒通知
2. 打开 App，进入"每日回味"
3. 阅读今日长句，点击断句位置
4. 查看 AI 的断句建议
5. 学习相关句式和生词
```

## 七、界面设计细节

### 配色方案

```css
:root {
  --primary: #4A90E2;      /* 主色调 - 蓝色 */
  --secondary: #7B68EE;    /* 次要色 - 紫色 */
  --accent: #FF6B6B;       /* 强调色 - 红色（生词） */
  --success: #4CAF50;      /* 成功 - 绿色（已掌握） */
  --background: #FFFFFF;   /* 背景 - 白色 */
  --surface: #F5F5F5;      /* 卡片背景 - 浅灰 */
  --text: #333333;         /* 文字 - 深灰 */
}
```

### 动画效果

```typescript
// 悬浮球动画
const floatingButtonVariants = {
  idle: { scale: 1 },
  active: { scale: 1.1 },
  notification: { 
    scale: [1, 1.2, 1],
    transition: { repeat: Infinity, duration: 1 }
  }
};

// 卡片展开动画
const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 100,
    scale: 0.8 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  }
};
```

## 八、数据同步策略

### 本地存储

```typescript
// 使用 IndexedDB（已有）
const dbSchema = {
  sentences: '拆句历史',
  words: '生词本',
  patterns: '句式库',
  settings: '用户设置'
};
```

### 云端同步（可选）

```typescript
// 使用 iCloud / Google Drive 同步
interface SyncService {
  // 自动同步
  autoSync: boolean;
  
  // 同步频率
  syncInterval: number; // 分钟
  
  // 冲突解决
  conflictResolution: 'local' | 'remote' | 'merge';
}
```

## 九、后续迭代方向

### Phase 1: MVP（最小可行产品）
- ✅ 悬浮球基础功能
- ✅ 剪贴板监听
- ✅ 基础拆句和生词标注
- ✅ 本地历史记录

### Phase 2: 增强功能
- 🔄 分享扩展
- 🔄 AI 深度分析
- 🔄 每日学习提醒
- 🔄 生词复习算法（间隔重复）

### Phase 3: 高级功能
- 📋 内置浏览器
- 📋 云端同步
- 📋 社区分享（优质句子）
- 📋 阅读统计和成就系统

## 十、技术栈补充

需要添加的 Capacitor 插件：

```bash
# 剪贴板
pnpm add @capacitor/clipboard

# 后台任务
pnpm add @capacitor/background-task

# 拖拽（悬浮球）
pnpm add @capacitor/drag

# 本地通知
pnpm add @capacitor/local-notifications

# 分享
pnpm add @capacitor/share

# 动画库
pnpm add framer-motion
```

## 十一、开发优先级

1. **高优先级**（MVP 必须）
   - 悬浮球 UI 和拖拽
   - 剪贴板监听服务
   - 基础拆句算法（复用现有）
   - 生词标注（复用现有）
   - 本地数据存储（复用现有）

2. **中优先级**（增强体验）
   - 分享扩展
   - AI 深度分析
   - 每日学习功能
   - 通知提醒

3. **低优先级**（锦上添花）
   - 内置浏览器
   - 云端同步
   - 社区功能

---

这个设计方案充分利用了移动端的特性（悬浮球、剪贴板、分享扩展），让用户在任何 App 中都能使用掰it 的核心功能，同时保留了完整的学习管理体验。你觉得这个方案如何？需要我详细展开某个部分吗？
