#!/bin/bash

# Chiavow 传统部署一键脚本（不使用 Docker）
# 适用于 Ubuntu 20.04+ / CentOS 7+

set -e

echo "===================================="
echo "  Chiavow 传统部署脚本"
echo "  (Node.js + MySQL + PM2 + Nginx)"
echo "===================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为 root 用户
if [[ $EUID -eq 0 ]]; then
   echo -e "${YELLOW}⚠️  建议不要使用 root 用户运行此脚本${NC}"
   echo "是否继续？(y/n)"
   read -r response
   if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
       exit 1
   fi
fi

# 获取当前目录
DEPLOY_DIR=$(pwd)
SERVER_DIR="$DEPLOY_DIR/server"
CLIENT_DIR="$DEPLOY_DIR/client"

echo -e "${GREEN}✓${NC} 部署目录: $DEPLOY_DIR"
echo ""

# ============================================
# 第一步：检查和安装依赖
# ============================================
echo "===================================="
echo "第一步：检查系统依赖"
echo "===================================="
echo ""

# 检测操作系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo -e "${RED}❌ 无法检测操作系统${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} 操作系统: $OS"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}⚠️  Node.js 未安装${NC}"
    echo "是否安装 Node.js 18？(y/n)"
    read -r install_node
    if [[ "$install_node" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "正在安装 Node.js 18..."
        if [ "$OS" == "ubuntu" ] || [ "$OS" == "debian" ]; then
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif [ "$OS" == "centos" ] || [ "$OS" == "rhel" ]; then
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
            sudo yum install -y nodejs
        else
            echo -e "${RED}❌ 不支持的操作系统，请手动安装 Node.js 18${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Node.js 是必需的，部署终止${NC}"
        exit 1
    fi
else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js 已安装: $NODE_VERSION"
fi

# 检查 MySQL
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}⚠️  MySQL 未安装${NC}"
    echo "是否安装 MySQL？(y/n)"
    read -r install_mysql
    if [[ "$install_mysql" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "正在安装 MySQL..."
        if [ "$OS" == "ubuntu" ] || [ "$OS" == "debian" ]; then
            sudo apt-get update
            sudo apt-get install -y mysql-server
            sudo systemctl start mysql
            sudo systemctl enable mysql
        elif [ "$OS" == "centos" ] || [ "$OS" == "rhel" ]; then
            sudo yum install -y mysql-server
            sudo systemctl start mysqld
            sudo systemctl enable mysqld
        fi
        
        echo ""
        echo -e "${GREEN}✓${NC} MySQL 安装完成"
        echo -e "${YELLOW}⚠️  请设置 MySQL root 密码${NC}"
        sudo mysql_secure_installation
    else
        echo -e "${RED}❌ MySQL 是必需的，部署终止${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓${NC} MySQL 已安装"
fi

# 检查 PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 未安装${NC}"
    echo "正在安装 PM2..."
    sudo npm install -g pm2
    echo -e "${GREEN}✓${NC} PM2 安装完成"
else
    echo -e "${GREEN}✓${NC} PM2 已安装"
fi

# 检查 Nginx
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}⚠️  Nginx 未安装${NC}"
    echo "是否安装 Nginx？(y/n)"
    read -r install_nginx
    if [[ "$install_nginx" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo "正在安装 Nginx..."
        if [ "$OS" == "ubuntu" ] || [ "$OS" == "debian" ]; then
            sudo apt-get install -y nginx
        elif [ "$OS" == "centos" ] || [ "$OS" == "rhel" ]; then
            sudo yum install -y nginx
        fi
        sudo systemctl start nginx
        sudo systemctl enable nginx
        echo -e "${GREEN}✓${NC} Nginx 安装完成"
    else
        echo -e "${YELLOW}⚠️  跳过 Nginx 安装（建议安装用于反向代理）${NC}"
    fi
else
    echo -e "${GREEN}✓${NC} Nginx 已安装"
fi

echo ""
echo -e "${GREEN}✓${NC} 所有依赖检查完成"
echo ""

# ============================================
# 第二步：配置数据库
# ============================================
echo "===================================="
echo "第二步：配置 MySQL 数据库"
echo "===================================="
echo ""

echo "请输入 MySQL root 密码:"
read -s MYSQL_ROOT_PASSWORD
echo ""

# 测试 MySQL 连接
if ! mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1;" &> /dev/null; then
    echo -e "${RED}❌ MySQL 连接失败，请检查密码${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} MySQL 连接成功"

# 创建数据库和用户
DB_NAME="chiavow"
DB_USER="chiavow_user"
echo ""
echo "请设置数据库用户密码 (chiavow_user):"
read -s DB_PASSWORD
echo ""

echo "正在创建数据库和用户..."
mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<MYSQL_SCRIPT
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
MYSQL_SCRIPT

echo -e "${GREEN}✓${NC} 数据库配置完成"
echo ""

# ============================================
# 第三步：配置环境变量
# ============================================
echo "===================================="
echo "第三步：配置环境变量"
echo "===================================="
echo ""

# 生成 JWT_SECRET
echo "正在生成 JWT_SECRET..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
echo -e "${GREEN}✓${NC} JWT_SECRET 已生成"

# 获取域名或 IP
echo ""
echo "请输入服务器域名或 IP 地址 (例如: example.com 或 192.168.1.100):"
read -r SERVER_HOST
if [ -z "$SERVER_HOST" ]; then
    SERVER_HOST="localhost"
fi

CLIENT_URL="http://$SERVER_HOST"

# 邮箱配置
echo ""
echo "是否配置邮箱服务？(用于发送验证码) (y/n)"
read -r config_email
if [[ "$config_email" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "请输入邮箱地址 (Gmail 或 163):"
    read -r EMAIL_USER
    echo "请输入邮箱授权码 (不是登录密码):"
    read -s EMAIL_PASSWORD
    echo ""
else
    EMAIL_USER=""
    EMAIL_PASSWORD=""
fi

# 创建 .env 文件
echo "正在创建 server/.env 配置文件..."
cat > "$SERVER_DIR/.env" <<ENV_FILE
PORT=3001
JWT_SECRET=$JWT_SECRET
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME

# CORS Configuration
CLIENT_URL=$CLIENT_URL

# Email Configuration
EMAIL_USER=$EMAIL_USER
EMAIL_PASSWORD=$EMAIL_PASSWORD
ENV_FILE

echo -e "${GREEN}✓${NC} 环境变量配置完成"
echo ""

# ============================================
# 第四步：安装依赖并构建
# ============================================
echo "===================================="
echo "第四步：安装依赖并构建应用"
echo "===================================="
echo ""

# 安装服务器依赖
echo "正在安装服务器依赖..."
cd "$SERVER_DIR"
npm install
echo -e "${GREEN}✓${NC} 服务器依赖安装完成"

# 构建服务器
echo "正在构建服务器..."
npm run build
echo -e "${GREEN}✓${NC} 服务器构建完成"

# 创建必要的目录
mkdir -p uploads logs
echo -e "${GREEN}✓${NC} 创建上传和日志目录"

# 安装客户端依赖
echo ""
echo "正在安装客户端依赖..."
cd "$CLIENT_DIR"
npm install
echo -e "${GREEN}✓${NC} 客户端依赖安装完成"

# 构建客户端
echo "正在构建客户端..."
npm run build
echo -e "${GREEN}✓${NC} 客户端构建完成"

cd "$DEPLOY_DIR"
echo ""

# ============================================
# 第五步：配置 PM2
# ============================================
echo "===================================="
echo "第五步：配置 PM2 进程管理"
echo "===================================="
echo ""

# 停止旧进程
pm2 stop chiavow-server 2>/dev/null || true
pm2 delete chiavow-server 2>/dev/null || true

# 创建 PM2 配置文件
cat > "$DEPLOY_DIR/ecosystem.config.js" <<PM2_CONFIG
module.exports = {
  apps: [{
    name: 'chiavow-server',
    cwd: '$SERVER_DIR',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '$SERVER_DIR/logs/pm2-error.log',
    out_file: '$SERVER_DIR/logs/pm2-out.log',
    log_file: '$SERVER_DIR/logs/pm2-combined.log',
    time: true
  }]
}
PM2_CONFIG

# 启动服务
echo "正在启动服务..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo -e "${GREEN}✓${NC} PM2 配置完成，服务已启动"
echo ""

# ============================================
# 第六步：配置 Nginx
# ============================================
if command -v nginx &> /dev/null; then
    echo "===================================="
    echo "第六步：配置 Nginx 反向代理"
    echo "===================================="
    echo ""
    
    echo "是否配置 Nginx？(y/n)"
    read -r config_nginx
    if [[ "$config_nginx" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        NGINX_CONF="/etc/nginx/sites-available/chiavow"
        
        # 创建 Nginx 配置
        sudo tee "$NGINX_CONF" > /dev/null <<NGINX_CONFIG
server {
    listen 80;
    server_name $SERVER_HOST;

    # 前端静态文件
    location / {
        root $CLIENT_DIR/dist;
        try_files \$uri \$uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API 代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 日志
    access_log /var/log/nginx/chiavow-access.log;
    error_log /var/log/nginx/chiavow-error.log;
}
NGINX_CONFIG

        # 启用配置
        if [ -d "/etc/nginx/sites-enabled" ]; then
            sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/chiavow
        fi
        
        # 测试配置
        if sudo nginx -t; then
            sudo systemctl reload nginx
            echo -e "${GREEN}✓${NC} Nginx 配置完成"
        else
            echo -e "${RED}❌ Nginx 配置测试失败${NC}"
        fi
        
        echo ""
        echo "如需配置 HTTPS (SSL)，请运行:"
        echo "  sudo apt install certbot python3-certbot-nginx"
        echo "  sudo certbot --nginx -d $SERVER_HOST"
    fi
fi

# ============================================
# 第七步：配置防火墙
# ============================================
echo ""
echo "===================================="
echo "第七步：配置防火墙"
echo "===================================="
echo ""

echo "是否配置防火墙？(y/n)"
read -r config_firewall
if [[ "$config_firewall" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    if command -v ufw &> /dev/null; then
        sudo ufw allow 22/tcp   # SSH
        sudo ufw allow 80/tcp   # HTTP
        sudo ufw allow 443/tcp  # HTTPS
        echo "y" | sudo ufw enable
        echo -e "${GREEN}✓${NC} 防火墙配置完成"
    elif command -v firewall-cmd &> /dev/null; then
        sudo firewall-cmd --permanent --add-service=ssh
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --reload
        echo -e "${GREEN}✓${NC} 防火墙配置完成"
    else
        echo -e "${YELLOW}⚠️  未检测到防火墙工具${NC}"
    fi
fi

# ============================================
# 部署完成
# ============================================
echo ""
echo "===================================="
echo "  🎉 部署完成！"
echo "===================================="
echo ""
echo "访问地址："
echo "  前端: http://$SERVER_HOST"
echo "  API:  http://$SERVER_HOST/api"
echo ""
echo "常用命令："
echo "  查看服务状态: pm2 status"
echo "  查看日志:     pm2 logs chiavow-server"
echo "  重启服务:     pm2 restart chiavow-server"
echo "  停止服务:     pm2 stop chiavow-server"
echo ""
echo "配置文件位置："
echo "  环境变量:   $SERVER_DIR/.env"
echo "  PM2 配置:   $DEPLOY_DIR/ecosystem.config.js"
echo "  Nginx 配置: /etc/nginx/sites-available/chiavow"
echo ""
echo "日志文件："
echo "  PM2 日志:   $SERVER_DIR/logs/"
echo "  Nginx 日志: /var/log/nginx/"
echo ""
echo -e "${GREEN}✓${NC} 请访问 http://$SERVER_HOST 查看您的应用"
echo ""
