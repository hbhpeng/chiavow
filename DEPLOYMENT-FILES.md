# 部署文件说明

本项目提供了两种部署方式的完整配置文件。

## 📁 文件列表

### 🐳 Docker 部署相关文件

1. **docker-compose.yml**
   - Docker Compose 配置文件
   - 定义了 3 个服务：db（MySQL）、api（后端）、web（前端）
   - 包含数据持久化、网络配置、健康检查

2. **.env.production.example**
   - 生产环境变量模板
   - 包含所有必需的配置项
   - 使用前需复制为 `.env.production` 并填入实际值

3. **deploy.sh**
   - Docker 一键部署脚本
   - 自动检查环境和配置
   - 交互式部署流程

4. **README.deployment.md**
   - Docker 部署快速指南
   - 包含快速参考表
   - 常用命令速查

5. **DEPLOYMENT.md**
   - Docker 部署详细文档
   - 完整的部署步骤
   - 运维管理指南
   - 故障排查方法

### 🖥️ 传统部署相关文件

6. **deploy-traditional.sh**
   - 传统部署一键脚本
   - 自动安装依赖（Node.js, MySQL, PM2, Nginx）
   - 自动配置数据库、环境变量、服务

7. **DEPLOYMENT-TRADITIONAL.md**
   - 传统部署完整指南
   - 手动部署步骤
   - PM2 和 Nginx 配置
   - 性能优化建议
   - 安全加固方法

### 📚 通用文档

8. **DEPLOYMENT-GUIDE.md**
   - 部署方式对比指南
   - 帮助选择合适的部署方式
   - 两种方式的优缺点对比
   - 快速决策指南

9. **DEPLOYMENT-FILES.md**（本文件）
   - 部署文件说明
   - 文件用途介绍
   - 使用建议

### 🔧 Docker 相关配置

10. **server/Dockerfile**
    - 后端 Docker 镜像配置
    - 基于 Node.js 18 Alpine
    - 包含构建步骤

11. **client/Dockerfile**
    - 前端 Docker 镜像配置
    - 多阶段构建（构建 + Nginx）
    - 优化后的生产镜像

12. **client/nginx.conf**
    - 前端 Nginx 配置（Docker 用）
    - SPA 路由支持

---

## 🚀 使用建议

### 如果您选择 Docker 部署：

**需要的文件**：
- ✅ docker-compose.yml
- ✅ .env.production.example → 复制为 .env.production
- ✅ deploy.sh（可选，推荐）
- ✅ README.deployment.md（参考）

**快速开始**：
```bash
# 1. 配置环境变量
cp .env.production.example .env.production
nano .env.production

# 2. 运行部署脚本
./deploy.sh
```

**参考文档**：
- 快速指南：README.deployment.md
- 详细文档：DEPLOYMENT.md

---

### 如果您选择传统部署：

**需要的文件**：
- ✅ deploy-traditional.sh
- ✅ DEPLOYMENT-TRADITIONAL.md（参考）

**快速开始**：
```bash
# 运行一键部署脚本
chmod +x deploy-traditional.sh
./deploy-traditional.sh
```

**参考文档**：
- 完整指南：DEPLOYMENT-TRADITIONAL.md

---

## 📋 部署流程对比

### Docker 部署流程

```
1. 上传代码到服务器
2. 安装 Docker 和 Docker Compose
3. 配置 .env.production
4. 运行 ./deploy.sh 或 docker-compose up
5. 完成！
```

**涉及文件**：
- docker-compose.yml
- .env.production
- server/Dockerfile
- client/Dockerfile

---

### 传统部署流程

```
1. 上传代码到服务器
2. 运行 ./deploy-traditional.sh
3. 脚本自动完成：
   - 安装 Node.js, MySQL, PM2, Nginx
   - 配置数据库
   - 生成环境变量
   - 构建并启动应用
4. 完成！
```

**涉及文件**：
- deploy-traditional.sh
- server/.env（自动生成）
- ecosystem.config.js（自动生成）

---

## 🔧 配置文件说明

### .env.production（Docker 部署）

