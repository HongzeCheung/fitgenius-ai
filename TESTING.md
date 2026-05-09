# 测试指南

## 🎯 测试策略

### 测试金字塔

```
        /\
       /  \      E2E Tests (少量)
      /____\     
     /      \    Integration Tests (适量)
    /________\   
   /          \  Unit Tests (大量)
  /__________  \
```

### 当前测试覆盖

- ✅ **单元测试**: 核心业务逻辑 (热量计算、缓存机制)
- ✅ **组件测试**: UI 组件 (Auth, Spinner)
- ✅ **服务测试**: API 服务和工具函数
- ⏳ **集成测试**: 待补充
- ⏳ **E2E 测试**: 待补充

---

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 运行测试

```bash
# 运行所有测试
pnpm test

# 监听模式 (开发时推荐)
pnpm test -- --watch

# 运行单个测试文件
pnpm test tests/services/geminiService.test.ts

# 运行匹配模式的测试
pnpm test -- --grep "Calorie"
```

### 3. 查看覆盖率

```bash
# 生成覆盖率报告
pnpm test:coverage

# 在浏览器中查看
open coverage/index.html
```

### 4. 可视化测试 UI

```bash
# 启动测试 UI
pnpm test:ui

# 浏览器会自动打开 http://localhost:51204/__vitest__/
```

---

## 📝 测试用例说明

### 1. 缓存机制测试 (`geminiService.test.ts`)

测试 SessionStorage 缓存的核心功能:

```typescript
✓ 存储和读取数据
✓ 不存在的 key 返回 null
✓ 生成稳定的缓存 key
✓ 处理存储失败
✓ 处理损坏的缓存数据
```

**为什么重要**: 缓存是节省 API 调用的关键,必须确保稳定性

### 2. 热量计算测试 (`calorieCalculator.test.ts`)

测试基于 MET 的热量计算算法:

```typescript
✓ 纯力量训练的热量计算
✓ 纯有氧训练的热量计算
✓ 混合训练的热量计算
✓ 空动作列表的处理
✓ 爬坡跑的 MET 调整
✓ 零时长的边界情况
```

**为什么重要**: 这是核心业务逻辑,直接影响用户体验

### 3. 组件测试 (`Auth.test.tsx`)

测试登录/注册组件:

```typescript
✓ 默认渲染登录表单
✓ 切换到注册模式
✓ 成功登录流程
✓ 登录失败显示错误
✓ 加载时禁用按钮
✓ 空字段验证
```

**为什么重要**: 认证是应用的入口,必须保证可靠性

---

## 🎨 编写测试的最佳实践

### 1. 测试命名

```typescript
// ❌ 不好
it('test 1', () => {});

// ✅ 好
it('should calculate calories for strength training only', () => {});
```

### 2. AAA 模式 (Arrange-Act-Assert)

```typescript
it('should add two numbers', () => {
  // Arrange: 准备测试数据
  const a = 1;
  const b = 2;
  
  // Act: 执行被测试的操作
  const result = add(a, b);
  
  // Assert: 验证结果
  expect(result).toBe(3);
});
```

### 3. Mock 外部依赖

```typescript
// Mock API 调用
vi.mock('../../services/backend', () => ({
  backend: {
    login: vi.fn(),
    register: vi.fn()
  }
}));

// 在测试中设置返回值
vi.mocked(backend.login).mockResolvedValue({ token: 'test-token' });
```

### 4. 测试用户交互

```typescript
import userEvent from '@testing-library/user-event';

it('should handle button click', async () => {
  render(<MyComponent />);
  
  const button = screen.getByRole('button');
  await userEvent.click(button);
  
  expect(screen.getByText('Clicked')).toBeInTheDocument();
});
```

### 5. 异步测试

```typescript
it('should load data', async () => {
  render(<MyComponent />);
  
  // 等待元素出现
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

---

## 🔧 常见问题

### Q: 测试运行很慢怎么办?

A: 使用 `--run` 模式而不是 watch 模式:
```bash
pnpm test -- --run
```

### Q: 如何只运行失败的测试?

A: 使用 `--changed` 或 `--related` 标志:
```bash
pnpm test -- --changed
```

### Q: 如何调试测试?

A: 在测试中添加 `debugger` 或使用 `screen.debug()`:
```typescript
it('debug test', () => {
  render(<MyComponent />);
  screen.debug(); // 打印当前 DOM
});
```

### Q: Mock 不生效?

A: 确保 mock 在 import 之前:
```typescript
// ✅ 正确
vi.mock('./module');
import { something } from './module';

// ❌ 错误
import { something } from './module';
vi.mock('./module');
```

---

## 📊 覆盖率目标

| 类型 | 当前 | 目标 | 状态 |
|------|------|------|------|
| Lines | - | 60% | 🟡 |
| Functions | - | 60% | 🟡 |
| Branches | - 60% | 🟡 |
| Statements | - | 60% | 🟡 |

### 提高覆盖率的策略

1. **优先测试核心业务逻辑**
   - 热量计算
   - AI 请求处理
   - 数据合并逻辑

2. **测试边界情况**
   - 空数据
   - 极大/极小值
   - 错误输入

3. **测试错误处理**
   - API 失败
   - 网络错误
   - 数据格式错误

---

## 🎯 待补充的测试

### 高优先级

- [ ] Dashboard 组件测试
- [ ] WorkoutLogger 组件测试
- [ ] AICoach 组件测试
- [ ] backend service 集成测试

### 中优先级

- [ ] AnalysisReport 组件测试
- [ ] ExerciseDetail 组件测试
- [ ] 日期合并逻辑测试

### 低优先级

- [ ] E2E 测试 (Playwright)
- [ ] 视觉回归测试 (Percy)
- [ ] 性能测试 (Lighthouse CI)

---

## 🚀 CI/CD 集成

测试会在以下情况自动运行:

1. **Push 到 main/develop 分支**
2. **创建 Pull Request**
3. **手动触发 workflow**

### 查看测试结果

1. 进入 GitHub Actions 页面
2. 点击最新的 workflow run
3. 查看 "Run Tests" job 的输出

### 覆盖率报告

- Codecov 会自动生成覆盖率报告
- PR 中会显示覆盖率变化
- 访问 https://codecov.io/gh/your-repo 查看详细报告

---

## 📚 参考资料

- [Vitest 文档](https://vitest.dev/)
- [React Testing Library 文档](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Mock Service Worker](https://mswjs.io/) - API mocking
