#!/bin/bash

# CoverTool macOS 代码签名和公证脚本
# 使用说明：bash ./sign-and-notarize.sh

set -e

echo "🔐 CoverTool macOS 代码签名和公证流程"
echo "========================================"

# 配置变量
APPLE_ID=""              # 替换为你的Apple ID
APP_PASSWORD=""          # 应用密码（从appleid.apple.com生成）
TEAM_ID=""               # 替换为你的Team ID
CERT_NAME=""             # 证书名称（从Keychain获取）
APP_PATH="dist/多功能封面工具.app"
DMG_PATH="dist/多功能封面工具-2.0.0.dmg"

# 步骤1：代码签名
echo ""
echo "📝 步骤1：对应用进行代码签名..."

if [ -z "$CERT_NAME" ]; then
    echo "❌ 请先设置 CERT_NAME 环境变量"
    echo "获取方法: security find-identity -v -p codesigning"
    exit 1
fi

# 签名应用的所有依赖
codesign --force --verify --verbose --sign "$CERT_NAME" \
    "$APP_PATH/Contents/Frameworks"/*.framework 2>/dev/null || true

codesign --force --verify --verbose --sign "$CERT_NAME" \
    "$APP_PATH/Contents/Frameworks"/*.app 2>/dev/null || true

# 签名主应用
codesign --force --verify --verbose --sign "$CERT_NAME" "$APP_PATH"

echo "✅ 代码签名完成"

# 步骤2：对DMG进行签名
echo ""
echo "📝 步骤2：对DMG文件进行签名..."

codesign --force --verbose --sign "$CERT_NAME" "$DMG_PATH"

echo "✅ DMG签名完成"

# 步骤3: 提交公证
echo ""
echo "📝 步骤3：提交应用到Apple进行公证..."

if [ -z "$APPLE_ID" ] || [ -z "$APP_PASSWORD" ]; then
    echo "❌ 请先设置 APPLE_ID 和 APP_PASSWORD 环境变量"
    echo "教程: https://support.apple.com/en-us/HT204397"
    exit 1
fi

# 创建DMG的ZIP用于提交
ZIP_FILE="/tmp/CoverTool-notarize.zip"
ditto -c -k --sequesterRsrc "$DMG_PATH" "$ZIP_FILE"

# 提交公证
REQUEST_UUID=$(xcrun altool --notarize-app \
    -f "$ZIP_FILE" \
    --primary-bundle-id "com.taiki.covertool" \
    -u "$APPLE_ID" \
    -p "$APP_PASSWORD" \
    2>&1 | grep "RequestUUID" | cut -d'=' -f2 | xargs)

echo "📤 公证请求已提交，UUID: $REQUEST_UUID"

# 步骤4: 检查公证状态
echo ""
echo "📝 步骤4：等待和检查公证状态..."

check_notarization() {
    for i in {1..120}; do
        STATUS=$(xcrun altool --notarization-info "$REQUEST_UUID" \
            -u "$APPLE_ID" \
            -p "$APP_PASSWORD" \
            2>&1 | grep "Status:" | cut -d':' -f2 | xargs)
        
        if [ "$STATUS" = "success" ]; then
            echo "✅ 公证成功！"
            return 0
        elif [ "$STATUS" = "invalid" ]; then
            echo "❌ 公证失败，请检查错误日志"
            xcrun altool --notarization-info "$REQUEST_UUID" \
                -u "$APPLE_ID" \
                -p "$APP_PASSWORD"
            return 1
        fi
        
        echo "⏳ 等待中... (${i}/120) 状态: $STATUS"
        sleep 10
    done
    
    echo "⚠️ 公证超时，请稍后手动检查状态："
    echo "xcrun altool --notarization-info $REQUEST_UUID -u $APPLE_ID -p $APP_PASSWORD"
    return 1
}

check_notarization

# 步骤5: Staple（附加公证票据）
echo ""
echo "📝 步骤5：为DMG附加公证票据..."

xcrun stapler staple "$DMG_PATH"

echo "✅ 公证票据已附加"

echo ""
echo "🎉 所有步骤完成！"
echo "应用已签名、公证并可以分发: $DMG_PATH"
