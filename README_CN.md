# 🌟 Chiavow - 中国旅游伴游平台

**一个连接旅行者与本地导游的现代化 Web 应用**

[English](README.md) | 简体中文

---

## 🚀 快速开始

```bash
# 1. 进入项目目录
cd chiavow

# 2. 安装依赖（首次运行）
chmod +x setup.sh && ./setup.sh

# 3. 启动后端（新终端）
cd server && npm run dev

# 4. 启动前端（新终端）
cd client && npm run dev

# 5. 访问应用
# 打开浏览器访问 http://localhost:3000
```

## 📚 文档导航

| 文档 | 说明 | 适合人群 |
|------|------|----------|
| [📖 项目交付文档](./项目交付文档.md) | 项目概述和功能清单 | 🆕 新用户 |
| [🚀 QUICKSTART](./QUICKSTART.md) | 快速开始指南 | 👨‍💻 开发者 |
| [📋 README](./README.md) | 完整功能文档（英文） | 👨‍💻 开发者 |
| [🌐 DEPLOYMENT_CN](./DEPLOYMENT_CN.md) | 详细部署指南（中文） | 🔧 运维人员 |
| [📁 PROJECT_STRUCTURE](./PROJECT_STRUCTURE.md) | 项目结构详解 | 👨‍💻 开发者 |
| [📝 文件清单](./文件清单.md) | 所有文件列表 | 👀 所有人 |

## ✨ 主要功能

- ✅ **手机验证码登录** - 快速安全的身份认证
- ✅ **个性化资料** - 自定义头像和语言偏好
- ✅ **智能匹配** - 多城市、多行程导游匹配
- ✅ **订单管理** - 创建、支付、取消订单
- ✅ **多语言支持** - 英语、中文无缝切换
- ✅ **响应式设计** - 完美适配手机和电脑

## 🎯 项目亮点

### 🎨 精美界面
- 现代化设计风格
- 流畅的动画效果
- 移动端优先体验
- 直观的用户交互

### 🔒 安全可靠
- JWT Token 认证
- 安全的文件上传
- 环境变量保护
- CORS 跨域配置

### 🌍 国际化
- 完整的多语言支持
- 实时语言切换
- 所有文本已翻译

### 📱 响应式
- 完美适配手机
- 支持平板和桌面
- 优雅的布局自适应

## 🛠️ 技术栈

### 前端
- **Vue 3** - 现代化前端框架
- **TypeScript** - 类型安全
- **Vite** - 超快的构建工具
- **Pinia** - 状态管理
- **Vue Router** - 路由管理
- **Vue I18n** - 国际化

### 后端
- **Node.js** - JavaScript 运行时
- **Express** - Web 框架
- **TypeScript** - 类型安全
- **JWT** - 身份认证
- **Multer** - 文件上传
- **Canvas** - 图像处理

## 📦 项目结构

```
chiavow/
├── client/           # Vue 3 前端应用
│   ├── src/
│   │   ├── views/   # 6 个页面组件
│   │   ├── api/     # API 服务层
│   │   ├── stores/  # 状态管理
│   │   ├── locales/ # 多语言文件
│   │   └── router/  # 路由配置
│   └── ...
├── server/          # Node.js 后端应用
│   ├── src/
│   │   ├── routes/  # API 路由
│   │   ├── middleware/ # 中间件
│   │   └── utils/   # 工具函数
│   └── ...
└── docs/            # 完整的文档
```

## 🎮 使用演示

### 1️⃣ 登录
<img src="https://via.placeholder.com/300x600/FF6B6B/FFFFFF?text=Login+Page" alt="登录页面" width="200"/>

输入手机号 → 获取验证码 → 登录

### 2️⃣ 设置资料
<img src="https://via.placeholder.com/300x600/4ECDC4/FFFFFF?text=Profile+Setup" alt="资料设置" width="200"/>

上传头像 → 填写信息 → 开始使用

### 3️⃣ 创建订单
<img src="https://via.placeholder.com/300x600/FFE66D/333333?text=Guide+Hailing" alt="导游匹配" width="200"/>

选择城市 → 设置日期 → 添加服务 → 匹配导游

### 4️⃣ 管理订单
<img src="https://via.placeholder.com/300x600/FFA07A/FFFFFF?text=Orders" alt="订单管理" width="200"/>

查看订单 → 支付 → 完成

## 🚀 部署选项

### 选项 1: 传统部署（推荐）
使用 PM2 + Nginx，适合 VPS 和云服务器
```bash
# 查看详细步骤
cat DEPLOYMENT_CN.md
```

### 选项 2: Docker 部署
一键部署，适合容器化环境
```bash
docker-compose up -d
```

### 选项 3: 云平台
- 阿里云（详细文档）
- AWS / DigitalOcean / Azure
- 其他云服务商

## 🎓 学习资源

### 新手入门
1. 阅读 [项目交付文档](./项目交付文档.md)
2. 跟随 [QUICKSTART](./QUICKSTART.md) 运行项目
3. 浏览 [README](./README.md) 了解详情

### 进阶学习
1. 研究 [PROJECT_STRUCTURE](./PROJECT_STRUCTURE.md)
2. 查看源代码注释
3. 尝试自定义功能

### 部署上线
1. 跟随 [DEPLOYMENT_CN](./DEPLOYMENT_CN.md)
2. 配置服务器环境
3. 监控和维护

## 🤝 开发建议

### 开发环境
- Node.js 16+
- npm 7+
- VSCode（推荐）
- Chrome DevTools

### 推荐插件（VSCode）
- Vue Language Features (Volar)
- TypeScript Vue Plugin (Volar)
- ESLint
- Prettier

## 📈 未来规划

### 短期（1-3个月）
- [ ] 集成真实数据库
- [ ] 接入短信服务
- [ ] 集成支付系统
- [ ] 添加单元测试

### 中期（3-6个月）
- [ ] 导游管理系统
- [ ] 评价系统
- [ ] 实时聊天
- [ ] 地图集成

### 长期（6-12个月）
- [ ] 管理后台
- [ ] 数据分析
- [ ] 移动 App
- [ ] 国际化扩展

## 💡 核心特性

### 认证系统
- 手机号验证码登录
- JWT Token 认证
- 自动登录保持
- 安全退出

### 用户管理
- 头像上传
- 自动头像生成
- 多语言偏好
- 个人资料管理

### 订单系统
- 智能价格计算
- 多种服务选项
- 订单状态管理
- 支付和取消

### 界面体验
- 美观的视觉设计
- 流畅的交互动画
- 清晰的信息架构
- 友好的错误提示

## 🔍 技术亮点

### 前端架构
- 组件化开发
- 模块化设计
- 响应式布局
- 性能优化

### 后端架构
- RESTful API
- 中间件模式
- 错误处理
- 日志记录

### 代码质量
- TypeScript 类型安全
- 清晰的代码结构
- 详细的注释
- 最佳实践

## 📞 获取帮助

### 问题排查
1. 检查控制台日志
2. 查看浏览器 Network 面板
3. 阅读错误信息
4. 参考文档

### 常见问题
详见 [项目交付文档](./项目交付文档.md) 的常见问题部分

## 📄 许可证

MIT License - 开源免费使用

## 🙏 致谢

感谢使用 Chiavow！如有问题或建议，欢迎反馈。

---

**Made with ❤️ for China Travel**

**祝您使用愉快！🎉**
