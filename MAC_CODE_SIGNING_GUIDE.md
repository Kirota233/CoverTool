# macOS 代码签名和公证指南

## 概述

macOS Gatekeeper 要求所有从互联网下载的应用都需要签名和公证。本指南说明如何为 CoverTool 配置这些功能。

## 前置条件

### 1. Apple Developer 账户
- 费用：$99/年
- 注册地址：[developer.apple.com](https://developer.apple.com)
- 需要完成身份验证

### 2. 获取 Team ID
登录 [developer.apple.com](https://developer.apple.com) 后：
- 进入 Account → Membership
- 记下你的 Team ID（格式如：`ABCD12E34F`）

### 3. 创建应用特定密码

为了安全起见，必须使用应用特定密码而非 Apple ID 密码：

1. 访问 [appleid.apple.com](https://appleid.apple.com)
2. 登录你的 Apple ID
3. 进入 "Security" → "App-Specific Passwords"
4. 生成新的应用特定密码
5. 记下这个密码（只会显示一次）

## 步骤 1: 获取代码签名证书

### 从 Xcode 下载证书

```bash
# 打开 Xcode 并登录你的 Apple ID
xcode-select --install

# 生成证书请求
```

### 或从 Apple Developer 网站获取

1. 访问 [developer.apple.com/account](https://developer.apple.com/account)
2. 进入 Certificates, Identifiers & Profiles
3. 选择 Certificates
4. 点击 "+" 创建新证书
5. 选择 "macOS App Distribution"（用于发布）或 "macOS Development"（用于开发）
6. 按照指示生成并下载证书
7. 双击 `.cer` 文件将其导入 Keychain

### 验证证书

```bash
# 查看所有可用的代码签名证书
security find-identity -v -p codesigning
```

记下你的证书名称（通常是 "Developer ID Application: Your Name"）

## 步骤 2: 更新 package.json 配置

修改 `package.json` 中的 build 配置：

```json
{
  "build": {
    "mac": {
      "target": ["dmg", "zip"],
      "sign": true,
      "identity": "Developer ID Application: Your Name",
      "gatekeeper": "sign",
      "hardenedRuntime": true,
      "entitlements": "./build/entitlements.mac.plist",
      "entitlementsInherit": "./build/entitlements.mac.plist"
    },
    "dmg": {
      "sign": true
    }
  }
}
```

### 重要字段说明

- `sign`: `true` - 启用代码签名
- `identity`: 证书名称，从上面的 `security find-identity` 获取
- `hardenedRuntime`: `true` - 启用运行时强化
- `entitlements`: 权限文件路径

## 步骤 3: 设置权限文件

检查 `build/entitlements.mac.plist`，确保包含必要的权限：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.allow-dyld-environment-variables</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
    <key>com.apple.security.device.camera</key>
    <false/>
</dict>
</plist>
```

## 步骤 4: 自动签名构建

配置环境变量后，构建时会自动签名：

```bash
# 设置环境变量
export CSC_IDENTITY_AUTO_DISCOVERY=true

# 或明确指定证书
export CSC_IDENTITY="Developer ID Application: Your Name"

# 构建应用（会自动签名）
npm run build
```

electron-builder 会自动处理签名过程。

## 步骤 5: 公证应用（必需用于 macOS 10.15+）

### 前置条件

- 已完成代码签名
- 有应用特定密码
- 安装了 Xcode 命令行工具

### 手动公证流程

1. **准备应用**

```bash
# 创建可公证的 ZIP
ditto -c -k --sequesterRsrc "dist/多功能封面工具-2.0.0.dmg" "/tmp/CoverTool-notarize.zip"
```

2. **提交公证**

```bash
# 设置凭据
APPLE_ID="your-email@example.com"
APP_PASSWORD="xxxx-xxxx-xxxx-xxxx"  # 应用特定密码

# 提交
xcrun altool --notarize-app \
  -f /tmp/CoverTool-notarize.zip \
  --primary-bundle-id "com.taiki.covertool" \
  -u "$APPLE_ID" \
  -p "$APP_PASSWORD"
```

3. **检查公证状态**

Apple 会返回一个 RequestUUID：

```bash
# 检查状态（每 10-15 秒检查一次）
xcrun altool --notarization-info "REQUEST-UUID-HERE" \
  -u "$APPLE_ID" \
  -p "$APP_PASSWORD"
```

公证通常需要 5-30 分钟。状态会显示为：
- `in progress` - 处理中
- `success` - 成功
- `invalid` - 失败

4. **成功后，Staple 公证票据**

```bash
xcrun stapler staple "dist/多功能封面工具-2.0.0.dmg"
```

### 使用脚本自动化公证

我们已提供 `sign-and-notarize.sh` 脚本：

```bash
# 设置环境变量
export APPLE_ID="your-email@example.com"
export APP_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export CERT_NAME="Developer ID Application: Your Name"
export TEAM_ID="ABCD12E34F"

# 运行脚本
bash sign-and-notarize.sh
```

## 故障排除

### 错误：找不到证书

```bash
# 检查证书
security find-identity -v -p codesigning

# 如果没有找到，从 Xcode 生成
xcode-select --install
```

### 公证失败

检查详细错误信息：

```bash
xcrun altool --notarization-info "REQUEST-UUID" \
  -u "$APPLE_ID" \
  -p "$APP_PASSWORD" \
  --verbose
```

常见问题：
- **硬化运行时**: 确保启用了 `hardenedRuntime`
- **权限问题**: 检查 entitlements.plist 中的权限
- **时间戳**: 应用必须使用时间戳服务器签名

### 无法签名

```bash
# 验证证书仍然有效
security find-identity -v -p codesigning | grep "Developer ID"

# 如果过期，需要从 Apple Developer 重新生成
```

## GitHub Actions 集成（可选）

对于自动化构建和公证，可以在 GitHub Actions 中集成：

```yaml
name: Build and Notarize

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: 18
      
      - name: Build and Sign
        env:
          CSC_IDENTITY: ${{ secrets.CSC_IDENTITY }}
          CSC_LINK: ${{ secrets.CSC_LINK }}
          CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_APP_PASSWORD: ${{ secrets.APPLE_APP_PASSWORD }}
        run: npm run build
      
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: dist/*.dmg
          draft: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 安全最佳实践

1. **不要在代码中存储凭据** - 使用环境变量或密钥管理系统
2. **使用应用特定密码** - 而不是 Apple ID 主密码
3. **定期更新证书** - 证书会过期，需要定期续期
4. **保护私钥** - 你的签名证书和私钥要保密
5. **在 CI/CD 中使用 secrets** - GitHub Actions 等平台支持 secrets 管理

## 参考资源

- [Apple Code Signing Guide](https://developer.apple.com/support/code-signing/)
- [electron-builder macOS Configuration](https://www.electron.build/configuration/mac)
- [macOS Gatekeeper](https://support.apple.com/en-us/HT202491)
- [App Notarization](https://developer.apple.com/documentation/xcode/notarizing_macos_software_before_distribution)

## 常见问题

**Q: 我必须公证我的应用吗？**
A: 如果用户从互联网下载你的应用（如 DMG 从 GitHub 下载），macOS 会提示未认证的应用。公证证明你的应用由 Apple 扫描过，提高用户信任度。

**Q: 公证需要多长时间？**
A: 通常 5-30 分钟，但可能需要更长时间。

**Q: 我可以对 DMG 和 ZIP 都公证吗？**
A: 只需要公证 DMG。用户下载 DMG 时，macOS 会检查。ZIP 只是默认格式。

**Q: 证书过期了怎么办？**
A: 需要在 Apple Developer 网站重新生成新的证书，并在 Keychain 中更新。

**Q: 测试公证失败了怎么办？**
A: 检查 entitlements.plist 中的权限是否太宽松，尝试只添加应用真正需要的权限。
