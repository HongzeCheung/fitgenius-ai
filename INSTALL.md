# 安装与配置指南

## 📦 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

## ⚙️ 环境配置

创建 `.env.local` 文件:

```bash
# Google Gemini API Key (必需)
API_KEY=your_gemini_api_key_here

# Sentry DSN (可选,生产环境推荐)
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# 应用版本 (用于 Sentry Release 追踪)
VITE_APP_VERSION=1.0.0

# 后端 API 地址 (如果使用真实后端)
VITE_API_URL=https://your-backend.com/api
```

### 获取 Gemini API Key

1. 访问 https://makersuite.google.com/app/apikey
2. 点击 "Create API Key"
3. 复制 API Key 到 `.env.local`

### 配置 Sentry (可选)

1. 注册 Sentry 账号: https://sentry.io
2. 创建新项目,选择 React
3. 复制 DSN 到 `.env.local`

## 🚀 运行项目

### 开发模式

```bash
pnpm dev
```

访问 http://localhost:5173

### 生产构建

```bash
pnpm build
```

构建产物在 `dist/` 目录

### 预览生产构建

```bash
pnpm preview
```

## 🧪 运行测试

```bash
# 运行所有测试
pnpm test

# 监听模式
pnpm test -- --watch

# 生成覆盖率报告
pnpm test:coverage

# 可视化测试 UI
pnpm test:ui
```

## 🔍 类型检查

```bash
pnpm type-check
```

## 📝 常见问题

### Q: 安装依赖失败?

**A**: 尝试清除缓存:
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Q: Gemini API 调用失败?

**A**: 检查:
1. API Key 是否正确
2. 是否有 API 配额
3. 网络是否正常

### Q: 测试失败?

**A**: 尝试:
```bash
pnpm test -- --clearCache
```

### Q: TypeScript 报错?

**A**: 运行类型检查查看详细错误:
```bash
pnpm type-check
```

## 🌐 部署

### Vercel (推荐)

1. 连接 GitHub 仓库
2. 配置环境变量 (API_KEY, SENTRY_DSN)
3. 自动部署

### 其他平台

```bash
# 构建
pnpm build

# 部署 dist/ 目录到任何静态托管服务
```

## 📚 下一步

1. 阅读 [QUICKSTART_MONITORING.md](./QUICKSTART_MONITORING.md) 配置监控
2. 阅读 [TESTING.md](./TESTING.md) 了解测试
3. 阅读 [MONITORING.md](./MONITORING.md) 了解监控详情
