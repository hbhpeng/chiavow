# 🌐 域名配置和HTTPS部署完整指南

## 📋 目录
1. [购买域名](#1-购买域名)
2. [配置域名解析](#2-配置域名解析)
3. [云服务器配置](#3-云服务器配置)
4. [部署应用](#4-部署应用)
5. [配置HTTPS证书](#5-配置https证书)
6. [自动续期设置](#6-自动续期设置)
7. [常见问题](#7-常见问题)

---

## 1. 购买域名

### 推荐域名注册商

#### 国内（需要备案）
- **阿里云** (https://wanwang.aliyun.com)
  - 价格：.com 约 ¥55-78/年
  - 优势：与阿里云ECS集成好，备案方便

- **腾讯云** (https://dnspod.cloud.tencent.com)
  - 价格：.com 约 ¥55-88/年
  - 优势：送免费SSL证书

- **华为云** (https://www.huaweicloud.com)
  - 价格：.com 约 ¥60-85/年

#### 国外（无需备案）
- **Namecheap** (https://www.namecheap.com)
  - 价格：.com 约 $8-12/年
  - 优势：便宜，隐私保护免费

- **GoDaddy** (https://www.godaddy.com)
  - 价格：.com 约 $10-15/年
  - 优势：知名度高

- **Cloudflare** (https://www.cloudflare.com)
  - 价格：.com 约 $8.57/年（成本价）
  - 优势：送免费CDN和SSL

### 推荐域名后缀

| 后缀 | 价格/年 | 适合场景 | 备注 |
|------|---------|----------|------|
| .com | ¥55-88 | 商业网站 | 最常见，推荐 |
| .cn | ¥29-45 | 中国网站 | 需要备案 |
| .net | ¥55-88 | 技术网站 | 不错的选择 |
| .xyz | ¥8-15 | 个人项目 | 便宜但不够正式 |
| .top | ¥5-10 | 测试项目 | 很便宜 |

### 购买流程（以阿里云为例）

1. **搜索域名**
   - 访问 https://wanwang.aliyun.com
   - 输入想要的域名，如 `chiavow.com`
   - 检查可用性

2. **加入购物车**
   - 选择购买年限（建议1-3年）
   - 勾选"域名隐私保护"（免费）

3. **完成支付**
   - 填写域名所有者信息
   - 完成实名认证（国内必须）
   - 支付费用

4. **等待审核**
   - 实名认证通常1-3天
   - 审核通过后才能使用

---

## 2. 配置域名解析

### 2.1 获取服务器IP地址

SSH登录你的云服务器：
```bash
# 查看公网IP
curl ifconfig.me
# 或
curl icanhazip.com
```

记录下这个IP地址，如：`47.100.123.456`

### 2.2 添加DNS解析记录

#### 阿里云域名解析

1. **进入域名控制台**
   - 登录阿里云
   - 产品与服务 → 域名 → 域名列表
   - 找到你的域名，点击"解析"

2. **添加A记录（主域名）**
   ```
   记录类型：A
   主机记录：@
   解析线路：默认
   记录值：47.100.123.456（你的服务器IP）
   TTL：10分钟
   ```

3. **添加A记录（www子域名）**
   ```
   记录类型：A
   主机记录：www
   解析线路：默认
   记录值：47.100.123.456（你的服务器IP）
   TTL：10分钟
   ```

4. **验证解析**
   ```bash
   # 等待5-10分钟后测试
   ping chiavow.com
   ping www.chiavow.com

   # 或使用nslookup
   nslookup chiavow.com
   ```

#### Cloudflare域名解析（推荐，免费CDN+SSL）

1. **添加网站到Cloudflare**
   - 登录 https://dash.cloudflare.com
   - 点击"Add a Site"
   - 输入域名：`chiavow.com`
   - 选择Free计划

2. **修改域名服务器**
   - Cloudflare会给你两个nameservers
   - 去域名注册商修改DNS服务器
   - 等待DNS生效（最多24小时）

3. **添加DNS记录**
   ```
   类型：A
   名称：@
   IPv4地址：47.100.123.456
   代理状态：已代理（橙色云朵）

   类型：A
   名称：www
   IPv4地址：47.100.123.456
   代理状态：已代理（橙色云朵）
   ```

4. **开启自动HTTPS重写**
   - SSL/TLS → Edge Certificates
   - 开启"Always Use HTTPS"
   - 开启"Automatic HTTPS Rewrites"

---

## 3. 云服务器配置

### 3.1 安全组配置

#### 阿里云ECS

1. **进入实例管理**
   - 控制台 → 云服务器ECS → 实例
   - 点击你的实例ID

2. **配置安全组规则**
   - 安全组 → 配置规则 → 添加规则

   **必须开放的端口：**
   ```
   入方向规则：
   - HTTP：80/80，源：0.0.0.0/0
   - HTTPS：443/443，源：0.0.0.0/0
   - SSH：22/22，源：你的IP（推荐）或 0.0.0.0/0

   出方向规则：
   - 全部允许
   ```

#### 腾讯云CVM

1. **安全组配置**
   - 控制台 → 云服务器 → 安全组
   - 新建安全组或编辑现有

2. **添加规则**
   ```
   入站规则：
   - HTTP：TCP:80，源：0.0.0.0/0
   - HTTPS：TCP:443，源：0.0.0.0/0
   - SSH：TCP:22，源：你的IP
   ```

### 3.2 防火墙配置

SSH登录服务器后：

```bash
# 检查防火墙状态
sudo ufw status

# 如果未启用，先启用
sudo ufw enable

# 允许必要端口
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp

# 重新加载
sudo ufw reload

# 验证
sudo ufw status numbered
```

---

## 4. 部署应用

### 4.1 上传代码到服务器

**方法1：Git（推荐）**
```bash
# 在服务器上
cd /root
git clone https://github.com/你的用户名/chiavow.git
cd chiavow
```

**方法2：SCP上传**
```bash
# 在本地机器
cd /Users/xinguanliyuan/Desktop/indoor_chart
tar -czf chiavow.tar.gz chiavow/
scp chiavow.tar.gz root@你的服务器IP:/root/

# 在服务器上
cd /root
tar -xzf chiavow.tar.gz
```

### 4.2 安装依赖并启动

```bash
cd /root/chiavow

# 安装后端依赖
cd server
npm install --production
npm run build

# 配置环境变量
cat > .env << 'EOF'
PORT=3001
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
EOF

# 使用PM2启动
pm2 start dist/index.js --name chiavow-api
pm2 save
pm2 startup

# 安装前端依赖并构建
cd ../client
npm install
npm run build
```

---

## 5. 配置HTTPS证书

### 方法1：Let's Encrypt（免费，推荐）

#### 5.1 安装Certbot

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install -y certbot python3-certbot-nginx
```

#### 5.2 获取证书

```bash
# 停止nginx（如果正在运行）
sudo systemctl stop nginx

# 获取证书（方式1：独立模式）
sudo certbot certonly --standalone -d chiavow.com -d www.chiavow.com

# 或者（方式2：nginx模式，nginx已配置的情况）
sudo certbot --nginx -d chiavow.com -d www.chiavow.com

# 按照提示操作：
# 1. 输入邮箱地址
# 2. 同意服务条款
# 3. 选择是否接收邮件
```

#### 5.3 配置Nginx使用证书

创建或编辑Nginx配置：

```bash
sudo nano /etc/nginx/sites-available/chiavow
```

完整配置：

```nginx
# HTTP - 重定向到HTTPS
server {
    listen 80;
    server_name chiavow.com www.chiavow.com;

    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name chiavow.com www.chiavow.com;

    # SSL证书配置
    ssl_certificate /etc/letsencrypt/live/chiavow.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chiavow.com/privkey.pem;

    # SSL优化配置
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # 现代浏览器SSL配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;

    # HSTS（强制HTTPS）
    add_header Strict-Transport-Security "max-age=63072000" always;

    # 其他安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 前端静态文件
    location / {
        root /root/chiavow/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 文件上传
    location /uploads {
        proxy_pass http://localhost:3001;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;

    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 文件上传大小限制
    client_max_body_size 10M;
}
```

#### 5.4 启用配置并测试

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/chiavow /etc/nginx/sites-enabled/

# 删除默认配置（可选）
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 如果测试通过，重启nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# 检查状态
sudo systemctl status nginx
```

### 方法2：使用Cloudflare（更简单，推荐新手）

如果使用Cloudflare DNS：

1. **自动HTTPS**
   - SSL/TLS → Overview
   - 选择"Full (strict)"模式

2. **生成Origin证书（可选）**
   - SSL/TLS → Origin Server
   - Create Certificate
   - 下载证书和私钥
   - 上传到服务器

3. **简化的Nginx配置**
   ```nginx
   server {
       listen 80;
       server_name chiavow.com www.chiavow.com;

       # Cloudflare已处理HTTPS，无需重定向

       location / {
           root /root/chiavow/client/dist;
           try_files $uri $uri/ /index.html;
       }

       location /api {
           proxy_pass http://localhost:3001;
           # ... 其他配置
       }
   }
   ```

---

## 6. 自动续期设置

### Let's Encrypt证书自动续期

Let's Encrypt证书有效期90天，需要定期续期。

#### 6.1 测试续期

```bash
# 测试续期（不实际续期）
sudo certbot renew --dry-run

# 如果测试成功，会显示：
# Congratulations, all simulated renewals succeeded
```

#### 6.2 配置自动续期

```bash
# Certbot会自动创建续期任务
# 检查cron或systemd timer
sudo systemctl status certbot.timer

# 或查看cron任务
sudo crontab -l
```

#### 6.3 手动添加续期任务（如果需要）

```bash
# 编辑crontab
sudo crontab -e

# 添加以下行（每天凌晨2点检查续期）
0 2 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

#### 6.4 验证自动续期

```bash
# 查看证书过期时间
sudo certbot certificates

# 输出示例：
# Certificate Name: chiavow.com
#   Domains: chiavow.com www.chiavow.com
#   Expiry Date: 2025-02-13 12:00:00+00:00 (VALID: 89 days)
```

---

## 7. 常见问题

### 7.1 域名相关

**Q: 域名需要备案吗？**
A:
- 使用国内服务器（阿里云、腾讯云等）：必须备案
- 使用国外服务器（AWS、DigitalOcean等）：不需要备案

**Q: 备案需要多久？**
A: 通常15-20个工作日

**Q: 域名解析需要多久生效？**
A:
- 国内DNS：5分钟-2小时
- 国际DNS：最多24-48小时

**Q: 如何验证域名解析成功？**
```bash
# 方法1
ping chiavow.com

# 方法2
nslookup chiavow.com

# 方法3
dig chiavow.com

# 方法4（在线工具）
# https://www.whatsmydns.net
```

### 7.2 SSL证书相关

**Q: Let's Encrypt证书是否安全？**
A: 是的，和付费证书一样安全，只是有效期较短（90天）

**Q: 证书续期失败怎么办？**
```bash
# 查看详细日志
sudo certbot renew --force-renewal

# 如果失败，手动重新获取
sudo certbot certonly --standalone -d chiavow.com -d www.chiavow.com --force-renewal
```

**Q: 浏览器显示"不安全"怎么办？**
- 检查证书是否正确安装
- 检查nginx配置是否正确
- 清除浏览器缓存
- 检查证书是否过期

**Q: 混合内容警告（Mixed Content）？**
- 确保所有资源都使用HTTPS
- 检查API调用是否使用HTTPS
- 添加CSP头：
  ```nginx
  add_header Content-Security-Policy "upgrade-insecure-requests";
  ```

### 7.3 Nginx相关

**Q: nginx配置测试失败？**
```bash
# 查看具体错误
sudo nginx -t

# 常见错误：
# 1. 语法错误：检查分号、括号
# 2. 证书路径错误：检查文件是否存在
# 3. 端口冲突：检查是否有其他服务占用80/443端口
```

**Q: 如何查看nginx错误日志？**
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

**Q: 502 Bad Gateway错误？**
- 检查后端服务是否启动：`pm2 status`
- 检查端口是否正确：`netstat -tlnp | grep 3001`
- 检查防火墙：`sudo ufw status`

### 7.4 性能优化

**Q: 如何提高网站速度？**

1. **启用Gzip压缩**（已在配置中）
2. **启用浏览器缓存**（已在配置中）
3. **使用CDN**
   - Cloudflare（免费）
   - 阿里云CDN
   - 腾讯云CDN

4. **优化图片**
   ```bash
   # 安装优化工具
   sudo apt install imagemagick

   # 压缩图片
   mogrify -resize 800x800 -quality 85 *.jpg
   ```

5. **启用HTTP/2**（已在配置中）

---

## 8. 完整部署检查清单

### 部署前
- [ ] 域名已购买并实名认证
- [ ] DNS解析已配置（A记录）
- [ ] 云服务器已购买并启动
- [ ] 安全组已配置（80, 443, 22端口）
- [ ] SSH可以连接服务器

### 部署中
- [ ] 代码已上传到服务器
- [ ] Node.js和npm已安装
- [ ] 后端依赖已安装并构建
- [ ] 前端依赖已安装并构建
- [ ] PM2已启动后端服务
- [ ] Nginx已安装
- [ ] SSL证书已获取
- [ ] Nginx配置已创建

### 部署后
- [ ] HTTP访问正常（http://chiavow.com）
- [ ] HTTPS访问正常（https://chiavow.com）
- [ ] HTTP自动重定向到HTTPS
- [ ] API接口正常工作
- [ ] 文件上传功能正常
- [ ] 自动续期已配置
- [ ] PM2开机自启已配置
- [ ] Nginx开机自启已配置

### 测试
- [ ] SSL Labs测试通过（https://www.ssllabs.com/ssltest/）
- [ ] 移动端访问正常
- [ ] PC端访问正常
- [ ] 不同浏览器访问正常
- [ ] HTTPS证书有效

---

## 9. 快速参考命令

### 域名验证
```bash
# 检查域名解析
nslookup chiavow.com

# 测试HTTP访问
curl http://chiavow.com

# 测试HTTPS访问
curl https://chiavow.com
```

### SSL证书
```bash
# 获取证书
sudo certbot --nginx -d chiavow.com -d www.chiavow.com

# 续期证书
sudo certbot renew

# 查看证书信息
sudo certbot certificates

# 测试续期
sudo certbot renew --dry-run
```

### Nginx
```bash
# 测试配置
sudo nginx -t

# 重启
sudo systemctl restart nginx

# 查看状态
sudo systemctl status nginx

# 查看日志
sudo tail -f /var/log/nginx/error.log
```

### PM2
```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs chiavow-api

# 重启
pm2 restart chiavow-api

# 监控
pm2 monit
```

---

## 10. 推荐的完整流程

### 新手推荐：Cloudflare + Let's Encrypt

1. **购买域名**（任意注册商，¥55/年）
2. **迁移DNS到Cloudflare**（免费，送CDN+SSL）
3. **配置域名解析**（A记录指向服务器）
4. **部署应用**（按照本文档步骤）
5. **获取Let's Encrypt证书**（免费，自动续期）
6. **Cloudflare开启HTTPS**（自动，无需配置）

### 高级用户：阿里云全家桶

1. **购买域名**（阿里云，¥55/年）
2. **购买ECS服务器**（阿里云，¥100/月起）
3. **备案**（15-20天）
4. **配置DNS解析**（阿里云DNS）
5. **部署应用**
6. **获取SSL证书**（Let's Encrypt或阿里云证书）
7. **可选：开启CDN**（阿里云CDN，加速访问）

---

**需要帮助？**
- Let's Encrypt文档：https://letsencrypt.org/zh-cn/docs/
- Nginx文档：http://nginx.org/en/docs/
- Certbot文档：https://certbot.eff.org/

**祝部署成功！** 🎉
