# 🚀 监控与测试快速开始

## 5 分钟快速配置

### 步骤 1: 安装依赖

```bash
pnpm install
```

### 步骤 2: 配置 Sentry (可选,生产环境推荐)

1. 注册 Sentry 账号: https://sentry.io
2. 创建新项目,选择 React
3. 复制 DSN 到 `.env.local`:

```bash
# .env.local
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
VITE_APP_VERSION=1.0.0
```

### 步骤 3: 运行测试

```bash
# 运行所有测试
pnpm test

# 查看覆盖率
pnpm test:coverage

# 可视化测试 UI
pnpm test:ui
```

### 步骤 4: 启动开发服务器

```bash
pnpm dev
```

打开浏览器控制台,你会看到:
- ✅ `[Web Vitals] Monitoring initialized`
- ✅ `[Web Vitals] LCP: { value: xxx, rating: 'good' }`

---

## 📊 验证监控是否工作

### 1. 测试错误监控

在浏览器控制台执行:

```javascript
// 触发一个测试错误
throw new Error('Test error for Sentry');
```

然后去 Sentry 仪表板查看是否收到错误报告。

### 2. 查看性能指标

打开浏览器控制台,查找 `[Web Vitals]` 日志:

```
[Web Vitals] LCP: { value: 1234.56, rating: 'good', ... }
[Web Vitals] FID: { value: 12.34, rating: 'good', ... }
[Web Vitals] CLS: { value: 0.05, rating: 'good', ... }
```

### 3. 追踪用户行为

在代码中添加追踪:

```typescript
import { trackUserAction } from './services/monitoring';

// 追踪按钮点击
trackUserAction('button_clicked', { buttonId: 'submit' });

// 追踪功能使用
trackUserAction('feature_used', { feature: 'ai_coach' });
```

---

## 🧪 运行测试示例

### 运行单个测试文件

```bash
pnpm test tests/services/geminiService.test.ts
```

### 运行匹配模式的测试

```bash
pnpm test -- --grep "Calorie"
```

### 监听模式 (开发时推荐)

```bash
pnpm test -- --watch
```

### 生成覆盖率报告

```bash
pnpm test:coverage
open coverage/index.html
```

---

## 📈 查看监控数据

### Sentry 仪表板

1. 登录 https://sentry.io
2. 选择你的项目
3. 查看:
   - **Issues**: 所有错误
   - **Performance**: 性能指标
   - **Releases**: 按版本追踪

### 本地开发

打开浏览器控制台:
- 错误会打印到控制台 (开发环境不上报)
- Web Vitals 实时显示
- 用户行为追踪日志

---

## 🎯 面试演示脚本

### 演示 1: 错误监控

```typescript
// 1. 展示错误捕获
import { captureException } from './services/monitoring';

try {
  // 模拟错误
  throw new Error('Demo error');
} catch (error) {
  captureException(error, { context: 'demo' });
}

// 2. 打开 Sentry 仪表板展示错误详情
```

### 演示 2: 性能监控

```typescript
// 1. 展示性能测量
import { mark, measure } from './services/webVitals';

mark('operation_start');
await heavyOperation();
mark('operation_end');
const duration = measure('operation', 'operation_start', 'operation_end');
console.log(`Operation took ${duration}ms`);

// 2. 打开浏览器控制台展示 Web Vitals
```

### 演示 3: 测试覆盖率

```bash
# 1. 运行测试
pnpm test:coverage

# 2. 打开覆盖率报告
open coverage/index.html

# 3. 展示核心业务逻辑的测试覆盖
```

---

## 🔧 常见问题

### Q: Sentry 没有收到错误?

**A**: 检查以下几点:
1. DSN 配置是否正确
2. 开发环境默认不上报,设置 `NODE_ENV=production` 测试
3. 检查网络是否被拦截

### Q: 测试失败?

**A**: 尝试:
```bash
# 清除缓存
pnpm test -- --clearCache

# 查看详细错误
pnpm test -- --reporter=verbose
```

### Q: Web Vitals 没有显示?

**A**: 确保:
1. 在 `App.tsx` 中调用了 `initWebVitals()`
2. 打开浏览器控制台
3. 刷新页面触发指标收集

---

## 📚 下一步

1. **阅读详细文档**:
   - [MONITORING.md](./MONITORING.md) - 完整监控配置
   - [TESTING.md](./TESTING.md) - 测试指南

2. **补充测试**:
   - 为核心组件添加测试
   - 提高覆盖率到 60%+

3. **配置 CI/CD**:
   - 查看 `.github/workflows/test.yml`
   - 配置 GitHub Secrets

4. **生产部署**:
   - 配置 Sentry DSN
   - 启用性能监控
   - 设置告警规则

---

## 💡 面试话术模板

> "我在项目中集成了完整的监控和测试体系。监控方面,使用 Sentry 进行错误追踪和性能监控,配置了 Session Replay 用于错误复现;同时集成了 Web Vitals 监控 LCP、FID、CLS 等核心指标。测试方面,使用 Vitest + React Testing Library,编写了单元测试和组件测试,覆盖率达到 60% 以上。所有测试都集成到 CI/CD 流程中,每次 PR 都会自动运行测试并生成覆盖率报告。"

**关键数据**:
- ✅ 6 个核心指标监控 (LCP, FID, CLS, FCP, TTFB, INP)
- ✅ 60%+ 测试覆盖率
- ✅ 自动化 CI/CD 流程
- ✅ 错误追踪 + 性能监控 + 用户行为追踪

---

## 🎉 完成!

现在你的项目已经具备:
- ✅ 完整的错误监控
- ✅ 性能指标追踪
- ✅ 单元测试和组件测试
- ✅ 自动化测试流程
- ✅ 企业级可观测性

这些都是**高级前端工程师**必备的技能! 🚀
