# 拾谷 ShiGu｜前端

二次元谷子资产管理系统的前端实现。目标：提供“云展柜式”资产检索体验与收纳管理效率，保证上线后可快速对接后端 API 并支撑后续增量需求。

---

## 1. 你可以快速了解什么？
- **业务场景**：收藏谷子（手办/周边等）的数字化收纳、检索、录入与元数据管理。
- **关键能力**：云展柜检索（多维筛选 + 防抖搜索）、位置树管理、资产录入（含图片裁剪）、IP/角色/品类元数据 CRUD。
- **交互风格**：香槟镭射主题，移动端/桌面端双端适配。
- **上线要求**：首屏加载位置树 + 谷子列表 ≤ 1.5s（内网），429 限流友好提示。

## 2. 环境与运行
- Node.js ≥ 20.19.0 或 ≥ 22.12.0
- pnpm ≥ 9（项目已锁定 packageManager: pnpm@9.0.0）

```bash
pnpm install          # 安装依赖
cp .env.example .env  # 参考示例创建环境变量
# 配置 VITE_API_BASE_URL=http://127.0.0.1:8000
pnpm dev              # 本地启动 http://localhost:5173

pnpm build            # 生产构建
pnpm preview          # 预览生产包
pnpm type-check       # 类型检查
pnpm lint             # ESLint
pnpm test:unit        # 单元测试（Vitest）
```

## 3. 目录速览
```
src/
├── api/          # 接口封装（goods, location, metadata, types）
├── components/   # 公共组件：布局、搜索栏、筛选面板、卡片、详情抽屉
├── stores/       # Pinia：guzi（资产）、location（位置树）
├── styles/       # 主题与全局样式
├── utils/        # request 封装、树形工具
├── views/        # 业务页面：云展柜、位置管理、资产表单、IP/角色/品类管理
└── router/       # 路由入口
```

## 4. 当前能力（前端侧）
- 云展柜 `/showcase`：300ms 防抖搜索，多维筛选（IP/角色/品类/状态/位置），网格/瀑布流展示，详情 Drawer，分页。
- 位置管理 `/location`：树形导航，位置详情、照片、谷子列表，增删改节点。
- 资产录入 `/goods/new` 与 `/goods/:id/edit`：表单校验，IP-角色联动，图片裁剪上传（需配置上传接口），幂等提示。
- 元数据管理：IP、角色、品类列表/搜索/增删改，角色头像上传。
- 设计落地：香槟金主题、镭射动效、圆角规范（卡片 20px，按钮 8px），移动端适配。

## 5. 待办与风险提示
- **真实数据接入**：IP/角色/品类当前含模拟数据，需接通后端 API 后替换。
- **图片上传**：需配置实际上传接口（默认 `/api/upload`），确认鉴权方案。
- **认证与权限**：如需多用户，需补登录/Token/权限控制。
- **数据统计**：资产价值、占比、时间分布等图表未实现。
- **移动端优化**：可进一步增强手势/性能（虚拟滚动）。

## 6. 技术栈与约定
- Vue 3 + TypeScript + Vite；状态管理：Pinia；路由：Vue Router 4
- UI：Element Plus；图标：@element-plus/icons-vue
- HTTP：Axios（`utils/request.ts` 封装，含 429 限流提示）
- 工具：lodash-es（防抖）；图片裁剪：vue-cropper
- Lint/TypeCheck：ESLint + vue-tsc；测试：Vitest

## 7. 配置与环境
- 环境变量：`VITE_API_BASE_URL` 指向后端网关；如有上传/鉴权，新增对应变量。
- 资源：`public/` 放静态资源；主题在 `src/styles/variables.css` 与 `element-plus-theme.css`。

## 8. API 对接（默认约定）
- 谷子：`/api/goods/`（列表/详情/增改删）
- 位置：`/api/location/tree/`、`/api/location/nodes/`
- 元数据：`/api/ips/`、`/api/characters/`、`/api/categories/`
- 上传：`/api/upload`
> 具体以后端 `api.md` 为准，按需在 `src/api/*` 调整。

## 9. 质量与交付检查清单
- ✅ 类型检查、ESLint、单测通过
- ✅ 首屏性能满足 1.5s 目标（内网数据 + 位置树 + 首屏列表）
- ✅ 429 限流有用户友好提示
- ✅ 移动端主要流程可用（检索、详情、录入）
- ✅ 主题与视觉规范符合香槟镭射风

## 10. 角色协作指引
- **前端**：按照 `api/*` 定义对接，关注防抖/限流/幂等逻辑；样式调整看 `styles/`。
- **后端**：提供稳定的 API 与上传接口，返回格式与分页参数保持一致；若限流阈值变化需同步。
- **测试**：覆盖检索、筛选、上传、位置树增删改、异常场景（429、网络错误）；移动端适配。
- **产品/设计**：如需主题或交互调整，集中在样式变量与 Element Plus 主题配置。

## 11. 参考资料
- `QUICKSTART.md`：更详细的启动与常见问题
- `PROJECT_SUMMARY.md`：阶段性总结与建议

## 11. 后端代码
https://github.com/DICKQI/ShiGu_backend

## 13. License
MIT
