#!/bin/bash

# 变量设置 (你需要修改这里的 DMG_URL 为你真实的 GitHub Release 下载链接)
APP_NAME="多功能封面工具"
APP_DIR_NAME="多功能封面工具.app"
DMG_URL="https://mirror.ghproxy.com/https://github.com/Kirota233/CoverTool/releases/download/v2.0.0/covertool-2.0.0-arm64.dmg"TMP_DIR="/tmp/covertool_install"
DMG_PATH="$TMP_DIR/app.dmg"

echo "========================================"
echo "  开始安装 $APP_NAME ..."
echo "========================================"

# 1. 创建临时下载目录
mkdir -p "$TMP_DIR"

# 2. 下载 DMG 文件 (-L 用于跟随 GitHub 的重定向)
echo "⬇️  正在下载安装包，请稍候..."
curl -L "$DMG_URL" -o "$DMG_PATH"

if [ ! -f "$DMG_PATH" ]; then
    echo "❌ 下载失败，请检查网络或下载链接。"
    exit 1
fi

# 3. 挂载 DMG
echo "💿 正在读取安装包..."
# 挂载并提取挂载点的路径
MOUNT_DIR=$(hdiutil attach "$DMG_PATH" -nobrowse -readonly | grep /Volumes/ | awk -F'\t' '{print $3}')

if [ -z "$MOUNT_DIR" ]; then
    echo "❌ 安装包读取失败！"
    exit 1
fi

# 4. 复制到应用程序文件夹
echo "📂 正在安装到 应用程序(Applications) 文件夹..."
# 如果旧版本存在，先删除
rm -rf "/Applications/$APP_DIR_NAME"
cp -R "$MOUNT_DIR/$APP_DIR_NAME" "/Applications/"

# 5. 卸载 DMG 并清理临时文件
echo "🧹 正在清理临时文件..."
hdiutil detach "$MOUNT_DIR" -quiet
rm -rf "$TMP_DIR"

# 6. 解除 macOS 隔离限制 (修复“已损坏”提示)
echo "🔓 正在解除 macOS 安全限制..."
echo "⚠️  注意：此步骤需要管理员权限，请在下方输入您的电脑开机密码（输入时不会显示字符，输完按回车即可）："
sudo xattr -cr "/Applications/$APP_DIR_NAME"

# 7. 启动应用
echo "✅ 安装成功！正在启动 $APP_NAME..."
open -a "/Applications/$APP_DIR_NAME"

echo "========================================"
echo "  尽情使用吧！"
echo "========================================"