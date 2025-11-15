# Chiavow 数据库迁移指南

## 概述

本项目已从内存存储迁移到 MySQL 数据库，支持数据持久化和后台管理系统。

## 数据库表结构

### 1. users（用户表）
- `id`: VARCHAR(36) - 用户唯一标识
- `email`: VARCHAR(255) - 邮箱（唯一）
- `password`: VARCHAR(255) - 密码哈希
- `username`: VARCHAR(100) - 用户名
- `avatar`: TEXT - 头像URL
- `primary_language`: VARCHAR(10) - 首选语言
- `secondary_language`: VARCHAR(10) - 次选语言
- `role`: ENUM('user', 'admin') - 用户角色
- `created_at`, `updated_at`: TIMESTAMP - 时间戳

### 2. verification_codes（验证码表）
- `id`: INT - 自增主键
- `email`: VARCHAR(255) - 邮箱
- `code`: VARCHAR(10) - 验证码
- `expires_at`: TIMESTAMP - 过期时间
- `used`: BOOLEAN - 是否已使用
- `created_at`: TIMESTAMP - 创建时间

### 3. orders（订单表）
- `id`: VARCHAR(36) - 订单唯一标识
- `user_id`: VARCHAR(36) - 用户ID（外键）
- `number_of_travelers`: INT - 旅行者人数
- `supply_vehicles`: BOOLEAN - 是否提供车辆
- `free_itinerary`: BOOLEAN - 是否免费行程
- `tailor_made`: BOOLEAN - 是否定制旅行
- `total_amount`: DECIMAL(10,2) - 总金额
- `status`: ENUM('active', 'paid', 'cancelled') - 订单状态
- `created_at`, `updated_at`: TIMESTAMP - 时间戳

### 4. trip_segments（行程表）
- `id`: INT - 自增主键
- `order_id`: VARCHAR(36) - 订单ID（外键）
- `city`: VARCHAR(50) - 城市
- `start_date`: DATE - 开始日期
- `end_date`: DATE - 结束日期
- `created_at`: TIMESTAMP - 创建时间

### 5. admin_logs（管理员日志表）
- `id`: INT - 自增主键
- `admin_id`: VARCHAR(36) - 管理员ID（外键）
- `action`: VARCHAR(50) - 操作类型
- `target_type`: VARCHAR(50) - 目标类型
- `target_id`: VARCHAR(36) - 目标ID
- `details`: TEXT - 详细信息
- `ip_address`: VARCHAR(45) - IP地址
- `created_at`: TIMESTAMP - 创建时间

## 安装步骤

### 1. 安装 MySQL

**macOS:**
```bash
brew install mysql
brew services start mysql
# 设置 root 密码(如果需要)
mysql_secure_installation
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
# 设置 root 密码
sudo mysql_secure_installation
```

**Windows:**
下载并安装 [MySQL Installer](https://dev.mysql.com/downloads/installer/)

### 2. 创建数据库

**方法 1: 使用自动化脚本（推荐）**
```bash
cd server/database
chmod +x init-db.sh
./init-db.sh
# 按提示输入 MySQL root 密码
```

**方法 2: 手动执行**
```bash
# 登录 MySQL
mysql -u root -p

# 在 MySQL 命令行中执行
SOURCE /Users/xinguanliyuan/Desktop/indoor_chart/chiavow/server/database/schema.sql;
```

### 3. 配置环境变量

编辑 `server/.env` 文件（已创建），更新数据库连接信息：

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-actual-mysql-password  # 改成你的实际密码
DB_NAME=chiavow
```

### 4. 启动服务器

```bash
cd server
npm install  # 如果还没安装依赖
npm run dev
```

如果看到以下输出，说明数据库连接成功：
```
✅ Database connected successfully!
Server running on port 3001
```

## 默认管理员账户

- **邮箱**: `admin@chiavow.com`
- **密码**: `admin123`

⚠️ **重要**: 首次登录后请立即修改管理员密码！

## API 功能

### 用户管理
- ✅ 用户注册（邮箱验证码 + 密码）
- ✅ 用户登录（邮箱 + 密码）
- ✅ 获取当前用户信息
- ✅ 更新用户资料
- ✅ 搜索用户（管理员）

### 订单管理
- ✅ 创建订单
- ✅ 查看用户订单
- ✅ 取消订单
- ✅ 查看所有订单（管理员）
- ✅ 搜索订单（管理员）

## 后台管理系统计划

后台管理系统将支持以下功能：

### 1. 用户管理
- 查看所有用户列表
- 搜索用户（按邮箱、用户名）
- 查看用户详情
- 编辑用户信息
- 禁用/启用用户
- 查看用户订单历史

### 2. 订单管理
- 查看所有订单列表
- 搜索订单（按订单号、用户、城市）
- 筛选订单（按状态、日期）
- 查看订单详情
- 更新订单状态
- 删除订单

### 3. 数据统计
- 用户增长趋势
- 订单统计（按状态、城市、时间）
- 收入统计
- 热门城市分析

### 4. 操作日志
- 查看管理员操作记录
- 导出日志

## 数据库备份

### 备份数据库
```bash
mysqldump -u root -p chiavow > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 恢复数据库
```bash
mysql -u root -p chiavow < backup_20231201_120000.sql
```

## 性能优化建议

1. **索引优化**: 已为常用查询字段添加索引
2. **连接池**: 使用连接池管理数据库连接
3. **查询优化**: 使用JOIN减少查询次数
4. **缓存**: 可考虑添加 Redis 缓存热门数据

## 故障排查

### 连接失败
```bash
# 检查 MySQL 是否运行
ps aux | grep mysql

# 检查端口是否开放
netstat -an | grep 3306

# 测试连接
mysql -h localhost -u root -p
```

### 权限问题
```sql
-- 授予权限
GRANT ALL PRIVILEGES ON chiavow.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

## 开发注意事项

1. 所有数据库操作应通过 Repository 层
2. 使用事务处理复杂操作
3. 始终使用参数化查询防止 SQL 注入
4. 在生产环境更改默认密码和 JWT 密钥
5. 定期备份数据库

## 技术栈

- **数据库**: MySQL 8.0+
- **ORM**: mysql2 (Promise API)
- **连接池**: mysql2/promise
- **密码加密**: bcrypt
- **认证**: JWT

## 下一步计划

- [ ] 实现后台管理系统前端
- [ ] 添加数据导出功能（CSV/Excel）
- [ ] 实现订单统计图表
- [ ] 添加邮件通知功能
- [ ] 实现订单支付集成
