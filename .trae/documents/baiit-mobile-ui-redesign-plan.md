# BaiitMobile UI 全面重新设计计划

## 项目概述

将 BaiitMobile 应用从当前的 React Navigation + StyleSheet 架构升级为现代化的 Expo Router 架构，实现符合 AI 时代审美的高级 UI 设计，包括多语言支持和主题系统。

## 当前状态分析

### 现有架构

* **导航**: React Navigation (Stack + Bottom Tabs)

* **样式**: StyleSheet 内联样式

* **图标**: @expo/vector-icons (Ionicons)

* **主题**: 无主题系统，硬编码颜色值

* **国际化**: 无多语言支持

### 现有屏幕

1. **HomeScreen** - 扫描主页（服务开关、今日统计、识别记录）
2. **VocabScreen** - 生词本（筛选、搜索、状态管理）
3. **SentencesScreen** - 句子收藏（搜索、详情模态框）
4. **StatsScreen** - 学习统计（连续学习、词汇掌握、趋势图）
5. **WhitelistScreen** - 应用白名单管理

***

## 设计目标

### 架构决策

**保持 React Navigation 架构**，原因：

* 当前架构运行稳定，无需重构

* 降低迁移风险和测试成本

* 专注于 UI 设计升级

* 更快交付成果

**优化方向：**

* 升级样式系统，支持主题切换

* 添加动画库增强交互体验

* 引入国际化支持

* 优化组件结构

### 1. 视觉设计升级

#### 色彩系统

```
主色调 (Primary): 渐变蓝紫 #667eea → #764ba2
辅助色 (Secondary): 青色 #4ECDC4
成功色 (Success): 绿色 #95E1D3
警告色 (Warning): 橙色 #FFB6B9
错误色 (Error): 红色 #FF6B6B
```

#### 主题方案（至少 3 种）

1. **Light Theme** - 明亮清新

   * 背景: #FFFFFF / #F8FAFC

   * 文字: #1A1A2E / #4A5568

   * 卡片: 白色 + 微妙阴影

2. **Dark Theme** - 深邃优雅

   * 背景: #0F0F23 / #1A1A2E

   * 文字: #F8FAFC / #A0AEC0

   * 卡片: #1E1E32 + 玻璃态效果

3. **Ocean Theme** - 海洋渐变

   * 背景: 渐变 #0F2027 → #203A43 → #2C5364

   * 强调色: #4ECDC4

   * 卡片: 半透明玻璃态

#### 视觉效果

* **玻璃态 (Glassmorphism)**: 使用 expo-glass-effect

* **模糊背景**: 使用 expo-blur

* **流畅动画**: 使用 react-native-reanimated

* **渐变色**: 使用 CSS gradients (新架构)

* **圆角**: borderCurve: 'continuous'

### 2. 多语言支持（至少 3 种语言）

1. **中文 (zh-CN)** - 默认语言
2. **英文 (en-US)**
3. **日文 (ja-JP)**

#### 实现方案

* 使用 i18next + react-i18next

* 语言资源文件结构:

  ```
  src/
    i18n/
      index.ts
      locales/
        zh-CN.json
        en-US.json
        ja-JP.json
  ```

### 3. 架构优化

#### 保持现有架构

* 继续使用 React Navigation (Stack + Bottom Tabs)

* 优化现有组件结构

* 添加主题和国际化支持

#### 目录结构优化

```
src/
  components/
    ui/                 # 基础 UI 组件
      Button.tsx
      Card.tsx
      Input.tsx
      Badge.tsx
      ...
    features/           # 功能组件
      ResultCard.tsx
      VocabItem.tsx
      SentenceItem.tsx
      StatCard.tsx
  screens/
    HomeScreen.tsx      # 重新设计
    VocabScreen.tsx     # 重新设计
    SentencesScreen.tsx # 重新设计
    StatsScreen.tsx     # 重新设计
    WhitelistScreen.tsx # 重新设计
    SettingsScreen.tsx  # 新增
  contexts/
    ThemeContext.tsx
    LanguageContext.tsx
  hooks/
    useTheme.ts
    useLanguage.ts
  i18n/
    index.ts
    locales/
      zh-CN.json
      en-US.json
      ja-JP.json
  themes/
    index.ts
    light.ts
    dark.ts
    ocean.ts
  navigation/
    AppNavigator.tsx    # 优化导航配置
```

