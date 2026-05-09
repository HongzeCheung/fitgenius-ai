# 监控与测试配置指南

## 📊 监控体系

### 1. Sentry 错误监控

#### 配置步骤

1. **注册 Sentry 账号**
   - 访问 https://sentry.io
   - 创建新项目,选择 React

2. **获取 DSN**
   - 在项目设置中找到 DSN (Data Source Name)
   - 格式: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`

3. **配置环境变量**
   ```bash
   # .env.local
   SENTRY_DSN=your_sentry_dsn_here
   VITE_APP_VERSION=1.0.0
   ```

4. **验证配置**
   ```typescript
   // 在浏览器控制台测试
   import { captureException } from './services/monitoring';
   captureException(new Error('Test error'));
   ```

#### 监控功能

- ✅ 自动捕获未处理的异常
- ✅ 自动捕获未处理的 Promise rejection
- ✅ 性能监控 (页面加载、API 请求)
- ✅ 用户行为追踪 (面包屑)
- ✅ Session Replay (错误时回放用户操作)
- ✅ 自定义事件和上下文

#### 使用示例

```typescript
import { 
  captureException, 
  captureMessage, 
  addBreadcrumb,
  trackUserAction 
} from './services/monitoring';

// 捕获异常
try {
  riskyOperation();
} catch (error) {
  captureException(error, { context: 'additional info' });
}

// 记录消息
captureMessage('Important event happened', 'info');

// 添加面包屑
addBreadcrumb('User clicked button', 'ui.click', { buttonId: 'submit' });

// 追踪用户行为
trackUserAction('workout_completed', { duration: 45, calories: 300 });
```

---

### 2. Web Vitals 性能监控

#### 监控指标

| 指标 | 说明 | 良好阈值 | 需改进阈值 |
|------|------|----------|------------|
| **LCP** | 最大内容绘制 | < 2.5s | < 4.0s |
| **FID** | 首次输入延迟 | < 100ms | < 300ms |
| **CLS** | 累积布局偏移 | < 0.1 | < 0.25 |
| **FCP** | 首次内容绘制 | < 1.8s | < 3.0s |
| **TTFB** | 首字节时间 | < 800ms | < 1.8s |
| **INP** | 交互到下次绘制 | < 200ms | < 500ms |

#### 查看性能数据

1. **开发环境**: 打开浏览器控制台查看实时日志
2. **生产环境**: 在 Sentry Performance 面板查看
3. **自定义分析**: 数据会发送到 `/api/analytics/web-vitals`

#### 性能优化建议

```typescript
// 手动测量性能
import { mark, measure } from './services/webVitals';

mark('operation_start');
await heavyOperation();
mark('operation_end');
const duration = measure('heavy_operation', 'operation_start', 'operation_end');
console.log(`Operation took ${duration}ms`);
```

---

## 🧪 测试体系

### 1. 安装依赖

```bash
pnpm install
```

### 2. 运行测试

```bash
# 运行所有测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 运行测试 UI (可视化界面)
pnpm test:ui

# 监听模式 (开发时使用)
pnpm test -- --watch
```

### 3. 测试覆盖率

目标覆盖率:
- **Lines**: 60%
- **Functions**: 60%
- **Branches**: 60%
- **Statements**: 60%

查看覆盖率报告:
```bash
pnpm test:coverage
open coverage/index.html
```

### 4. 测试文件结构

```
tests/
├── setup.ts                    # 测试环境配置
├── components/                 # 组件测试
│   ├── Auth.test.tsx
│   └── Spinner.test.tsx
├── services/                   # 服务测试
│   └── geminiService.test.ts
└── utils/                      # 工具函数测试
    └── calorieCalculator.test.ts
```

### 5. 编写测试示例

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);
    
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

---

## 🚀 CI/CD 集成

### GitHub Actions 示例

创建 `.github/workflows/test.yml`:

```yaml
name: Test & Monitor

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Run tests
        run: pnpm test:coverage
        
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          
      - name: Type check
        run: pnpm type-check
```

---

## 📈 监控仪表板

### Sentry 仪表板

1. **Issues**: 查看所有错误和异常
2. **Performance**: 查看性能指标和慢事务
3. **Releases**: 按版本追踪错误
4. **Alerts**: 配置告警规则

### 推荐告警规则

1. **错误率告警**: 错误率 > 5% 时发送通知
2. **性能告警**: LCP > 4s 时发送通知
3. **用户影响告警**: 单个错误影响 > 100 用户时通知

---

## 🔍 调试技巧

### 1. 本地调试 Sentry

```typescript
// 在 monitoring.ts 中设置
beforeSend(event, hint) {
  console.log('Sentry Event:', event, hint);
  return event; // 开发环境也上报
}
```

### 2. 查看 Web Vitals

打开浏览器控制台,查看 `[Web Vitals]` 日志

### 3. 测试覆盖率热图

```bash
pnpm test:coverage
open coverage/index.html
```

点击文件名查看哪些行未被测试覆盖

---

## 📚 最佳实践

### 1. 错误处理

```typescript
// ❌ 不好
try {
  await apiCall();
} catch (error) {
  console.error(error); // 错误被吞掉
}

// ✅ 好
try {
  await apiCall();
} catch (error) {
  captureException(error, { context: 'api_call' });
  throw error; // 继续抛出
}
```

### 2. 性能监控

```typescript
// ✅ 监控关键操作
const transaction = startTransaction('ai.generate_plan', 'ai.request');
try {
  const result = await generatePlan();
  transaction.setStatus('ok');
  return result;
} finally {
  transaction.finish();
}
```

### 3. 用户行为追踪

```typescript
// ✅ 追踪关键用户行为
trackUserAction('workout_completed', {
  duration: 45,
  calories: 300,
  exerciseCount: 5,
});
```

---

## 🎯 面试要点

### 可以讲的亮点

1. **完整的监控体系**
   - Sentry 错误追踪
   - Web Vitals 性能监控
   - 自定义事件追踪

2. **测试覆盖率**
   - 单元测试 (Vitest)
   - 组件测试 (React Testing Library)
   - 覆盖率 > 60%

3. **可观测性**
   - 错误上报
   - 性能指标
   - 用户行为追踪

4. **生产就绪**
   - 环境隔离 (开发/生产)
   - 采样率配置
   - 敏感信息过滤

### 面试话术

> "我在项目中集成了完整的监控体系。使用 Sentry 进行错误追踪和性能监控,配置了 Session Replay 用于错误复现。同时集成了 Web Vitals 监控 LCP、FID、CLS 等核心指标,确保用户体验。测试方面,使用 Vitest + React Testing Library,覆盖率达到 60% 以上,包括核心业务逻辑(如热量计算算法)和关键组件的测试。"

---

## 📞 故障排查

### 问题: Sentry 没有收到错误

1. 检查 DSN 配置是否正确
2. 检查 `beforeSend` 是否返回 `null`
3. 检查网络是否被拦截 (CORS)

### 问题: 测试失败

1. 清除缓存: `pnpm test -- --clearCache`
2. 检查 mock 是否正确
3. 查看详细错误: `pnpm test -- --reporter=verbose`

### 问题: 覆盖率不达标

1. 查看覆盖率报告找到未覆盖的代码
2. 补充测试用例
3. 排除不需要测试的文件 (配置文件、类型定义等)
