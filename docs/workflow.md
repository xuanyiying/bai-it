# 文件组织 + Git 工作流

## 文件组织规则

### `_local/` 约定

所有不需要出现在 GitHub 上的文件统一放在 `_local/` 目录下。`.gitignore` 排除整个目录。

```
_local/
├── HANDOFF.md           # 交接状态（Claude session 间传递）
├── playgrounds/         # 设计原型 HTML
├── mockups/             # UI Mockup HTML
├── brand/               # 品牌演示页
├── store-assets/        # 商店提交文档 + 截图
│   ├── screenshot/
│   ├── chrome-web-store-submission.md
│   └── edge-add-ons-submission.md
└── scripts/             # 内部工具脚本
```

### 判断标准

- **外面**（进 git）：开源用户需要看到的 — 源码、文档、配置、测试
- **`_local/`**（不进 git）：只有开发者自己用的 — 设计稿、mockup、商店素材、内部笔记、调试脚本

### 新增文件指引

| 文件类型 | 放哪里 |
|----------|--------|
| 源代码 | `src/` |
| 公开文档 | `docs/` |
| 设计原型 / playground | `_local/playgrounds/` |
| Mockup | `_local/mockups/` |
| 商店截图 / 提交文档 | `_local/store-assets/` |
| 内部调试脚本 | `_local/scripts/` |
| 临时测试截图 | `tests/screenshots/`（已在 .gitignore 中） |

## 日常开发

```bash
git add -A && git commit -m "描述" && git push
```

`.gitignore` 保证 `_local/`、`dist/`、`node_modules/` 等不会被提交。`git add -A` 永远安全。

## 发布流程

```bash
# 1. 改 manifest.json 版本号
# 2. 打包
npm run release

# 3. 提交 + 打 tag + 推送
git add -A && git commit -m "release: vX.Y.Z"
git tag vX.Y.Z && git push origin main --tags

# 4. 创建 GitHub Release
gh release create vX.Y.Z bai-it-vX.Y.Z.zip --title "vX.Y.Z" --notes "发布说明"

# 5. 手动上传 Chrome Web Store + Edge Add-ons（见 release.md）

# 6. 清理本地 zip
rm bai-it-v*.zip
```
