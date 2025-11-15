#!/bin/bash

# Chiavow 一键部署脚本

set -e

echo "===================================="
echo "  Chiavow Docker 部署脚本"
echo "===================================="
echo ""

# 检查 Docker 和 Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

echo "✅ Docker 环境检查通过"
echo ""

# 检查环境配置文件
if [ ! -f .env.production ]; then
    echo "⚠️  未找到 .env.production 文件"
    echo ""
    
    if [ -f .env.production.example ]; then
        echo "是否从示例文件创建配置？(y/n)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            cp .env.production.example .env.production
            echo "✅ 已创建 .env.production"
            echo ""
            echo "⚠️  重要：请编辑 .env.production 文件，填入正确的配置！"
            echo "   必须修改："
            echo "   - JWT_SECRET (生成命令: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\")"
            echo "   - DB_ROOT_PASSWORD"
            echo "   - DB_PASSWORD"
            echo "   - CLIENT_URL"
            echo "   - EMAIL_USER"
            echo "   - EMAIL_PASSWORD"
            echo ""
            echo "是否现在编辑？(y/n)"
            read -r edit_response
            if [[ "$edit_response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
                ${EDITOR:-nano} .env.production
            else
                echo "请手动编辑 .env.production 后重新运行此脚本"
                exit 1
            fi
        else
            echo "❌ 部署取消"
            exit 1
        fi
    else
        echo "❌ 未找到 .env.production.example 文件"
        exit 1
    fi
fi

echo "✅ 配置文件就绪"
echo ""

# 询问是否构建
echo "开始部署？(y/n)"
read -r deploy_response
if [[ ! "$deploy_response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "❌ 部署取消"
    exit 1
fi

echo ""
echo "🚀 开始构建和部署..."
echo ""

# 停止旧容器
echo "📦 停止旧容器..."
docker-compose down 2>/dev/null || true

# 构建并启动
echo "🔨 构建镜像..."
docker-compose --env-file .env.production build

echo "🚀 启动服务..."
docker-compose --env-file .env.production up -d

# 等待服务启动
echo ""
echo "⏳ 等待服务启动..."
sleep 5

# 检查服务状态
echo ""
echo "📊 服务状态："
docker-compose ps

echo ""
echo "✅ 部署完成！"
echo ""
echo "访问地址："
echo "  - 前端：http://localhost"
echo "  - API：http://localhost:3001"
echo ""
echo "查看日志："
echo "  docker-compose logs -f"
echo ""
echo "停止服务："
echo "  docker-compose down"
echo ""
