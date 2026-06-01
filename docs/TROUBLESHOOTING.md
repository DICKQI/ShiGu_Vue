# 常见问题与故障排除

本文档收集当前项目开发、构建、部署、认证和移动端调试中常见的问题。

## 开发环境

### Q1: API 跨域或请求不到后端？

检查：

- 开发环境是否通过 `pnpm dev` 启动
- `vite.config.ts` 中 `/api` 代理目标是否是 `http://127.0.0.1:8000`
- 后端是否启动并监听对应端口
- 设置页是否保存了其他后端地址，覆盖了开发代理

后端地址优先级为：

1. `localStorage.pickgoods_api_base_url`
2. `localStorage.shigu_api_base_url`
3. `VITE_API_BASE_URL`
4. `当前协议://当前主机名:8000`

### Q2: `.env` 修改后不生效？

- `.env` 必须放在项目根目录
- 变量名必须以 `VITE_` 开头
- 修改后需要重启 `pnpm dev`
- 如果设置页保存过地址，本地存储会优先于 `.env`

### Q3: 构建失败，类型检查报错？

先单独执行：

```bash
pnpm type-check
```

修复类型错误后再执行：

```bash
pnpm build
```

临时只验证 Vite 构建可用：

```bash
pnpm build-only
```

### Q4: ESLint 后文件被自动改了？

`pnpm lint` 的脚本是：

```bash
eslint . --fix --cache
```

这是预期行为。提交前请检查自动修复产生的 diff。

## 认证与权限

### Q5: 访问页面被跳到登录页？

以下路由需要登录：

- `/showcase`
- `/location`
- `/ipcharacter`
- `/category`
- `/theme`
- `/goods/*`
- `/admin/*`

如果 Token 过期或后端返回 `401`，前端会清理本地 Token 并跳转 `/login?redirect=...`。

### Q6: 管理后台打不开？

管理后台需要当前用户角色为 `Admin`。前端判断逻辑为：

```ts
user.role.toLowerCase() === 'admin'
```

如果不是管理员，会跳转到设置页。后端也应同步做权限校验。

### Q7: 登录后 API 仍然 401？

检查：

- 登录接口是否返回 `access_token`
- 本地存储是否存在 `pickgoods_access_token`
- 请求头是否带有 `Authorization: Bearer <token>`
- 后端 Token 格式是否和前端约定一致

## 功能问题

### Q8: 新增谷子出现 409 冲突？

这是重复检测场景。前端不会弹全局错误，而是由业务层展示候选谷子并让用户选择新建或合并。

### Q9: 搜索太快触发 429？

谷仓搜索有 `300ms` 防抖，但后端仍可能限流。等待几秒后再试，或检查后端限流策略。

### Q10: 图片上传失败？

检查：

- 是否使用了 `FormData`
- 后端是否接受对应字段名，例如 `main_photo`、`additional_photos`
- 文件大小和格式是否被后端拒绝
- 认证 Token 是否有效
- 浏览器控制台 Network 里的响应详情

### Q11: BGM 导入失败？

检查：

- `/api/bgm/search-subjects/`
- `/api/bgm/get-characters-by-id/`
- `/api/bgm/create-characters/`
- 后端是否能访问 Bangumi
- 当前账号是否有创建公共元数据权限

## 生产部署

### Q12: 生产环境 API 地址不对？

前端 API 路径本身已经包含 `/api/...`，所以 `VITE_API_BASE_URL` 应配置到 origin：

```bash
VITE_API_BASE_URL=https://api.example.com pnpm build
```

实际请求：

```text
https://api.example.com/api/goods/
```

同源 Nginx 反代时：

```bash
VITE_API_BASE_URL=https://app.example.com pnpm build
```

实际请求：

```text
https://app.example.com/api/goods/
```

### Q13: 刷新页面后 404？

这是 SPA history fallback 未配置。Nginx 需要：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Q14: `pnpm deploy` 部署失败？

检查：

- `pnpm build` 是否成功
- `deploy.cjs` 中的 host、port、username、password、remotePath 是否正确
- 远端目录是否存在且账号有权限
- 远端是否安装 `unzip`
- 本地网络是否能连接服务器 SSH 端口

安全提醒：不要把真实服务器密码提交到公开仓库。

## 移动端

### Q15: 真机无法连接后端？

不要在真机中使用：

```text
localhost
127.0.0.1
```

它们会指向手机自身。请改用：

- 电脑局域网 IP，例如 `http://192.168.1.10:8000`
- 测试服务器域名
- 生产 HTTPS 域名

同时确认后端监听 `0.0.0.0`，防火墙放行端口。

### Q16: Capacitor 修改后没有同步到 Android？

执行：

```bash
pnpm build
pnpm exec cap sync android
```

如果只复制 Web 产物：

```bash
pnpm exec cap copy android
```

### Q17: 相机不可用？

检查：

- 是否安装 `@capacitor/camera`
- 是否执行过 `pnpm exec cap sync`
- AndroidManifest 或 iOS Info.plist 是否配置权限
- 是否在真机上测试

### Q18: Live Reload 不工作？

检查：

- `pnpm dev -- --host 0.0.0.0` 是否启动
- 手机与电脑是否在同一网络
- 防火墙是否允许 Vite 端口
- 是否使用 `pnpm exec cap run android -l --external`

## 依赖与环境

### Q19: 依赖安装失败？

检查 Node 和 pnpm 版本：

```bash
node -v
pnpm -v
```

项目要求：

- Node.js `^20.19.0 || >=22.12.0`
- pnpm `>=9.0.0`

可尝试：

```bash
pnpm store prune
pnpm install
```

### Q20: patch-package 补丁没有生效？

检查：

- 是否使用 pnpm 安装
- `package.json` 中 `pnpm.patchedDependencies` 是否存在
- `patches/@capacitor-community__http@1.4.1.patch` 是否存在

重新安装依赖后再验证。

## 获取更多信息

定位问题时优先查看：

1. 浏览器控制台 Console
2. 浏览器 Network 面板
3. 后端日志
4. `docs/API.md`
5. `src/utils/request.ts`
6. 对应页面或 store 的源码
