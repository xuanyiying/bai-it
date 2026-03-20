# AI 配置说明

## 配置方式

应用支持三种 AI 配置方式，按优先级排序：

### 1. 用户自定义配置（最高优先级）
用户在「我的」→「AI 模型配置」中填写的配置。

### 2. 内置配置（次优先级）
通过环境变量注入的配置，适用于预配置场景。

### 3. 默认配置（最低优先级）
代码中定义的默认模型名称，仅作为占位符。

## 安全考虑

### 内置 API Key 的配置方法

**不推荐**将 API Key 硬编码在源码中。推荐以下方式：

#### 方式一：环境变量（推荐）

1. 创建 `.env` 文件（已加入 .gitignore）：
```bash
# .env
GEMINI_API_KEY=your_gemini_key_here
CHATGPT_API_KEY=your_openai_key_here
DEEPSEEK_API_KEY=your_deepseek_key_here
QWEN_API_KEY=your_qwen_key_here
KIMI_API_KEY=your_kimi_key_here
```

2. 安装依赖：
```bash
npm install react-native-dotenv
```

3. 配置 babel.config.js：
```javascript
module.exports = {
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
    }],
  ],
};
```

4. 在 types/index.ts 中读取：
```typescript
import { GEMINI_API_KEY, CHATGPT_API_KEY } from '@env';

export const BUILT_IN_PROVIDERS: Record<ProviderKey, BuiltInProviderConfig | null> = {
  gemini: GEMINI_API_KEY ? { apiKey: GEMINI_API_KEY, baseUrl: '', model: 'gemini-3.1-flash-lite-preview' } : null,
  // ...
};
```

#### 方式二：构建时注入

在 CI/CD 流程中注入：
```bash
echo "GEMINI_API_KEY=$GEMINI_API_KEY" >> .env
```

#### 方式三：远程配置（最安全）

从服务器动态获取配置，不存储在客户端。

## 用户界面

### 内置 Provider
- 显示「使用内置配置」或「使用自定义配置」状态
- 用户可以选择填写自定义配置覆盖内置配置
- 留空则使用内置配置（如果已配置）

### 自定义 Provider
- 完全由用户填写所有字段
- 适用于自托管模型或其他 OpenAI 兼容服务

## 配置优先级示例

```
用户填写了 Gemini 的 API Key
  ↓ 使用用户配置

用户未填写 Gemini 的 API Key，但内置配置存在
  ↓ 使用内置配置

用户未填写，内置配置也不存在
  ↓ 提示用户配置
```
