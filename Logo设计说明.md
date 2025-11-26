# 🎨 Chiavow Logo 设计说明

## Logo 文件

### 1. 主 Logo (`/client/public/logo.svg`)
- **尺寸**: 120x120px
- **用途**: 登录页、启动页、品牌展示
- **特点**:
  - 渐变色圆形背景（紫色到粉色）
  - 字母 "C" 代表 Chiavow
  - 飞机图标象征旅行
  - 地点标记代表目的地
  - 星星装饰增添活力

### 2. 小尺寸 Logo (`/client/public/logo-small.svg`)
- **尺寸**: 40x40px
- **用途**: 导航栏、小图标
- **特点**:
  - 简化版设计
  - 保留核心元素（"C" + 飞机）
  - 适合小尺寸显示

### 3. Favicon (`/client/public/favicon.svg`)
- **尺寸**: 32x32px
- **用途**: 浏览器标签页图标
- **特点**:
  - 极简设计
  - 清晰可辨
  - SVG 格式支持各种分辨率

## 设计理念

### 色彩方案
```css
主渐变: #667eea → #764ba2 (蓝紫色到深紫色)
强调色: #FFD700 (金色 - 用于飞机和标记)
辅助色: 白色 (主要图形)
```

### 象征意义
- **"C" 字母**: Chiavow 品牌标识
- **飞机**: 旅行、探索、冒险
- **地点标记**: 目的地、导航、伴游
- **星星**: 活力、优质服务、美好体验
- **渐变色**: 现代、科技、专业

## Logo 使用位置

### 1. 登录页面 (`AuthView.vue`)
```vue
<img src="/logo.svg" alt="Chiavow Logo" class="logo-image" />
```
- 尺寸: 100x100px
- 带浮动动画效果
- 居中显示

### 2. 主界面顶部 (`MainView.vue`)
```vue
<img src="/logo-small.svg" alt="Chiavow" class="header-logo" />
```
- 尺寸: 32x32px
- 配合渐变文字 "Chiavow"
- 固定在顶部导航栏

### 3. 浏览器标签页 (`index.html`)
```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```

## Logo 动画

### 登录页浮动动画
```css
@keyframes logoFloat {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}
```
- 持续时间: 3秒
- 缓动函数: ease-in-out
- 无限循环

## 响应式适配

### 移动端
- 登录页 Logo: 80-100px
- 导航栏 Logo: 28-32px

### PC端
- 登录页 Logo: 100-120px
- 导航栏 Logo: 32-36px

## 文件格式说明

### 为什么使用 SVG？
1. **矢量图形**: 任意缩放不失真
2. **文件小**: 比 PNG/JPG 更小
3. **可编辑**: 可以直接修改代码
4. **支持动画**: 可以添加 CSS 动画
5. **支持渐变**: 颜色更丰富

### SVG 优势
- 支持所有现代浏览器
- 支持 Retina 屏幕
- 可以通过 CSS 修改颜色
- 支持响应式设计

## 品牌应用规范

### ✅ 推荐做法
- 保持 Logo 原有配色
- 在纯色背景上使用
- 保持 Logo 清晰可见
- 保留足够的留白空间

### ❌ 避免做法
- 不要拉伸变形
- 不要修改配色（除非有品牌需要）
- 不要在复杂背景上使用
- 不要过度缩小导致不清晰

## 导出其他格式

如果需要 PNG 格式：

### 在线工具
1. 访问 https://svgtopng.com
2. 上传 SVG 文件
3. 选择尺寸导出

### 使用代码（Node.js）
```bash
npm install sharp
```

```javascript
const sharp = require('sharp')
const fs = require('fs')

const svgBuffer = fs.readFileSync('logo.svg')

sharp(svgBuffer)
  .resize(512, 512)
  .png()
  .toFile('logo-512.png')
```

## 常用尺寸导出

### Web 应用
- **Favicon**: 32x32, 64x64
- **导航栏**: 40x40, 48x48
- **启动页**: 512x512, 1024x1024

### 移动应用
- **iOS**: 180x180 (App Icon)
- **Android**: 192x192, 512x512

### 社交媒体
- **微信分享**: 200x200
- **微博头像**: 180x180
- **Facebook**: 500x500

## 更新日志

### v1.0 (2025-11-26)
- ✅ 创建主 Logo (120x120)
- ✅ 创建小尺寸 Logo (40x40)
- ✅ 创建 Favicon (32x32)
- ✅ 应用到登录页面
- ✅ 应用到主界面导航栏
- ✅ 添加浮动动画
- ✅ 更新 HTML meta 标签

## 未来优化方向

### 短期 (1-2周)
- [ ] 添加深色模式 Logo 版本
- [ ] 创建横版 Logo（含文字）
- [ ] 导出多尺寸 PNG 资源

### 长期 (1-3个月)
- [ ] 设计完整 VI 系统
- [ ] 创建品牌指南文档
- [ ] 设计营销物料模板
- [ ] 制作动态 Logo 动画

## 技术支持

如需修改 Logo 颜色：

### 修改主色调
在 SVG 文件中找到 `<linearGradient>` 标签：

```svg
<linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
  <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />  <!-- 修改这里 -->
  <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" /> <!-- 修改这里 -->
</linearGradient>
```

### 修改强调色（飞机/标记）
找到 `fill="#FFD700"` 修改为其他颜色。

## 联系方式

如有品牌设计需求，请联系开发团队。

---

**设计师**: Claude AI
**创建日期**: 2025-11-26
**版本**: 1.0
**许可**: MIT License
