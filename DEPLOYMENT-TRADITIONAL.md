# 传统部署指南（不使用 Docker）

## 🚀 一键部署

使用一键部署脚本，自动完成所有配置：

```bash
# 上传代码到服务器后，运行：
chmod +x deploy-traditional.sh
./deploy-traditional.sh
```

脚本会自动完成：
1. ✅ 检查和安装依赖（Node.js, MySQL, PM2, Nginx）
2. ✅ 配置 MySQL 数据库
3. ✅ 生成安全的环境变量
4. ✅ 构建前后端代码
5. ✅ 配置 PM2 进程管理
6. ✅ 配置 Nginx 反向代理
7. ✅ 配置防火墙

**预计耗时：5-10 分钟**

---

## 📋 前提条件

### 服务器要求
- **操作系统**：Ubuntu 20.04+ 或 CentOS 7+
- **内存**：至少 1GB RAM（推荐 2GB）
- **硬盘**：至少 10GB 可用空间
- **权限**：需要 sudo 权限

### 需要准备的信息
部署过程中会询问：
1. MySQL root 密码
2. 数据库用户密码
3. 服务器域名或 IP
4. 邮箱配置（可选）

---

## 📦 部署步骤详解

### 1. 上传代码到服务器

**方式一：使用 Git**
```bash
# 在服务器上
cd /opt
sudo git clone https://github.com/your-repo/chiavow.git
cd chiavow
```

**方式二：使用 SCP**
```bash
# 在本地
cd /path/to/chiavow
tar -czf chiavow.tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=server/dist \
  --exclude=client/dist \
  .

scp chiavow.tar.gz username@your_server_ip:/home/username/

# 在服务器上
mkdir -p /opt/chiavow
cd /opt/chiavow
tar -xzf ~/chiavow.tar.gz
```

### 2. 运行部署脚本

```bash
cd /opt/chiavow
chmod +x deploy-traditional.sh
./deploy-traditional.sh
```

### 3. 按照提示完成配置

脚本会交互式地询问配置信息，按照提示输入即可。

---

## 🔧 手动部署（可选）

如果不想使用一键脚本，也可以手动部署：

### 1. 安装依赖

```bash
# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 MySQL
sudo apt-get install -y mysql-server
sudo mysql_secure_installation

# 安装 PM2
sudo npm install -g pm2

# 安装 Nginx
sudo apt-get install -y nginx
```

### 2. 配置数据库

```bash
# 登录 MySQL
sudo mysql -u root -p

# 创建数据库和用户
CREATE DATABASE chiavow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'chiavow_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON chiavow.* TO 'chiavow_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. 配置环境变量

```bash
# 生成 JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 创建 server/.env
nano server/.env
```

填入：
```env
PORT=3001
JWT_SECRET=<生成的密钥>
NODE_ENV=production

DB_HOST=localhost
DB_PORT=3306
DB_USER=chiavow_user
DB_PASSWORD=<数据库密码>
DB_NAME=chiavow

CLIENT_URL=http://your-domain.com
EMAIL_USER=your_email@163.com
EMAIL_PASSWORD=<邮箱授权码>
```

### 4. 构建应用

```bash
# 构建服务器
cd server
npm install --production
npm run build
mkdir -p uploads logs

# 构建客户端
cd ../client
npm install
npm run build
```

### 5. 启动服务

```bash
# 使用 PM2 启动
cd ..
pm2 start server/dist/index.js --name chiavow-server
pm2 save
pm2 startup
```

### 6. 配置 Nginx

```bash
sudo nano /etc/nginx/sites-available/chiavow
```

配置内容：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /opt/chiavow/client/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/chiavow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔐 配置 HTTPS (SSL)

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期测试
sudo certbot renew --dry-run
```

证书会自动每 90 天续期。

---

## 📊 运维管理

### PM2 常用命令

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs chiavow-server
pm2 logs chiavow-server --lines 100

# 重启服务
pm2 restart chiavow-server

# 停止服务
pm2 stop chiavow-server

# 删除服务
pm2 delete chiavow-server

# 查看详细信息
pm2 info chiavow-server

# 监控资源
pm2 monit
```

### 应用更新

```bash
# 1. 备份数据库
mysqldump -u chiavow_user -p chiavow > backup_$(date +%Y%m%d).sql

# 2. 拉取最新代码
cd /opt/chiavow
git pull

# 3. 重新构建
cd server
npm install --production
npm run build

cd ../client
npm install
npm run build

# 4. 重启服务
pm2 restart chiavow-server
```

### 数据库管理

```bash
# 备份数据库
mysqldump -u chiavow_user -p chiavow > backup.sql

# 恢复数据库
mysql -u chiavow_user -p chiavow < backup.sql

# 连接数据库
mysql -u chiavow_user -p chiavow

# 查看数据库大小
mysql -u chiavow_user -p -e "
  SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
  FROM information_schema.tables 
  WHERE table_schema = 'chiavow'
  GROUP BY table_schema;
