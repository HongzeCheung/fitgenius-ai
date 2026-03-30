# FitGenius 现有 Web 应用结构梳理

## 1. 页面与模块

| 模块 | 入口/文件 | 职责 |
| --- | --- | --- |
| 认证页 | `components/Auth.tsx` | 登录/注册、密码强度校验、成功后触发主应用加载。 |
| 首页仪表盘 | `components/Dashboard.tsx` | 今日训练统计、体重趋势、训练总览。 |
| 训练记录 | `components/WorkoutLogger.tsx` | 记录有氧/力量训练、热量估算、提交训练日志。 |
| AI 教练 | `components/AICoach.tsx` | 训练计划生成、训练分析、教练问答。 |
| 报告页 | `components/AnalysisReport.tsx` | 训练报告与分析结果展示。 |
| 动作详情 | `components/ExerciseDetail.tsx` | 动作记录与明细浏览。 |

## 2. 路由/视图切换

当前 Web 端没有使用 React Router，而是由 `App.tsx` 中的 `activeView` 状态进行视图切换：

- `dashboard`
- `coach`
- `report`
- `exercises`

认证态也通过 `isAuthenticated` 控制：

- 未登录：渲染 `<Auth />`
- 已登录：渲染主容器 + 底部导航 + 对应视图

## 3. 状态管理

主要使用 `App.tsx` 的本地状态提升模式：

- 用户态：`isAuthenticated`、`profile`
- 业务态：`logs`、`activeView`
- UI 态：`isLoggerOpen`、`isProfileOpen`、`isAppLoading`、`syncStatus`

子组件通过 props 向上传递动作：

- `onAddLog`
- `onWeightUpdate`
- `onSuccess`

## 4. API 层

统一由 `services/backend.ts` 封装，核心能力：

- 认证：`login/register/logout/hasToken`
- 资料：`getUserProfile/saveUserProfile`
- 体重：`addWeightLog`
- 训练日志：`getWorkoutLogs/addWorkoutLog`
- 训练计划：`getActivePlan/saveActivePlan`

特征：

1. 使用 `localStorage` 保存 token（`fg_token`）。
2. 通过 `Authorization: Bearer <token>` 透传认证头。
3. `401/403` 会清理 token 并刷新页面。
