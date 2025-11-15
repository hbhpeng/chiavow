# Chiavow 部署说明

## 🚀 Docker 快速部署（推荐）

使用 Docker 部署是最简单、最标准的方式，只需 3 步即可完成！

### 前提条件
- 服务器已安装 Docker 和 Docker Compose
- 至少 2GB RAM 和 20GB 硬盘空间

### 第一步：配置环境变量

```bash
# 1. 复制环境变量示例文件
cp .env.production.example .env.production

# 2. 生成安全的 JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 3. 编辑配置文件，填入实际值
nano .env.production
```

**必须修改的配置项**：
```env
JWT_SECRET=<使用上面命令生成的密钥>
DB_ROOT_PASSWORD=<设置数据库root密码>
DB_PASSWORD=<设置数据库用户密码>
CLIENT_URL=https://yourdomain.com
EMAIL_USER=your_email@163.com
EMAIL_PASSWORD=<邮箱授权码>
```

### 第二步：一键部署

```bash
# 运行部署脚本
./deploy.sh
```

或者手动执行：
```bash
docker-compose --env-file .env.production up -d --build
```

### 第三步：验证部署

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 访问应用
# 前端：http://your-server-ip
# API：http://your-server-ip:3001
```

---

## 📦 Docker 服务说明

部署会启动 3 个服务：

1. **chiavow-db**：MySQL 8.0 数据库（端口 3306）
2. **chiavow-api**：后端 API 服务（端口 3001）
3. **chiavow-web**：前端 Web 服务（端口 80/443）

数据持久化：
- 数据库数据：`mysql_data` volume
- 上传文件：`./server/uploads`
- 日志文件：`./server/logs`

---

## 🔧 常用运维命令

### 查看服务状态
```bash
docker-compose ps
```

### 查看日志
```bash
# 所有服务
docker-compose logs -f

# 特定服务
docker-compose logs -f api
docker-compose logs -f db
docker-compose logs -f web
```

### 重启服务
```bash
# 重启所有
docker-compose restart

# 重启单个
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

# 重新构建并部署
docker-compose --env-file .env.production up -d --build
```

### 数据库备份
```bash
# 备份
docker exec chiavow-db mysqldump -u root -p'your_password' chiavow > backup.sql

# 恢复
docker exec -i chiavow-db mysql -u root -p'your_password' chiavow < backup.sql
```

---

## 🌐 配置域名和 SSL

### 使用 Nginx 反向代理（推荐）

1. 安装 Nginx 和 Certbot：
```bash
sudo apt install nginx certbot python3-certbot-nginx
```

2. 创建 Nginx 配置：
```bash
sudo nano /etc/nginx/sites-available/chiavow
```

配置内容：
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. 启用配置并获取 SSL 证书：
```bash
sudo ln -s /etc/nginx/sites-available/chiavow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🔒 安全建议

1. ✅ **修改所有默认密码**
2. ✅ **使用强密码**（至少 16 位，包含大小写字母、数字、特殊字符）
3. ✅ **配置防火墙**：只开放必要端口（22, 80, 443）
4. ✅ **启用 HTTPS**：生产环境必须使用 SSL
5. ✅ **定期备份数据库**
6. ✅ **定期更新镜像和系统**
7. ✅ **监控日志文件**

防火墙配置：
```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

---

## 📊 监控和性能

### 查看资源使用
```bash
docker stats
```

### 数据库优化
```bash
# 进入数据库
docker exec -it chiavow-db mysql -u root -p

# 优化表
OPTIMIZE TABLE users, orders, verification_codes;
```

### 清理过期数据
```bash
# 清理过期验证码
docker exec chiavow-db mysql -u root -p'password' chiavow -e \
  "DELETE FROM verification_codes WHERE expiresAt < NOW() - INTERVAL 7 DAY;"
```

---

## 🐛 故障排查

### 服务无法启动
```bash
# 查看详细日志
docker-compose logs

# 检查端口占用
sudo lsof -i :3001
sudo lsof -i :80
sudo lsof -i :3306
```

### 数据库连接失败
```bash
# 检查数据库健康状态
docker exec chiavow-db mysqladmin ping -h localhost -u root -p

# 进入数据库调试
docker exec -it chiavow-db mysql -u root -p
```

### 邮件发送失败
- 检查 `.env.production` 中的邮箱配置
- 中国用户建议使用 163 邮箱（Gmail 可能被墙）
- 确认使用的是授权码，不是登录密码

---

## 📚 完整文档

详细部署指南请查看：[DEPLOYMENT.md](./DEPLOYMENT.md)

包含：
- 完整的部署步骤
- 自动备份脚本配置
- 性能优化建议
- 高可用部署方案
- 更多故障排查方法

---

## 💡 其他部署方式

如果不使用 Docker，也可以使用传统方式部署：
- 手动安装 Node.js 和 MySQL
- 使用 PM2 管理进程
- 使用 Nginx 作为反向代理

详见 [DEPLOYMENT.md](./DEPLOYMENT.md) 中的"传统部署方式"章节。

---

## 🆘 获取帮助

如果遇到问题：
1. 查看日志：`docker-compose logs -f`
2. 查看文档：`DEPLOYMENT.md`
3. 检查配置：确保 `.env.production` 配置正确
4. 验证环境：确保 Docker 和 Docker Compose 正常工作

---

## 📝 快速参考

| 操作 | 命令 |
|------|------|
| 启动服务 | `docker-compose --env-file .env.production up -d` |
| 停止服务 | `docker-compose down` |
| 查看日志 | `docker-compose logs -f` |
| 查看状态 | `docker-compose ps` |
| 重启服务 | `docker-compose restart` |
| 进入容器 | `docker exec -it chiavow-api sh` |
| 备份数据库 | `docker exec chiavow-db mysqldump -u root -p chiavow > backup.sql` |

---

**祝部署顺利！** 🎉
