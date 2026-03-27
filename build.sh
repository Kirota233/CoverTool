#!/bin/bash

echo "========================================="
echo "🚀 开始打包 CoverTool Electron 应用"
echo "========================================="
echo ""

# 检查是否安装了 npm 依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

echo ""
echo "🔨 开始构建（Mac）..."
echo ""


# 执行打包
npm run build

echo ""
echo "========================================="
echo "✅ 打包完成！"
echo "========================================="
echo ""
echo "📁 输出文件位置: ./dist/"
echo ""
echo "📝 说明："
echo "  • DMG 文件：可直接在 Mac 上安装"
echo "  • ZIP 文件：轻量级版本（无 DMG 外壳）"
echo ""
echo "🔒 关于 Gatekeeper 警告："
echo "  如果在 Mac 上打开时显示\"安装包损坏\"或\"无法验证开发者\"："
echo ""
echo "  方案 1（推荐开发者）："
echo "    1. 打开「终端」"
echo "    2. 运行：xcode-select --install"
echo "    3. 然后运行：codesign -s - ./dist/自动化封面合成器.app"
echo ""
echo "  方案 2（用户端）："
echo "    1. 右键点击应用 → 打开"
echo "    2. 点击\"打开\""
echo "    3. 输入密码确认"
echo ""
echo "=========================================\n"