"
```

### 日志管理

```bash
# 查看 PM2 日志
pm2 logs chiavow-server

# 查看应用日志
tail -f /opt/chiavow/server/logs/app.log

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/chiavow-access.log
sudo tail -f /var/log/nginx/chiavow-error.log

# 清理旧日志
pm2 flush

# 日志轮转（自动配置）
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 🛡️ 安全加固

### 1. 配置防火墙

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable

# FirewallD (CentOS)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. 修改 SSH 端口（可选）

```bash
# 编辑 SSH 配置
sudo nano /etc/ssh/sshd_config

# 修改端口（例如改为 2222）
Port 2222

# 重启 SSH
sudo systemctl restart sshd

# 记得在防火墙中开放新端口
sudo ufw allow 2222/tcp
```

### 3. 配置 Fail2ban

```bash
# 安装 Fail2ban
sudo apt install fail2ban

# 配置
sudo nano /etc/fail2ban/jail.local
```

添加：
```ini
[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/chiavow-error.log
maxretry = 10
```

启动：
```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 4. 定期更新系统

```bash
# Ubuntu
sudo apt update && sudo apt upgrade -y

# CentOS
sudo yum update -y

# 设置自动安全更新
sudo apt install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

---

## 📈 性能优化

### 1. 启用 Gzip 压缩

编辑 Nginx 配置：
```bash
sudo nano /etc/nginx/nginx.conf
```

添加：
```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript 
           application/x-javascript application/xml+rss 
           application/json application/javascript;
```

### 2. PM2 集群模式

```bash
# 修改 ecosystem.config.js
pm2 delete chiavow-server
```

编辑 `ecosystem.config.js`：
```javascript
module.exports = {
  apps: [{
    name: 'chiavow-server',
    script: './server/dist/index.js',
    instances: 'max',  // 使用所有 CPU 核心
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

重启：
```bash
pm2 start ecosystem.config.js
pm2 save
```

### 3. 数据库优化

```sql
-- 添加索引
ALTER TABLE users ADD INDEX idx_email (email);
ALTER TABLE orders ADD INDEX idx_user_id (userId);
ALTER TABLE verification_codes ADD INDEX idx_email (email);
ALTER TABLE verification_codes ADD INDEX idx_expires (expiresAt);

-- 优化表
OPTIMIZE TABLE users;
OPTIMIZE TABLE orders;
OPTIMIZE TABLE verification_codes;
```

---

## 🐛 故障排查

### 服务无法启动

```bash
# 查看 PM2 日志
pm2 logs chiavow-server --lines 100

# 查看应用日志
tail -n 100 /opt/chiavow/server/logs/*.log

# 检查端口占用
sudo lsof -i :3001

# 检查进程
ps aux | grep node
```

### 数据库连接失败

```bash
# 测试数据库连接
mysql -u chiavow_user -p -h localhost chiavow

# 查看数据库用户权限
mysql -u root -p -e "SELECT user, host FROM mysql.user;"

# 检查 MySQL 状态
sudo systemctl status mysql
```

### Nginx 无法访问

```bash
# 测试 Nginx 配置
sudo nginx -t

# 查看 Nginx 状态
sudo systemctl status nginx

# 查看错误日志
sudo tail -f /var/log/nginx/error.log

# 检查端口
sudo lsof -i :80
sudo lsof -i :443
```

### 内存不足

```bash
# 查看内存使用
free -h

# 添加 swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永久启用
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 📝 自动化脚本

### 自动备份脚本

创建 `/opt/chiavow/backup.sh`：
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/chiavow"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 备份数据库
mysqldump -u chiavow_user -p'your_password' chiavow | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# 备份上传文件
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/chiavow/server/uploads

# 删除 7 天前的备份
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

设置定时任务：
```bash
chmod +x /opt/chiavow/backup.sh
crontab -e

# 每天凌晨 2 点备份
0 2 * * * /opt/chiavow/backup.sh >> /var/log/chiavow-backup.log 2>&1
```

### 健康检查脚本

创建 `/opt/chiavow/healthcheck.sh`：
```bash
#!/bin/bash

# 检查服务是否运行
if ! pm2 describe chiavow-server > /dev/null 2>&1; then
    echo "Service down, restarting..."
    pm2 restart chiavow-server
    echo "Service restarted at $(date)" >> /var/log/chiavow-restart.log
fi

# 检查 API 响应
if ! curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "API not responding, restarting..."
    pm2 restart chiavow-server
fi
```

设置定时任务：
```bash
chmod +x /opt/chiavow/healthcheck.sh
crontab -e

# 每 5 分钟检查一次
*/5 * * * * /opt/chiavow/healthcheck.sh
```

---

## 📞 技术支持

如遇问题，请检查：
1. 日志文件：`pm2 logs` 和 `/var/log/nginx/`
2. 服务状态：`pm2 status` 和 `systemctl status nginx`
3. 防火墙规则：`sudo ufw status`
4. 端口占用：`sudo lsof -i :80` 和 `sudo lsof -i :3001`

---

**祝部署顺利！** 🎉
