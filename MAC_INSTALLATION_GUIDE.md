# 多功能封面工具 - Mac 安装指南

## 🎉 打包完成！

您的多功能封面工具应用已成功打包。以下文件已生成到 `dist/` 目录：

### 📦 文件说明

| 文件 | 大小 | 说明 |
|------|------|------|
| `多功能封面工具-2.0.0.dmg` | ~120MB | Intel Mac (x64) - DMG 格式|
| `多功能封面工具-2.0.0-mac.zip` | ~114MB | Intel Mac (x64) - ZIP 格式 |
| `多功能封面工具-2.0.0-arm64.dmg` | ~115MB | Apple Silicon Mac (M1/M2/M3) - DMG 格式 |
| `多功能封面工具-2.0.0-arm64-mac.zip` | ~109MB | Apple Silicon Mac (M1/M2/M3) - ZIP 格式 |

**选择您对应的 Mac 版本：**
- Intel Mac (旧型号) → 使用 `x64` 版本
- Apple Silicon Mac (M1/M2/M3+) → 使用 `arm64` 版本

---

## 📲 安装方式

### 方式 1：使用 DMG 文件（推荐）

1. 双击 `.dmg` 文件打开安装器
2. 将「多功能封面工具」图标拖到「Applications」文件夹
3. 等待复制完成
4. 打开「应用程序」找到应用并运行

### 方式 2：使用 ZIP 文件

1. 双击 `.zip` 文件自动解压
2. 将解压出的「多功能封面工具.app」移到「应用程序」文件夹
3. 启动应用

---

## ⚠️ 如果出现「安装包损坏」或「无法验证开发者」错误

### 原因
这是 macOS Gatekeeper 的安全机制，因为该应用没有经过 Apple 官方代码签名。

### 解决方案

#### 方案 A：右键菜单打开（最简单）
1. 找到应用
2. **右键点击**「多功能封面工具」
3. 选择「打开」
4. 在弹出对话框点击「打开」
5. 输入您的 Mac 密码确认

> **提示：** 之后就可以正常双击打开了

#### 方案 B：用终端重新签名（需要 Xcode）

```bash
# 1. 首先安装 Xcode Command Line Tools（如果还未安装）
xcode-select --install

# 2. 对应用进行自签名
codesign -s - /Applications/多功能封面工具.app

# 3. 验证签名
codesign -v /Applications/多功能封面工具.app
```

#### 方案 C：临时禁用 Gatekeeper（不推荐）

```bash
# 为该应用豁免 Gatekeeper
sudo spctl --add --label 'CoverTool' /Applications/多功能封面工具.app
```

---

## 🚀 首次运行

1. 打开应用后会显示主菜单，有 3 个功能：
   - **🖼️ 生成封面** - 批量生成视频封面
   - **🎥 嵌入封面** - 将封面嵌入视频首帧
   - **✂️ 删除帧** - 批量删除视频首帧

2. 选择需要的功能开始使用

---

## 🔧 重新打包

如需重新打包（例如修改代码后），运行：

```bash
./build.sh
```

或手动执行：

```bash
export CSC_IDENTITY_AUTO_DISCOVERY=false
npm run build
```

---

## 💡 常见问题

**Q：我应该选择 DMG 还是 ZIP？**  
A：DMG 更正式，推荐发给其他用户。ZIP 更轻便，自己用 ZIP 也可以。

**Q：为什么文件这么大？**  
A：包含了完整的 Electron 运行时和 FFmpeg，大概 100+ MB 属于正常。

**Q：应用能否上架 App Store？**  
A：不能。App Store 需要特殊签名和审核。这种打包方式适合个人或团队内部使用。

**Q：如何卸载？**  
A：直接将应用从「应用程序」文件夹删除到废纸篓即可。

---

## 📝 版本信息

- **应用版本：** 2.0.0
- **应用名称：** 多功能封面工具
- **Electron 版本：** 29.4.6
- **FFmpeg：** 已集成
- **支持系统：** macOS 10.12 及以上

---

祝您使用愉快！🎉
