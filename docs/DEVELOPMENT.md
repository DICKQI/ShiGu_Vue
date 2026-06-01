# 开发指南

本文档面向前端、后端、测试和产品设计协作者，说明当前项目的本地开发方式、代码约定和已实现能力。

## 环境与命令

项目要求见 `package.json`：

| 工具 | 要求 |
|------|------|
| Node.js | `^20.19.0 || >=22.12.0` |
| pnpm | `>=9.0.0` |

常用命令：

```bash
pnpm install
pnpm dev
pnpm type-check
pnpm lint
pnpm test:unit
pnpm build
pnpm preview
```

说明：

- `pnpm build` 会先执行类型检查，再执行 `vite build`
- `pnpm build-only` 只构建，不做类型检查
- `pnpm lint` 会带 `--fix --cache`，可能自动修改文件
- 单元测试使用 Vitest + jsdom，配置在 `vitest.config.ts`

## 技术架构

| 目录 | 说明 |
|------|------|
| `src/api/` | API 封装 |
| `src/api/types.ts` | 前后端共享类型 |
| `src/router/` | 路由、标题、鉴权和管理员守卫 |
| `src/stores/` | Pinia 状态 |
| `src/components/` | 通用组件 |
| `src/views/` | 页面组件 |
| `src/views/goods-form/` | 谷子表单拆分逻辑 |
| `src/styles/` | 全局样式与 Element Plus 主题覆盖 |
| `src/workers/` | Web Worker |

核心运行时逻辑：

- `src/main.ts`：注册 Pinia、Router、Element Plus、全局图标与 Capacitor 状态栏
- `src/utils/request.ts`：Axios 实例、Token 注入、后端地址优先级、全局错误处理
- `src/router/index.ts`：登录守卫、管理员守卫、页面标题更新

## 前端开发规范

- Vue 组件文件使用 PascalCase，例如 `GoodsCard.vue`
- 业务页面放在 `src/views/`
- 可复用组件放在 `src/components/`
- 新接口先封装到 `src/api/`，再在页面或 store 中调用
- 新接口类型统一补到 `src/api/types.ts`
- 全局状态优先放 Pinia；纯页面局部状态留在组件内
- 组件样式默认使用 `<style scoped>`
- Element Plus 内部样式穿透，新代码优先使用 `:deep()`

### API 对接流程

1. 在 `src/api/types.ts` 增加请求/响应类型
2. 在对应 `src/api/*.ts` 中封装函数
3. 在 store 或页面调用封装函数
4. 在错误场景中区分全局错误和业务错误

常见业务错误：

| 状态码 | 场景 |
|--------|------|
| `401` | 登录失效，前端会清理 Token 并跳登录 |
| `403` | 无权限访问 |
| `409` | 重复谷子等业务冲突，由业务层处理 |
| `429` | 请求过快或后端限流 |

### 后端地址

后端地址由 `src/utils/request.ts` 动态决定，优先级：

1. 设置页保存的 `pickgoods_api_base_url`
2. 旧键 `shigu_api_base_url`
3. `.env` 中的 `VITE_API_BASE_URL`
4. `当前协议://当前主机名:8000`

开发环境的 Vite 代理会将 `/api` 转发到 `http://127.0.0.1:8000`，但生产环境和移动端应明确配置真实后端地址。

## 路由与权限

主要路由：

| 路由 | 权限 | 说明 |
|------|------|------|
| `/login` | 公开 | 登录/注册 |
| `/showcase` | 登录 | 首页、展柜、谷仓、统计看板 |
| `/location` | 登录 | 位置管理 |
| `/ipcharacter` | 登录 | IP 与角色管理 |
| `/category` | 登录 | 品类管理 |
| `/theme` | 登录 | 主题管理 |
| `/goods/new` | 登录 | 新增谷子 |
| `/goods/drafts` | 登录 | 草稿箱 |
| `/goods/:id/edit` | 登录 | 编辑谷子 |
| `/settings` | 公开可进入，登录后显示账号信息 | 设置 |
| `/admin/*` | 登录 + Admin | 管理后台 |

管理员判断逻辑：`authStore.user?.role?.toLowerCase() === 'admin'`。

## 测试指南

当前项目已有 `src/__tests__/App.spec.ts`，使用 Vitest。

```bash
pnpm test:unit
pnpm test:unit --run
pnpm type-check
pnpm build
```

建议测试重点：

- 登录、注册、登出、401 失效跳转
- 云展柜三 Tab 切换
- 谷仓搜索、筛选、分页、排序
- 新增/编辑谷子、草稿、重复检测
- 位置树与位置下谷子
- IP/角色/BGM 导入
- 品类拖拽排序
- 主题图片管理
- 管理员路由与普通用户阻断
- 移动端底部导航、抽屉、安全区

## 后端协作要点

前端假设：

- 列表接口返回 `PaginatedResponse<T>`
- 认证接口返回 `access_token`
- 需要认证的接口接受 `Authorization: Bearer <token>`
- `409` 用于重复/冲突类业务错误
- 图片上传接口接受 `FormData`
- 排序接口使用锚点方式，如 `anchor_id + position`

字段或路径变更时，请同步更新：

- `src/api/*.ts`
- `src/api/types.ts`
- `docs/API.md`

## 产品与设计协作

主题样式集中在：

- `src/styles/variables.css`
- `src/styles/index.css`
- `src/styles/element-plus-theme.css`

页面级布局主要在：

- `src/components/Layout.vue`
- `src/components/MobileBottomNav.vue`
- 各 `src/views/*.vue`

新页面建议沿用现有的香槟金 + 镭射紫视觉体系，并同时检查 PC 与 `max-width: 768px` 移动端断点。

## 当前已实现能力

- 登录、注册、登出、Token 注入
- 路由鉴权和管理员守卫
- 设置页运行时修改后端地址
- 云展柜/公共展柜/我的展柜
- 谷仓搜索、筛选、分页、相似随机视图
- 谷子详情抽屉、编辑、删除、排序
- 谷子新增/编辑、草稿、主图、补充图片、裁剪、原生相机
- 位置管理
- IP 与角色管理、BGM 导入
- 品类管理和拖拽排序
- 主题管理和主题图片
- 统计看板
- 管理后台用户管理和全站谷子管理入口
- 移动端底部导航和安全区适配

## 待完善方向

- 批量移动、批量删除、批量改状态
- 全局搜索或命令面板
- PWA / 离线缓存
- 数据导出与备份
- 资产变动日志
- 更完整的公开分享能力
- 大列表虚拟滚动
- 更系统的组件测试和端到端测试
