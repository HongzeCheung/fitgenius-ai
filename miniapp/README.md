# FitGenius 微信小程序（Taro）

## 已完成

- 基于 Taro 的微信小程序工程骨架。
- 页面：微信授权登录、仪表盘、训练记录。
- 状态管理：React Context + Reducer。
- API 层：请求封装 + token 存储 + 业务 API。
- 微信授权：`Taro.login` + `Taro.getUserProfile`，对接 `/auth/wechat`。

## 运行

```bash
cd miniapp
pnpm install
pnpm dev:weapp
```

## 联调说明

默认后端：`https://fit-backend-1jpe.onrender.com/api`

可通过环境变量覆盖：

```bash
API_BASE_URL=https://your-api.example.com/api pnpm dev:weapp
```
