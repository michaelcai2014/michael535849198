#!/bin/bash

# Tunda项目管理系统启动脚本

echo "🚀 启动Tunda项目管理系统..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

# 检查MongoDB是否运行
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  警告: MongoDB未运行，请先启动MongoDB服务"
    echo "   在macOS上可以使用: brew services start mongodb-community"
    echo "   或者直接运行: mongod"
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖包..."
    npm install
fi

# 检查配置文件
if [ ! -f "config.env" ]; then
    echo "⚙️  创建配置文件..."
    cp config.env.example config.env 2>/dev/null || {
        echo "📝 创建默认配置文件..."
        cat > config.env << EOF
# 数据库配置
MONGODB_URI=mongodb://localhost:27017/tunda_project_management

# JWT密钥
JWT_SECRET=tunda_project_management_secret_key_2024

# 微信配置（需要替换为真实值）
WECHAT_APPID=your_wechat_appid
WECHAT_SECRET=your_wechat_secret

# 服务器配置
PORT=3000
NODE_ENV=development

# 管理员默认账号
ADMIN_USERNAME=Michael
ADMIN_PASSWORD=123456
EOF
    }
    echo "✅ 配置文件已创建，请根据需要修改 config.env 文件"
fi

# 创建日志目录
mkdir -p logs

echo "🎯 启动应用..."
echo "   访问地址: http://localhost:3000"
echo "   管理员账号: Michael / 123456"
echo "   按 Ctrl+C 停止服务"
echo ""

# 启动应用
npm start
