# Chiavow 部署指南

选择适合您的部署方式：

## 🐳 方式一：Docker 部署（推荐）

**优点**：
- ✅ **最简单** - 一条命令启动所有服务
- ✅ **环境隔离** - 不污染服务器环境
- ✅ **易于迁移** - 可以轻松迁移到其他服务器
- ✅ **自动重启** - 容器崩溃自动恢复
- ✅ **版本一致** - 开发和生产环境完全一致

**缺点**：
- ❌ 需要安装 Docker
- ❌ 占用稍多的资源（额外 200-300MB）

**适合场景**：
- 首次部署，不熟悉 Linux 运维
- 需要在多个服务器上部署
- 希望简化运维管理

**快速开始**：
```bash
# 1. 配置环境变量
cp .env.production.example .env.production
nano .env.production

# 2. 一键部署
./deploy.sh

# 或手动运行
docker-compose --env-file .env.production up -d --build
```

**详细文档**：[README.deployment.md](./README.deployment.md)

---

## 🖥️ 方式二：传统部署（不使用 Docker）

**优点**：
- ✅ **更轻量** - 直接运行，无额外开销
- ✅ **更灵活** - 完全控制每个组件
- ✅ **更熟悉** - 传统的 Node.js + Nginx 架构

**缺点**：
- ❌ 需要手动安装依赖（Node.js, MySQL, PM2, Nginx）
- ❌ 环境配置较复杂
- ❌ 迁移服务器需要重新配置

**适合场景**：
- 已有 Node.js 和 MySQL 环境
- 对服务器有完全控制权
- 熟悉 Linux 运维

**快速开始**：
```bash
# 运行一键部署脚本
chmod +x deploy-traditional.sh
./deploy-traditional.sh
```

脚本会自动完成：
1. 检查和安装依赖（Node.js, MySQL, PM2, Nginx）
2. 配置数据库
3. 生成安全配置
4. 构建并启动应用

**详细文档**：[DEPLOYMENT-TRADITIONAL.md](./DEPLOYMENT-TRADITIONAL.md)

---

## 📊 两种方式对比

| 对比项 | Docker 部署 | 传统部署 |
|--------|------------|----------|
| **部署难度** | ⭐⭐ 简单 | ⭐⭐⭐ 中等 |
| **资源占用** | ~800MB | ~500MB |
| **启动速度** | 10-20秒 | 5-10秒 |
| **环境隔离** | ✅ 完全隔离 | ❌ 共享环境 |
| **迁移难度** | ⭐⭐ 简单 | ⭐⭐⭐⭐ 复杂 |
| **运维管理** | `docker-compose` | `pm2 + nginx` |
| **日志管理** | `docker-compose logs` | `pm2 logs` |
| **自动重启** | ✅ 自动 | ✅ 自动（PM2） |
| **数据备份** | Volume 持久化 | 手动备份 |
| **适合新手** | ✅ 是 | ⚠️ 需要一定基础 |

---

## 🚀 快速决策指南

### 选择 Docker 部署，如果：
- ✅ 您是第一次部署 Node.js 应用
- ✅ 服务器是全新的，没有已安装的服务
- ✅ 您希望未来能轻松迁移
- ✅ 您希望简化运维工作

### 选择传统部署，如果：
- ✅ 服务器已有 Node.js 和 MySQL 环境
- ✅ 您熟悉 PM2 和 Nginx
- ✅ 您需要最小的资源占用
- ✅ 您的服务器不支持 Docker

---

## 📝 服务器最低要求

### Docker 部署
- **CPU**: 1 核
- **内存**: 2GB RAM
- **硬盘**: 20GB
- **系统**: Ubuntu 20.04+ / CentOS 7+
- **软件**: Docker + Docker Compose

### 传统部署
- **CPU**: 1 核
- **内存**: 1GB RAM（推荐 2GB）
- **硬盘**: 10GB
- **系统**: Ubuntu 20.04+ / CentOS 7+
- **软件**: Node.js 18 + MySQL 5.7+

---

## 🔧 部署后管理

### Docker 方式
```bash
# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 更新应用
git pull
docker-compose --env-file .env.production up -d --build
```

### 传统方式
```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs chiavow-server

# 重启服务
pm2 restart chiavow-server

# 停止服务
pm2 stop chiavow-server

# 更新应用
git pull
cd server && npm run build
cd ../client && npm run build
pm2 restart chiavow-server
```

---

## 🔐 安全建议（两种方式通用）

1. **修改默认密码**
   - 生成强 JWT_SECRET
   - 使用强数据库密码
   - 修改邮箱授权码

2. **配置防火墙**
   ```bash
   sudo ufw allow 22/tcp   # SSH
   sudo ufw allow 80/tcp   # HTTP
   sudo ufw allow 443/tcp  # HTTPS
   sudo ufw enable
   ```

3. **启用 HTTPS**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

4. **定期备份数据库**
   - Docker: `docker exec chiavow-db mysqldump ...`
   - 传统: `mysqldump -u chiavow_user -p chiavow > backup.sql`

5. **定期更新系统**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

---

## 📚 完整文档列表

- **Docker 部署**：
  - [README.deployment.md](./README.deployment.md) - 快速开始
  - [DEPLOYMENT.md](./DEPLOYMENT.md) - 详细指南
  - [docker-compose.yml](./docker-compose.yml) - 配置文件

- **传统部署**：
  - [DEPLOYMENT-TRADITIONAL.md](./DEPLOYMENT-TRADITIONAL.md) - 完整指南
  - [deploy-traditional.sh](./deploy-traditional.sh) - 一键脚本

---

## 💡 推荐配置

### 开发/测试环境
- 使用传统部署
- 最小资源配置
- 快速迭代开发

### 生产环境（推荐 Docker）
- 使用 Docker 部署
- 配置 SSL 证书
- 启用自动备份
- 配置监控和告警

### 高可用生产环境
- Docker Swarm 或 Kubernetes
- 负载均衡
- 数据库主从复制
- Redis 缓存

---

## 🆘 需要帮助？

遇到问题请检查：
1. 查看对应的详细文档
2. 检查日志文件
3. 验证端口是否被占用
4. 确认防火墙配置

**常见问题**：
- 端口 3001 被占用 → `sudo lsof -i :3001`
- 数据库连接失败 → 检查 .env 配置
- Nginx 403/502 → 检查文件权限和服务状态
- 邮件发送失败 → 使用 163 邮箱（中国用户）

---

**选择最适合您的方式，开始部署吧！** 🚀