包含的配置项：
```env
JWT_SECRET=<安全密钥>
DB_ROOT_PASSWORD=<MySQL root密码>
DB_USER=<数据库用户>
DB_PASSWORD=<数据库密码>
DB_NAME=chiavow
CLIENT_URL=<您的域名>
EMAIL_USER=<邮箱>
EMAIL_PASSWORD=<邮箱授权码>
```

### server/.env（传统部署）

由 deploy-traditional.sh 自动生成，包含：
```env
PORT=3001
JWT_SECRET=<自动生成>
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_USER=chiavow_user
DB_PASSWORD=<您设置的密码>
DB_NAME=chiavow
CLIENT_URL=<您输入的域名/IP>
EMAIL_USER=<您输入的邮箱>
EMAIL_PASSWORD=<您输入的授权码>
```

### ecosystem.config.js（传统部署）

PM2 进程管理配置，由 deploy-traditional.sh 自动生成：
```javascript
module.exports = {
  apps: [{
    name: 'chiavow-server',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    max_memory_restart: '1G',
    env: { NODE_ENV: 'production' }
  }]
}
```

---

## 📊 文件依赖关系

### Docker 部署

```
docker-compose.yml
├── 使用 → .env.production
├── 构建 → server/Dockerfile
│   └── 需要 → server/package.json
└── 构建 → client/Dockerfile
    ├── 需要 → client/package.json
    └── 使用 → client/nginx.conf
```

### 传统部署

```
deploy-traditional.sh
├── 生成 → server/.env
├── 生成 → ecosystem.config.js
├── 构建 → server/
│   └── npm run build
└── 构建 → client/
    └── npm run build
```

---

## 🗂️ 目录结构（部署后）

### Docker 部署后

```
chiavow/
├── docker-compose.yml
├── .env.production
├── server/
│   ├── Dockerfile
│   ├── uploads/        # Volume 映射
│   └── logs/           # Volume 映射
└── client/
    ├── Dockerfile
    └── nginx.conf
```

### 传统部署后

```
chiavow/
├── ecosystem.config.js  # 自动生成
├── server/
│   ├── .env            # 自动生成
│   ├── dist/           # 构建输出
│   ├── uploads/
│   └── logs/
└── client/
    └── dist/           # 构建输出
```

---

## ⚙️ 自定义配置

### 修改 Docker 配置

如需修改 Docker 配置，编辑：
- **端口映射**：docker-compose.yml 中的 `ports`
- **资源限制**：添加 `deploy.resources` 配置
- **环境变量**：.env.production

### 修改传统部署配置

如需修改传统部署配置，编辑：
- **PM2 配置**：ecosystem.config.js
- **Nginx 配置**：/etc/nginx/sites-available/chiavow
- **环境变量**：server/.env

---

## 🔒 安全文件

**重要：以下文件包含敏感信息，不要提交到 Git**

- `.env.production`
- `server/.env`
- 任何包含密码的备份文件

**.gitignore 已包含**：
```gitignore
.env.production
server/.env
*.sql
*.sql.gz
```

---

## 📝 维护建议

### 定期更新

1. **更新依赖**：
   - Docker: 定期更新镜像 `docker-compose pull`
   - 传统: 定期更新包 `npm update`

2. **备份配置文件**：
   - .env.production
   - server/.env
   - ecosystem.config.js
   - Nginx 配置

3. **版本控制**：
   - 所有配置文件模板（.example）已纳入 Git
   - 实际配置文件已在 .gitignore 中排除

---

## 🆘 常见问题

**Q: 部署脚本需要 root 权限吗？**
A: 不需要 root，但需要 sudo 权限来安装依赖和配置 Nginx

**Q: 可以同时使用两种部署方式吗？**
A: 不建议。选择其中一种即可。

**Q: .env.production 和 server/.env 有什么区别？**
A: 
- .env.production：Docker 部署使用，由 docker-compose 读取
- server/.env：传统部署使用，由 Node.js 应用直接读取

**Q: 如何切换部署方式？**
A: 
1. 备份数据库
2. 停止当前服务
3. 按照新方式的文档重新部署
4. 恢复数据库

---

**选择合适的文件，开始部署吧！** 🚀
