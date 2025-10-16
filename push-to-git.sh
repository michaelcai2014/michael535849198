#!/bin/bash

# Tunda项目管理系统 - Git推送脚本
# 使用方法：./push-to-git.sh <您的Git仓库地址>

echo "🚀 Tunda项目管理系统 - Git推送脚本"
echo "========================================"

# 检查是否提供了仓库地址
if [ -z "$1" ]; then
    echo ""
    echo "❌ 错误：请提供Git仓库地址"
    echo ""
    echo "使用方法："
    echo "  ./push-to-git.sh https://github.com/YOUR_USERNAME/tunda-project-management.git"
    echo ""
    echo "或者："
    echo "  ./push-to-git.sh git@github.com:YOUR_USERNAME/tunda-project-management.git"
    echo ""
    exit 1
fi

REPO_URL=$1

echo ""
echo "📍 仓库地址: $REPO_URL"
echo ""

# 检查是否已有远程仓库
if git remote | grep -q "origin"; then
    echo "⚠️  检测到已存在的origin远程仓库"
    echo "当前origin: $(git remote get-url origin)"
    echo ""
    read -p "是否要替换为新的仓库地址？(y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 移除旧的origin..."
        git remote remove origin
        echo "✅ 已移除"
    else
        echo "❌ 操作已取消"
        exit 1
    fi
fi

# 添加远程仓库
echo "➕ 添加远程仓库..."
git remote add origin "$REPO_URL"

if [ $? -eq 0 ]; then
    echo "✅ 远程仓库添加成功"
else
    echo "❌ 添加远程仓库失败"
    exit 1
fi

# 确认分支名称
echo ""
echo "🔍 检查本地分支..."
CURRENT_BRANCH=$(git branch --show-current)
echo "当前分支: $CURRENT_BRANCH"

# 推送代码
echo ""
echo "📤 推送代码到远程仓库..."
git push -u origin $CURRENT_BRANCH

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 成功！代码已推送到Git仓库"
    echo ""
    echo "📊 仓库信息："
    echo "   远程地址: $REPO_URL"
    echo "   分支: $CURRENT_BRANCH"
    echo "   提交数: $(git rev-list --count HEAD)"
    echo ""
    echo "👥 您的同事现在可以克隆代码："
    echo "   git clone $REPO_URL"
    echo ""
    echo "📚 部署指南请查看: DEPLOYMENT_GUIDE.md"
    echo ""
else
    echo ""
    echo "❌ 推送失败"
    echo ""
    echo "可能的原因："
    echo "1. 网络连接问题"
    echo "2. 没有推送权限"
    echo "3. 需要先配置SSH密钥（如使用git@格式）"
    echo ""
    echo "💡 如果使用SSH，请先配置SSH密钥："
    echo "   ssh-keygen -t ed25519 -C \"your_email@example.com\""
    echo "   cat ~/.ssh/id_ed25519.pub"
    echo "   # 然后在GitHub Settings → SSH Keys 中添加"
    echo ""
    exit 1
fi

