# CoverTool Release 版本发布完整指南

## 概述

本指南涵盖将 CoverTool 发布为专业版本所需的所有三个步骤：

1. **✅ GitHub Release 版本发布** - 创建正式版本并上传二进制文件
2. **✅ 自动更新配置** - 配置 electron-updater 以支持应用内自动更新
3. **⏳ 代码签名和公证** - 为 macOS 用户签名应用以通过 Gatekeeper

## 快速开始

### 版本 2.0.0 已准备好发布

你的项目已包含所有必要的发布基础设施：

```
✅ RELEASE_NOTES.md          - v2.0.0 发布说明
✅ 构建产物                  - 4 个安装文件 (2 DMG + 2 ZIP)
✅ electron-updater          - 依赖已添加
✅ GitHub 发布配置           - package.json 已配置
✅ MAC_CODE_SIGNING_GUIDE.md - 代码签名指南
✅ sign-and-notarize.sh      - 自动化签名脚本
```

## 第一步：GitHub Release 发布

### 目的
将应用二进制文件上传到 GitHub，让用户可以在网站上下载。

### 快速步骤

**准备工作**（只需一次）：

1. 获取 GitHub Token：
   - 访问 https://github.com/settings/tokens/new?scopes=repo,workflow
   - 生成新的 classic token
   - 复制 token

2. 登录 GitHub CLI：
   ```bash
   gh auth login
   # 选择 GitHub.com → HTTPS → Paste token
   ```

**发布流程**：

```bash
cd /Volumes/1T移动硬盘/archive/CoverTool

# 步骤 1: 创建版本标签
git tag v2.0.0
git push origin v2.0.0

# 步骤 2: 创建 Release 并上传文件
gh release create v2.0.0 \
  --title "CoverTool v2.0.0 Release" \
  --notes-file RELEASE_NOTES.md \
  dist/多功能封面工具-2.0.0.dmg \
  dist/多功能封面工具-2.0.0-arm64.dmg \
  dist/多功能封面工具-2.0.0-mac.zip \
  dist/多功能封面工具-2.0.0-arm64-mac.zip
```

**验证**：
- 访问 https://github.com/Kirota233/CoverTool/releases
- 确认 v2.0.0 已发布
- 检查所有 4 个文件都已上传

👉 **详细指南**: [GITHUB_RELEASE_GUIDE.md](GITHUB_RELEASE_GUIDE.md)

---

## 第二步：自动更新配置

### 目的
让用户启动应用时自动检查更新，并在有新版本时提示下载。

### 当前状态

✅ 已完成的配置：

1. **electron-updater 已添加**
   ```json
   // package.json
   "dependencies": { "electron-updater": "^6.1.7" }
   ```

2. **发布配置已设置**
   ```json
   // package.json
   "publish": {
     "provider": "github",
     "owner": "Kirota233",
     "repo": "CoverTool"
   }
   ```

3. **主进程已初始化**
   ```javascript
   // main.js
   const { autoUpdater } = require('electron-updater');
   autoUpdater.checkForUpdatesAndNotify();
   ```

### 启用自动更新

**步骤 1: 安装依赖**
```bash
npm install
```

**步骤 2: 重建应用**
```bash
npm run build
```

**步骤 3: 测试更新机制**
```bash
# 使用 v2.0.1 创建测试版本
npm version patch  # 更新到 2.0.1
npm run build

# 创建新的 Release
gh release create v2.0.1 \
  --title "CoverTool v2.0.1" \
  --notes "Bug fixes" \
  dist/多功能封面工具-2.0.1.dmg \
  dist/多功能封面工具-2.0.1-arm64.dmg

# 启动 v2.0.0 测试"检查更新"功能
```

### 工作原理

当用户打开应用时：
1. 后台自动检查 GitHub Release
2. 比较版本号
3. 如果发现新版本，显示"有可用更新"通知
4. 用户点击更新按钮
5. 自动下载新版本（可增量下载）
6. 提示重启应用完成更新

### blockmap 文件

构建时生成的 `.blockmap` 文件（已在 dist/ 中）：
- 用于增量更新（只下载变化部分）
- 显著加快更新速度
- 自动由 electron-updater 处理

👉 **详细配置**: main.js 中的 `autoUpdater` 部分

---

## 第三步：代码签名和公证

### 目的
为 macOS 用户签名应用，通过 Apple 的 Gatekeeper 检验，提高用户信任度。

### 为什么需要代码签名？

- **Gatekeeper 警告**: 没有签名的应用会显示警告
- **用户信任**: 签名表明应用来自可信来源
- **App Store**: 必需用于 Mac App Store 发布
- **自动更新**: 签名应用的 blockmap 更可靠

### 签名流程概览

```
1. 获取 Apple Developer 证书 ($99/年)
   ↓
2. 在 Keychain 中安装证书
   ↓
3. 更新 package.json 配置
   ↓
4. 重建应用（自动签名）
   ↓
5. 提交到 Apple 进行公证
   ↓
6. Staple（附加）公证票据
   ↓
7. 分发给用户！
```

### 完整实现步骤

**第 1 部分：获取证书**

```bash
# 1. 访问 developer.apple.com 注册开发者账户
# 2. 获取 Team ID 和 Certificate

# 3. 查看已安装的证书
security find-identity -v -p codesigning
```

**第 2 部分：配置 package.json**

```json
{
  "build": {
    "mac": {
      "target": ["dmg", "zip"],
      "sign": true,
      "identity": "Developer ID Application: Your Name",
      "hardenedRuntime": true,
      "entitlements": "./build/entitlements.mac.plist"
    }
  }
}
```

