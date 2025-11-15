# Chiavow 部署指南（中文）

## 快速部署到阿里云

### 前置条件
- 阿里云账号
- 一台 ECS 云服务器实例（Ubuntu 20.04 推荐）
- 域名（可选）

### 详细步骤

#### 1. 购买和配置 ECS 实例

1. 登录阿里云控制台
2. 进入 ECS 控制台，购买实例
   - 操作系统选择：Ubuntu 20.04 64位
   - 配置建议：2核4G内存（入门级）
   - 带宽：按实际需求选择
3. 配置安全组规则，开放以下端口：
   - 80 (HTTP)
   - 443 (HTTPS)
   - 22 (SSH)
4. 记录公网IP地址

#### 2. 连接到服务器

```bash
ssh root@你的服务器IP
```

#### 3. 安装必要软件

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 安装 PM2 进程管理器
npm install -g pm2

# 安装 Nginx
apt install -y nginx

# 安装 Git
apt install -y git
```

#### 4. 上传项目代码

方式一：使用 Git（推荐）
```bash
cd /root
git clone 你的代码仓库地址
cd chiavow
```

方式二：使用 SCP 上传
```bash
# 在本地机器上执行
cd chiavow
tar -czf chiavow.tar.gz client server README.md

# 上传到服务器
scp chiavow.tar.gz root@你的服务器IP:/root/

# 在服务器上解压
ssh root@你的服务器IP
cd /root
tar -xzf chiavow.tar.gz
```

#### 5. 部署后端

```bash
cd /root/chiavow/server

# 安装依赖
npm install --production

# 构建项目
npm run build

# 创建生产环境配置文件
cat > .env << EOF
PORT=3001
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
EOF

# 创建上传文件夹
mkdir -p uploads

# 使用 PM2 启动服务
pm2 start dist/index.js --name chiavow-api

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
# 执行上面命令输出的命令
```

#### 6. 构建前端

```bash
cd /root/chiavow/client

# 安装依赖
npm install

# 构建生产版本
npm run build

# 构建后的文件在 dist 目录
```

#### 7. 配置 Nginx

```bash
# 创建 Nginx 配置文件
nano /etc/nginx/sites-available/chiavow
```

复制以下内容（记得替换 your-domain.com 为你的域名或IP）：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或IP

    # 前端静态文件
    location / {
        root /root/chiavow/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # 上传的文件
    location /uploads {
        proxy_pass http://localhost:3001;
    }

    # 文件上传大小限制
    client_max_body_size 10M;
}
```

启用配置：
```bash
# 创建软链接
ln -s /etc/nginx/sites-available/chiavow /etc/nginx/sites-enabled/

# 删除默认配置（可选）
rm /etc/nginx/sites-enabled/default

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
systemctl enable nginx
```

#### 8. 配置 SSL 证书（推荐）

```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书（需要先将域名解析到服务器IP）
certbot --nginx -d your-domain.com

# 证书会自动续期，查看自动续期状态
systemctl status certbot.timer
```

#### 9. 配置防火墙

```bash
# 安装并配置 UFW
apt install -y ufw

# 允许必要端口
ufw allow 'Nginx Full'
ufw allow OpenSSH

# 启用防火墙
ufw enable

# 查看状态
ufw status
```

#### 10. 验证部署

```bash
# 检查后端服务状态
pm2 status
pm2 logs chiavow-api

# 检查 Nginx 状态
systemctl status nginx

# 测试 API
curl http://localhost:3001/api/health
```

访问你的域名或IP地址，应该可以看到应用了！

### 日常维护

#### 查看日志
```bash
# 后端日志
pm2 logs chiavow-api

# Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

#### 重启服务
```bash
# 重启后端
pm2 restart chiavow-api

# 重启 Nginx
systemctl restart nginx
```

#### 更新应用
```bash
# 更新后端
cd /root/chiavow/server
git pull  # 如果使用 Git
npm install
npm run build
pm2 restart chiavow-api

# 更新前端
cd /root/chiavow/client
git pull  # 如果使用 Git
npm install
npm run build
# Nginx 会自动使用新的静态文件
```

#### 备份数据
```bash
# 创建备份脚本
cat > /root/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份上传的文件
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /root/chiavow/server/uploads

# 备份配置文件
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /root/chiavow/server/.env

# 保留最近7天的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /root/backup.sh

# 设置每天自动备份
crontab -e
# 添加：0 2 * * * /root/backup.sh
```

### 监控和告警

#### 安装监控工具
```bash
# 安装 htop（实时监控）
apt install -y htop

# 使用 PM2 监控
pm2 monit
```

### 性能优化建议

1. **启用 Nginx 缓存**
```nginx
# 在 nginx 配置中添加
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

2. **启用 Gzip 压缩**
```bash
# 编辑 /etc/nginx/nginx.conf
nano /etc/nginx/nginx.conf

# 取消以下行的注释：
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

3. **优化 Node.js 性能**
```bash
# 在 PM2 配置中使用集群模式
pm2 start dist/index.js --name chiavow-api -i max
```

### 故障排查

#### 后端无法访问
```bash
# 检查进程
pm2 status

# 查看日志
pm2 logs chiavow-api --lines 100

# 检查端口
netstat -tlnp | grep 3001
```

#### 前端无法访问
```bash
# 检查 Nginx 状态
systemctl status nginx

# 检查配置
nginx -t

# 查看错误日志
tail -f /var/log/nginx/error.log
```

#### 文件上传失败
```bash
# 检查上传目录权限
ls -la /root/chiavow/server/uploads
chmod 755 /root/chiavow/server/uploads

# 检查 Nginx 配置中的文件大小限制
grep client_max_body_size /etc/nginx/sites-available/chiavow
```

### 安全建议

1. 修改默认 SSH 端口
2. 禁用 root 密码登录，使用 SSH 密钥
3. 定期更新系统和软件包
4. 使用防火墙限制访问
5. 定期备份数据
6. 使用强密码和 JWT 密钥
7. 启用 HTTPS
8. 实施 API 请求频率限制

### 成本估算（阿里云）

- **基础配置**（2核4G，40G硬盘，5M带宽）：约 ¥100-150/月
- **域名**：约 ¥50-100/年
- **SSL证书**：免费（Let's Encrypt）

总计：约 ¥100-150/月

### 技术支持

如有问题，请查看：
1. 项目 README.md
2. 后端日志：`pm2 logs chiavow-api`
3. Nginx 日志：`/var/log/nginx/error.log`

---

部署完成后，记得：
- [ ] 修改 JWT_SECRET
- [ ] 配置域名解析
- [ ] 启用 SSL 证书
- [ ] 设置定期备份
- [ ] 配置监控告警
- [ ] 修改默认配置
