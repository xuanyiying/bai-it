# 发布流程

每次发布新版本，按以下步骤操作。

---

## 1. 更新版本号

修改 `manifest.json` 中的 `version` 字段：

```json
"version": "0.1.1"
```

版本号规则：bug 修复改第三位，新功能改第二位，大版本改第一位。

## 2. 构建 + 打包

```bash
npm run release
```

依次执行：跑测试 → 构建 → 打包成 `bai-it-v{版本号}.zip`（在项目根目录）。

测试不通过会中断，不会生成包。

## 3. 提交代码 + 创建 GitHub Release

```bash
git add -A
git commit -m "release: v0.1.1"
git tag v0.1.1
git push origin main --tags
gh release create v0.1.1 bai-it-v0.1.1.zip --title "v0.1.1" --notes "发布说明"
```

zip 文件会挂在 GitHub Release 页面作为永久归档，本地的 zip 上传完商店后可以删掉。

## 4. 上传 Chrome Web Store

1. 打开 https://chrome.google.com/webstore/devconsole
2. 点击已有扩展 → **Package** → **Upload new package**
3. 上传 `bai-it-v{版本号}.zip`
4. 检查 Store Listing 有无需要更新的内容
5. 点 **Submit for review**

详细字段说明见 [chrome-web-store-submission.md](../_local/store-assets/chrome-web-store-submission.md)

## 5. 上传 Edge Add-ons

1. 打开 https://partner.microsoft.com/dashboard/microsoftedge/public/login
2. 点击已有扩展 → **Packages** → 上传同一个 `bai-it-v{版本号}.zip`
3. 检查 Store Listings 有无需要更新的内容
4. 点 **Submit** → **Publish**

详细字段说明见 [edge-add-ons-submission.md](../_local/store-assets/edge-add-ons-submission.md)

## 6. 清理

上传完两个商店后，删除本地 zip：

```bash
rm bai-it-v*.zip
```

---

## 快速检查清单

- [ ] `manifest.json` version 已更新
- [ ] `npm run release` 通过
- [ ] Git commit + tag + push
- [ ] GitHub Release 已创建并挂上 zip
- [ ] Chrome Web Store 已上传并提交审核
- [ ] Edge Add-ons 已上传并提交审核
- [ ] 本地 zip 已清理