**第 3 部分：构建和签名**

```bash
# 设置证书
export CSC_IDENTITY="Developer ID Application: Your Name"

# 构建（自动签名）
npm run build
```

**第 4 部分：公证应用**

使用提供的自动化脚本：

```bash
# 设置 Apple ID 凭据
export APPLE_ID="your-email@example.com"
export APP_PASSWORD="your-app-password"  # 从 appleid.apple.com 生成
export CERT_NAME="Developer ID Application: Your Name"

# 运行自动化脚本
bash sign-and-notarize.sh
```

脚本会自动完成：
- ✅ 代码签名
- ✅ 提交公证
- ✅ 等待 Apple 审核（5-30 分钟）
- ✅ Staple 公证票据

👉 **详细指南**: [MAC_CODE_SIGNING_GUIDE.md](MAC_CODE_SIGNING_GUIDE.md)

👉 **自动化脚本**: [sign-and-notarize.sh](sign-and-notarize.sh)

---

## 建议的发布时间表

### 立即执行（第 1-2 步）
- ✅ GitHub Release 发布 - 无成本，立即提供给用户
- ✅ 自动更新配置 - 已完成，只需 `npm install` 和重建

### 下一步（第 3 步）
- ⏳ 代码签名 - 需要 $99 Apple Developer 账户
- ⏳ 公证 - 首次需要 20-30 分钟等待时间

### 优先级建议

| 优先级 | 任务 | 成本 | 时间 |
|--------|------|------|------|
| 🔴 立即 | GitHub Release | $0 | 5分钟 |
| 🔴 立即 | npm install & build | $0 | 2分钟 |
| 🟠 本周 | 代码签名证书 | $99 | 设置30分钟 |
| 🟠 本周 | 发布签名版本 | $0 | 40分钟 |
| 🟡 可选 | GitHub Actions 自动化 | $0 | 1小时 |

---

## 检查清单

### 发布 v2.0.0

- [ ] GitHub Release
  - [ ] `gh auth login` 成功
  - [ ] `gh release create v2.0.0 ...` 完成
  - [ ] Release 页面显示 4 个文件
  - [ ] RELEASE_NOTES.md 内容正确显示

- [ ] 自动更新
  - [ ] `npm install` 完成
  - [ ] `npm run build` 成功
  - [ ] dist/ 包含 blockmap 文件
  - [ ] 使用 v2.0.1 测试更新通知

- [ ] 代码签名（可选但推荐）
  - [ ] Apple Developer 账户获得
  - [ ] Team ID 和证书已获取
  - [ ] package.json 配置已更新
  - [ ] `npm run build` 签名成功
  - [ ] 公证通过
  - [ ] DMG 已 Stapled

---

## 后续维护

### 定期任务

1. **监控应用更新**
   ```bash
   # 定期检查下载统计
   gh release list
   ```

2. **计划下一个版本**
   ```bash
   # 修复 bug 或添加功能后
   npm version patch  # 2.0.1
   npm run build
   gh release create v2.0.1 ...
   ```

3. **更新代码签名证书**
   - 证书有效期通常为 1 年
   - 过期前 1 个月重新生成
   - 更新 package.json 中的证书名称

### 故障排除

**问题**: 用户收到"未知开发者"警告
```bash
# 确认应用已签名
codesign -v /Applications/多功能封面工具.app

# 验证签名
spctl -a -v /Applications/多功能封面工具.app

# 解决: 需要代码签名（见第 3 步）
```

**问题**: 自动更新不工作
```bash
# 检查 GitHub publish 配置
cat package.json | grep -A5 '"publish"'

# 检查 main.js 中 autoUpdater 初始化
grep "autoUpdater" main.js

# 解决: npm install 并重建
```

**问题**: 公证失败
```bash
# 检查失败原因
xcrun altool --notarization-info REQUEST-UUID \
  -u your-email@example.com \
  -p your-app-password \
  --verbose

# 通常问题: entitlements 权限过宽，见 MAC_CODE_SIGNING_GUIDE.md
```

---

## 相关文档

| 文档 | 说明 |
|------|------|
| [RELEASE_NOTES.md](RELEASE_NOTES.md) | v2.0.0 发布说明 |
| [GITHUB_RELEASE_GUIDE.md](GITHUB_RELEASE_GUIDE.md) | GitHub Release 详细指南 |
| [MAC_CODE_SIGNING_GUIDE.md](MAC_CODE_SIGNING_GUIDE.md) | 代码签名和公证详细指南 |
| [sign-and-notarize.sh](sign-and-notarize.sh) | 代码签名自动化脚本 |
| [main.js](main.js) | electron-updater 初始化代码 |
| [package.json](package.json) | 构建和发布配置 |

---

## 总结

你已经具备了发布专业版本所需的所有工具！

**立即开始**（建议顺序）：

1. ✅ **第 1 步：创建 GitHub Release**（5分钟）
   ```bash
   gh auth login
   gh release create v2.0.0 --notes-file RELEASE_NOTES.md dist/*.dmg dist/*.zip
   ```

2. ✅ **第 2 步：启用自动更新**（2分钟 + 构建时间）
   ```bash
   npm install && npm run build
   ```

3. 🟠 **第 3 步：代码签名**（需要购买开发者账户，但值得！）
   ```bash
   # 完整步骤见 MAC_CODE_SIGNING_GUIDE.md
   bash sign-and-notarize.sh
   ```

**祝贺！** 你即将向全球用户发布 CoverTool！ 🎉

---

**需要帮助？** 查看相应的详细指南或检查文档中的故障排除部分。
