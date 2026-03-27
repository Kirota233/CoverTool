# GitHub Release 发布流程

## 概述

本文档说明如何创建 GitHub Release 并上传二进制文件供用户下载。

## 前置条件

- GitHub 账户
- 本地 Git 仓库已推送到 GitHub
- 已安装 GitHub CLI (`gh`)
- 应用已构建完成（生成 DMG/ZIP 文件）

## 步骤 1: 创建个人访问令牌 (Personal Access Token)

### 获取 GitHub Token

1. 访问 [github.com/settings/tokens](https://github.com/settings/tokens)
2. 点击 "Generate new token" → "Generate new token (classic)"
3. 输入 Token 名称（如 "CoverTool Release"）
4. 选择以下权限：
   - `repo` (完整访问)
   - `workflow` (更新 GitHub Actions)
5. 点击 "Generate token"
6. **复制 token**（只会显示一次）

## 步骤 2: 使用 GitHub CLI 登录

### 方式 A: 交互式登录

```bash
gh auth login
```

按照提示：
1. 选择 `GitHub.com`
2. 选择 `HTTPS` 作为协议
3. 选择 `Paste an authentication token`
4. 粘贴上面复制的 token
5. 选择 `Y` 确认

### 方式 B: 使用环境变量

```bash
export GH_TOKEN="your_github_token_here"
```

## 步骤 3: 创建 Release

### 使用准备好的脚本

```bash
cd /path/to/CoverTool

# 创建版本标签
git tag v2.0.0

# 推送标签
git push origin v2.0.0

# 创建 Release（自动上传 DMG/ZIP 文件）
gh release create v2.0.0 \
  --title "CoverTool v2.0.0 Release" \
  --notes-file RELEASE_NOTES.md \
  dist/多功能封面工具-2.0.0.dmg \
  dist/多功能封面工具-2.0.0-arm64.dmg \
  dist/多功能封面工具-2.0.0-mac.zip \
  dist/多功能封面工具-2.0.0-arm64-mac.zip
```

### 或使用 GitHub 网页界面

1. 访问 [github.com/Kirota233/CoverTool/releases](https://github.com/Kirota233/CoverTool/releases)
2. 点击 "Draft a new release"
3. 输入标签名: `v2.0.0`
4. 输入标题: `CoverTool v2.0.0 Release`
5. 复制 `RELEASE_NOTES.md` 的内容到描述框中
6. 点击 "Attach binaries" 上传文件：
   - `dist/多功能封面工具-2.0.0.dmg`
   - `dist/多功能封面工具-2.0.0-arm64.dmg`
   - `dist/多功能封面工具-2.0.0-mac.zip`
   - `dist/多功能封面工具-2.0.0-arm64-mac.zip`
7. 点击 "Publish release"

## 步骤 4: 验证 Release

访问 Release 页面检查：
- ✅ Release 已发布（标签显示为蓝色）
- ✅ 所有文件已上传并可下载
- ✅ 发布说明显示正确
- ✅ 显示最新版本

## 步骤 5: 更新应用自动更新

确保 `electron-updater` 可以找到 Release：

1. 验证 `package.json` 配置：

```json
{
  "publish": {
    "provider": "github",
    "owner": "Kirota233",
    "repo": "CoverTool"
  }
}
```

2. 重新构建应用以包含 electron-updater：

```bash
npm install  # 安装 electron-updater
npm run build  # 重新构建
```

3. 用户打开应用时，electron-updater 会：
   - 检查最新 Release
   - 比较版本号
   - 如果有新版本，显示更新通知
   - 用户可以选择下载更新

## Release 文件说明

| 文件 | 说明 | 适用系统 |
|------|------|--------|
| `多功能封面工具-2.0.0.dmg` | DMG 安装包 | Intel Mac (x64) |
| `多功能封面工具-2.0.0-arm64.dmg` | DMG 安装包 | Apple Silicon (M1/M2/M3) |
| `多功能封面工具-2.0.0-mac.zip` | ZIP 压缩包 | Intel Mac (x64) |
| `多功能封面工具-2.0.0-arm64-mac.zip` | ZIP 压缩包 | Apple Silicon |
| `多功能封面工具-2.0.0.dmg.blockmap` | 增量更新块映射 | electron-updater 使用 |
| `多功能封面工具-2.0.0-arm64.dmg.blockmap` | 增量更新块映射 | electron-updater 使用 |
| `多功能封面工具-2.0.0-mac.zip.blockmap` | 增量更新块映射 | electron-updater 使用 |
| `多功能封面工具-2.0.0-arm64-mac.zip.blockmap` | 增量更新块映射 | electron-updater 使用 |

## 发布后的后续步骤

### 1. 增加迭代管理

为了更好地管理版本：

- 创建分支用于不同版本的维护：

```bash
git checkout -b v2.0.x-maintenance
```

- 对于 bug 修复，在此分支上创建 Release

### 2. 更新版本号

下一个版本开发时，更新 `package.json`：

```json
{
  "version": "2.1.0"
}
```

### 3. 通知用户

- 在 GitHub 上发布 Release 公告
- 更新项目网站或 README
- 社交媒体通知（如有）

### 4. 监控更新

- 检查用户反馈和 issue
- 监控下载统计
- 准备热修复（如需要）

## 故障排除

### 问题：`gh: command not found`

```bash
# 重新安装 GitHub CLI
brew install gh
```

### 问题：`gh auth login` 失败

```bash
# 检查 GH_TOKEN 环境变量
echo $GH_TOKEN

# 或重新登录
gh auth logout
gh auth login
```

### 问题：标签已存在

```bash
# 删除本地标签
git tag -d v2.0.0

# 删除远程标签
git push --delete origin v2.0.0

# 重新创建
git tag v2.0.0
git push origin v2.0.0
```

### 问题：文件上传失败

```bash
# 检查文件是否存在
ls -lh dist/

# 提供完整路径
gh release create v2.0.0 \
  --title "..." \
  --notes-file RELEASE_NOTES.md \
  /absolute/path/to/dist/多功能封面工具-2.0.0.dmg
```

## 自动化脚本

创建 `scripts/create-release.sh`：

```bash
#!/bin/bash

set -e

VERSION=${1:-v2.0.0}

echo "📦 创建 Release $VERSION"

cd "$(dirname "$0")/.."

# 确保本地文件已提交
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ 仓库有未提交的更改，请先提交"
    exit 1
fi

# 创建标签
git tag "$VERSION" || echo "标签 $VERSION 已存在"

# 推送标签
git push origin "$VERSION" || echo "标签已推送"

# 创建 Release
gh release create "$VERSION" \
    --title "CoverTool $VERSION Release" \
    --notes-file RELEASE_NOTES.md \
    dist/多功能封面工具-*.dmg \
    dist/多功能封面工具-*.zip

echo "✅ Release $VERSION 已创建！"
echo "📍 访问: https://github.com/Kirota233/CoverTool/releases/tag/$VERSION"
```

使用：

```bash
chmod +x scripts/create-release.sh
./scripts/create-release.sh v2.0.0
```

## 下一步

1. ✅ 创建并发布 GitHub Release
2. ⏳ 为用户测试应用更新机制
3. ⏳ 配置代码签名和公证（见 MAC_CODE_SIGNING_GUIDE.md）
4. ⏳ 考虑 GitHub Actions 自动化构建

## 参考资源

- [GitHub CLI 文档](https://cli.github.com/manual/)
- [GitHub Releases 文档](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
- [electron-updater GitHub Release](https://www.electron.build/auto-update)
- [个人访问令牌](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
