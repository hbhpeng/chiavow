# Docker 部署指南

## 快速开始

### 1. 准备服务器环境

**服务器要求**：
- Ubuntu 20.04+ 或 CentOS 7+
- 至少 2GB RAM
- 20GB 硬盘空间
- Docker 和 Docker Compose

**安装 Docker**：
```bash
# Ubuntu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 2. 上传代码到服务器

```bash
# 在本地打包代码（排除不必要的文件）
cd /path/to/chiavow
tar -czf chiavow.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=server/dist \
  --exclude=client/dist \
  --exclude=server/uploads \
  --exclude=server/logs \
  .

# 上传到服务器
scp chiavow.tar.gz username@your_server_ip:/home/username/

# 在服务器上解压
ssh username@your_server_ip
mkdir -p /opt/chiavow
cd /opt/chiavow
tar -xzf ~/chiavow.tar.gz
```

### 3. 配置生产环境变量

```bash
cd /opt/chiavow

# 生成安全的 JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 创建生产环境配置文件
cp .env.production.example .env.production

# 编辑配置文件
nano .env.production
```

**必须修改的配置**：
```env
# 使用前面生成的密钥
JWT_SECRET=你生成的64位随机字符串

# 数据库密码（设置强密码）
DB_ROOT_PASSWORD=your_strong_root_password
DB_PASSWORD=your_strong_db_password

# 你的域名
CLIENT_URL=https://yourdomain.com

# 邮箱配置
EMAIL_USER=your_email@163.com
EMAIL_PASSWORD=your_authorization_code
```

### 4. 构建并启动服务

```bash
# 使用生产环境配置文件启动
docker-compose --env-file .env.production up -d --build

# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 5. 配置 Nginx 反向代理（推荐）

如果你想使用域名和 SSL，建议在服务器上再配置一层 Nginx：

```bash
# 安装 Nginx
sudo apt install nginx certbot python3-certbot-nginx

# 创建配置文件
sudo nano /etc/nginx/sites-available/chiavow
```

**Nginx 配置**：
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # 前端
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# 启用配置
sudo ln -s /etc/nginx/sites-available/chiavow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 配置 SSL 证书
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 6. 配置防火墙

```bash
# 允许必要的端口
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## 常用运维命令

### 查看服务状态
```bash
docker-compose ps
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f db
```

### 重启服务
```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart api
```

### 停止服务
```bash
docker-compose down
```

### 更新应用
```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose --env-file .env.production up -d --build
```

### 数据库备份
```bash
# 备份数据库
docker exec chiavow-db mysqldump -u root -p'your_root_password' chiavow > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复数据库
docker exec -i chiavow-db mysql -u root -p'your_root_password' chiavow < backup_file.sql
```

### 查看容器资源使用
```bash
docker stats
```

### 进入容器调试
```bash
# 进入 API 容器
docker exec -it chiavow-api sh

# 进入数据库容器
docker exec -it chiavow-db mysql -u root -p
```

## 自动备份脚本

创建自动备份脚本：
```bash
nano ~/backup-chiavow.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/chiavow"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 备份数据库
docker exec chiavow-db mysqldump -u root -p'your_root_password' chiavow | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# 保留最近 7 天的备份
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/db_$DATE.sql.gz"
```

```bash
# 添加执行权限
chmod +x ~/backup-chiavow.sh

# 设置定时任务（每天凌晨 2 点）
crontab -e
# 添加：
0 2 * * * /home/username/backup-chiavow.sh
```

## 监控和日志

### 日志持久化
日志已自动保存到 `./server/logs` 目录，并通过 Docker volume 持久化。

### 查看实时日志
```bash
# 查看最近 100 行日志
docker-compose logs --tail=100 -f api
```

## 故障排查

### 服务无法启动
```bash
# 检查日志
docker-compose logs

# 检查端口占用
sudo lsof -i :3001
sudo lsof -i :80
sudo lsof -i :3306
```

### 数据库连接失败
```bash
# 检查数据库是否健康
docker exec chiavow-db mysqladmin ping -h localhost -u root -p

# 进入数据库检查
docker exec -it chiavow-db mysql -u root -p
```

### 邮件发送失败
检查 `.env.production` 中的邮箱配置是否正确。对于中国用户，推荐使用 163 邮箱。

## 安全建议

1. **修改默认密码**：确保修改所有默认密码
2. **使用强密码**：数据库密码至少 16 位，包含大小写字母、数字和特殊字符
3. **定期更新**：定期更新 Docker 镜像和系统
4. **限制端口访问**：只开放必要的端口
5. **启用 SSL**：生产环境必须使用 HTTPS
6. **定期备份**：设置自动备份任务
7. **监控日志**：定期检查异常日志

## 性能优化

### 数据库优化
```bash
# 进入数据库容器
docker exec -it chiavow-db mysql -u root -p

# 执行优化
OPTIMIZE TABLE users, orders, verification_codes;
```

### 清理旧数据
```bash
# 清理过期的验证码（可以设置定时任务）
docker exec chiavow-db mysql -u root -p'your_root_password' chiavow -e "DELETE FROM verification_codes WHERE expiresAt < NOW() - INTERVAL 7 DAY;"
```

## 扩展部署

如果需要高可用部署，可以考虑：
- 使用 Docker Swarm 或 Kubernetes
- 配置负载均衡器（如 HAProxy）
- 使用外部托管的数据库（如 AWS RDS）
- 配置 Redis 缓存
- 使用 CDN 加速静态资源
