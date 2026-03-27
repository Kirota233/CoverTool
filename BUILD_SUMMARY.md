# CoverTool 打包完成汇总

## ✅ 打包状态：成功

**打包时间：** 2026-03-27  
**最终输出路径：** `./dist/`  
**包含架构：** x64 (Intel) + arm64 (Apple Silicon)

---

## 📦 生成的文件

```
dist/
├── 自动化封面合成器-1.0.0.dmg          (120MB) - Intel Mac DMG
├── 自动化封面合成器-1.0.0-mac.zip      (114MB) - Intel Mac ZIP
├── 自动化封面合成器-1.0.0-arm64.dmg    (115MB) - Apple Silicon DMG
└── 自动化封面合成器-1.0.0-arm64-mac.zip (109MB) - Apple Silicon ZIP
```

---

## 🔧 配置变更

### 1. package.json - build 配置
```json
{
  "build": {
    "mac": {
      "sign": null,
      "identity": null,
      "gatekeeperAssess": false,
      "hardenedRuntime": true,
      "entitlements": "build/entitlements.mac.plist",
      "entitlementsInherit": "build/entitlements.mac.plist"
    }
  }
}
```

**目的：**
- `sign: null` - 禁用代码签名（避免 Gatekeeper 报错）
- `gatekeeperAssess: false` - 跳过 Gatekeeper 资源评估
- `entitlements` - 声明应用权限（文件访问、网络等）

### 2. 创建 entitlements.mac.plist
文件位置：`build/entitlements.mac.plist`

包含的权限：
- ✅ 文件系统访问（下载、用户选择的文件）
- ✅ 网络访问（HTTP/HTTPS）
- ✅ 临时文件访问（/tmp, /var/folders）
- ✅ JIT 编译和无符号执行内存（Electron 需要）

### 3. build.sh 脚本
自动化打包脚本，包含详细说明文本

---

## 🛡️ Mac 上的"安装包损坏"处理

### 为什么会出现？
macOS Gatekeeper 要求应用被代码签名，未签名的应用会被拦截。

### 为什么我们跳过签名？
- ✅ 避免复杂的证书管理
- ✅ 支持所有 Mac 用户（无需 Apple Developer 账户）
- ✅ 用户可用"右键打开"轻松绕过

### 用户解决方案（3 种选择）

**最简单（推荐）：** 右键点击 → 打开 → 输入密码

**开发者：** 运行以下命令自签名
```bash
codesign -s - /Applications/自动化封面合成器.app
```

**进阶：** 临时豁免 Gatekeeper
```bash
sudo spctl --add --label 'CoverTool' /Applications/自动化封面合成器.app
```

---

## 📋 文件结构

打包包含的文件：
- ✅ main.js（主进程）
- ✅ renderer.js、renderer-embed.js、renderer-remove.js（渲染进程）
- ✅ HTML 文件（所有 UI）
- ✅ package.json
- ✅ node_modules/（所有依赖，包括 FFmpeg 静态版本）
- ✅ fonts/（字体资源）

特殊处理：
- `ffmpeg-static` 被标记为 `asarUnpack` - 直接包含二进制可执行文件

---

## 🚀 后续操作

### 分发给用户
1. 选择合适架构的 DMG 或 ZIP 文件
2. 上传到云盘/网站供用户下载
3. 分享 [MAC_INSTALLATION_GUIDE.md](MAC_INSTALLATION_GUIDE.md)（安装指南）

### 更新应用
修改代码后，重新运行：
```bash
./build.sh
```

### 未来改进（可选）
如果要上线正式版本，可考虑：
- 🔒 购买 Apple Developer 证书进行正式签名
- 🍎 向 Apple 提交 notarization 请求
- 📦 上架到 Mac App Store

但对于内部团队使用，当前配置已足够。

---

## ✨ 验证打包成功

```bash
# 检查应用结构
file dist/自动化封面合成器-1.0.0.dmg

# 预期输出：bzip2 compressed data, block size = 900k
```

✅ 所有输出文件已生成  
✅ 配置已优化避免 Mac 安全警告  
✅ 包含 Intel 和 Apple Silicon 双架构  
✅ 完整的使用文档已生成

---

**需要帮助？** 查看 [MAC_INSTALLATION_GUIDE.md](MAC_INSTALLATION_GUIDE.md) 获取详细說明。