***

## 实施步骤

### 阶段一：基础设施搭建

#### 1.1 安装依赖
```bash
# 国际化
npm install i18next react-i18next

# 动画
npm install react-native-reanimated

# 视觉效果
npx expo install expo-blur expo-linear-gradient

# 其他
npx expo install expo-localization
npx expo install expo-haptics
```

#### 1.2 创建主题系统

* [ ] 创建 ThemeContext 和 useTheme hook

* [ ] 定义 3 种主题配置

* [ ] 创建主题持久化存储

#### 1.3 创建国际化系统

* [ ] 配置 i18next

* [ ] 创建语言资源文件（中文、英文、日文）

* [ ] 创建 LanguageContext 和 useLanguage hook

* [ ] 实现语言切换 UI

### 阶段二：UI 组件库开发

#### 2.1 基础组件

* [ ] Button - 渐变按钮、玻璃态按钮

* [ ] Card - 卡片容器（支持玻璃态）

* [ ] Input - 搜索输入框

* [ ] Badge - 状态徽章

* [ ] Switch - 主题化开关

* [ ] ProgressBar - 进度条

#### 2.2 功能组件

* [ ] ResultCard - 扫描结果卡片（重新设计）

* [ ] VocabItem - 生词卡片（重新设计）

* [ ] SentenceItem - 句子卡片（重新设计）

* [ ] StatCard - 统计卡片（重新设计）

* [ ] EmptyState - 空状态组件

* [ ] Header - 页面头部

### 阶段三：屏幕重新设计

#### 3.1 HomeScreen 重新设计

* [ ] 渐变背景头部

* [ ] 玻璃态统计卡片

* [ ] 流畅的开关动画

* [ ] 识别记录列表优化

#### 3.2 VocabScreen 重新设计

* [ ] 搜索栏优化

* [ ] 筛选标签动画

* [ ] 生词卡片玻璃态效果

* [ ] 状态切换动画

#### 3.3 SentencesScreen 重新设计

* [ ] 句子卡片重新设计

* [ ] 详情模态框优化

* [ ] 单词标签动画

#### 3.4 StatsScreen 重新设计

* [ ] 连续学习火焰动画

* [ ] 统计卡片网格

* [ ] 进度条动画

* [ ] 趋势图表优化

#### 3.5 新增设置屏幕

* [ ] 设置主页

* [ ] 语言选择页面

* [ ] 主题选择页面

### 阶段四：动画与交互

#### 4.1 入场动画

* [ ] 卡片进入动画

* [ ] 列表项交错动画

* [ ] 页面切换动画

#### 4.2 交互反馈

* [ ] 按钮触觉反馈 (expo-haptics)

* [ ] 卡片按压效果

* [ ] 开关切换动画

#### 4.3 微交互

* [ ] 加载动画

* [ ] 成功/失败反馈

* [ ] 下拉刷新动画

### 阶段五：测试与优化

#### 5.1 功能测试

* [ ] 主题切换测试

* [ ] 语言切换测试

* [ ] 导航测试

* [ ] 数据持久化测试

#### 5.2 性能优化

* [ ] 动画性能优化

* [ ] 列表渲染优化

* [ ] 内存使用优化

#### 5.3 响应式测试

* [ ] iPhone 测试

* [ ] iPad 测试

* [ ] Android 设备测试

***

## 技术要点

### 主题切换实现

```typescript
// src/themes/index.ts
export const themes = {
  light: {
    colors: {
      primary: '#667eea',
      background: '#FFFFFF',
      surface: '#F8FAFC',
      text: '#1A1A2E',
      textSecondary: '#4A5568',
      border: '#E2E8F0',
    },
    isDark: false,
  },
  dark: {
    colors: {
      primary: '#818CF8',
      background: '#0F0F23',
      surface: '#1A1A2E',
      text: '#F8FAFC',
      textSecondary: '#A0AEC0',
      border: '#2D3748',
    },
    isDark: true,
  },
  ocean: {
    colors: {
      primary: '#4ECDC4',
      background: '#0F2027',
      surface: '#203A43',
      text: '#F8FAFC',
      textSecondary: '#A0AEC0',
      border: '#2C5364',
    },
    isDark: true,
  },
};
```

### 国际化实现

