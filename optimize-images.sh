#!/bin/bash

# 🚀 FitGenius AI - 图片优化脚本
# 这个脚本会帮助你压缩背景图片,提升性能

echo "🚀 FitGenius AI - 图片优化工具"
echo "================================"
echo ""

# 检查是否安装了 ImageMagick
if ! command -v convert &> /dev/null; then
    echo "❌ 未检测到 ImageMagick"
    echo ""
    echo "请先安装 ImageMagick:"
    echo "  brew install imagemagick"
    echo ""
    echo "或者使用在线工具:"
    echo "  1. 访问 https://tinypng.com"
    echo "  2. 上传 background.jpg"
    echo "  3. 下载压缩后的文件"
    echo "  4. 替换原文件"
    echo ""
    exit 1
fi

# 检查背景图片是否存在
if [ ! -f "background.jpg" ]; then
    echo "❌ 未找到 background.jpg"
    exit 1
fi

# 获取原始文件大小
ORIGINAL_SIZE=$(du -h background.jpg | cut -f1)
echo "📊 原始文件大小: $ORIGINAL_SIZE"
echo ""

# 备份原始文件
echo "💾 备份原始文件..."
cp background.jpg background.jpg.backup
echo "✅ 已备份到 background.jpg.backup"
echo ""

# 压缩图片 (质量 80%, 最大宽度 1920px)
echo "🔧 正在压缩图片..."
convert background.jpg -quality 80 -resize '1920x1080>' background-optimized.jpg

# 获取压缩后的文件大小
OPTIMIZED_SIZE=$(du -h background-optimized.jpg | cut -f1)
echo "✅ 压缩完成!"
echo ""

# 显示结果
echo "📊 压缩结果:"
echo "  原始大小: $ORIGINAL_SIZE"
echo "  压缩后: $OPTIMIZED_SIZE"
echo ""

# 询问是否替换
read -p "是否替换原文件? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    mv background-optimized.jpg background.jpg
    echo "✅ 已替换原文件"
    echo ""
    echo "🎉 优化完成! 请重启项目查看效果:"
    echo "  pnpm dev"
else
    echo "❌ 已取消替换"
    echo "  压缩后的文件保存为: background-optimized.jpg"
    rm background-optimized.jpg
fi

echo ""
echo "💡 提示: 如果还想进一步优化,可以:"
echo "  1. 转换为 WebP 格式 (减少 30-50% 大小)"
echo "  2. 使用 TinyPNG (https://tinypng.com) 获得更好的压缩"
echo ""