```typescript
// src/i18n/locales/zh-CN.json
{
  "home": {
    "title": "Bai-it 智能阅读助手",
    "subtitle": "自动识别生词，辅助英文阅读",
    "todayNewWords": "今日新词",
    "collectedSentences": "收藏句子",
    "scanRecords": "识别记录"
  },
  "vocab": {
    "title": "生词本",
    "total": "共 {{count}} 个单词",
    "new": "新词",
    "learning": "学习中",
    "mastered": "已掌握"
  }
}
```

### 玻璃态效果

```typescript
// 使用 expo-blur
import { BlurView } from 'expo-blur';

<BlurView
  intensity={80}
  tint="light"
  style={{
    borderRadius: 16,
    overflow: 'hidden',
  }}
>
  <View style={{ padding: 16 }}>
    {/* 内容 */}
  </View>
</BlurView>
```

### 渐变背景

```typescript
// 使用 expo-linear-gradient
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={['#667eea', '#764ba2']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={{ flex: 1 }}
>
  {/* 内容 */}
</LinearGradient>
```

***

## 文件清单

### 新增文件

#### 配置文件

* `src/themes/index.ts` - 主题配置

* `src/themes/light.ts` - 亮色主题

* `src/themes/dark.ts` - 暗色主题

* `src/themes/ocean.ts` - 海洋主题

* `src/i18n/index.ts` - 国际化配置

#### 国际化文件

* `src/i18n/locales/zh-CN.json` - 中文

* `src/i18n/locales/en-US.json` - 英文

* `src/i18n/locales/ja-JP.json` - 日文

#### Context 文件

* `src/contexts/ThemeContext.tsx` - 主题上下文

* `src/contexts/LanguageContext.tsx` - 语言上下文

#### Hooks 文件

* `src/hooks/useTheme.ts` - 主题 hook

* `src/hooks/useLanguage.ts` - 语言 hook

#### UI 组件

* `src/components/ui/Button.tsx`

* `src/components/ui/Card.tsx`

* `src/components/ui/Input.tsx`

* `src/components/ui/Badge.tsx`

* `src/components/ui/Switch.tsx`

* `src/components/ui/ProgressBar.tsx`

* `src/components/ui/Header.tsx`

* `src/components/ui/EmptyState.tsx`

#### 功能组件

* `src/components/features/ResultCard.tsx` (重写)

* `src/components/features/VocabItem.tsx` (重写)

* `src/components/features/SentenceItem.tsx` (重写)

* `src/components/features/StatCard.tsx` (重写)

#### 新增屏幕

* `src/screens/SettingsScreen.tsx` - 设置主页

### 修改文件

* `package.json` - 添加新依赖

* `App.tsx` - 添加主题和语言 Provider

* `src/screens/HomeScreen.tsx` - 重新设计

* `src/screens/VocabScreen.tsx` - 重新设计

* `src/screens/SentencesScreen.tsx` - 重新设计

* `src/screens/StatsScreen.tsx` - 重新设计

* `src/screens/WhitelistScreen.tsx` - 重新设计

* `tsconfig.json` - 添加路径别名

***

## 预期成果

1. **视觉升级**: 现代化的玻璃态 UI，流畅的动画效果
2. **主题系统**: 3 种精心设计的主题，一键切换
3. **多语言支持**: 中文、英文、日文 3 种语言
4. **用户体验**: 符合 iOS Human Interface Guidelines
5. **代码质量**: 组件化、类型安全、可维护性强
6. **性能优化**: 流畅的 60fps 动画

***

## 时间估算

| 阶段       | 预计时间        |
| ---------- | --------------- |
| 阶段一：基础设施 | 2-3 小时        |
| 阶段二：组件库  | 3-4 小时        |
| 阶段三：屏幕设计 | 4-5 小时        |
| 阶段四：动画交互 | 2-3 小时        |
| 阶段五：测试优化 | 2-3 小时        |
| **总计**   | **13-18 小时**  |

***

## 注意事项

1. **向后兼容**: 确保现有数据（生词、句子）在升级后不丢失
2. **性能优先**: 动画使用 react-native-reanimated，避免 JS 线程阻塞
3. **渐进式实施**: 可以先完成主题系统，再逐步优化各个屏幕
4. **测试覆盖**: 每个阶段完成后进行功能测试
5. **文档更新**: 同步更新 README 和开发文档
6. **保持架构**: 不改变现有导航结构，专注于 UI 层面的升级

