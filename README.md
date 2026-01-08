# 拾谷 ShiGu｜前端

二次元谷子资产管理系统的前端实现。目标：提供"云展柜式"资产检索体验与收纳管理效率，保证上线后可快速对接后端 API 并支撑后续增量需求。

---

## 1. 你可以快速了解什么？
- **业务场景**：收藏谷子（手办/周边等）的数字化收纳、检索、录入与元数据管理。
- **关键能力**：云展柜检索（多维筛选 + 防抖搜索）、位置树管理、资产录入（含图片上传）、IP作品与角色统一管理、品类管理、右键快捷操作。
- **交互风格**：香槟镭射主题，移动端/桌面端双端适配，PC 端表格展示，移动端卡片展示。
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
├── api/          # 接口封装
│   ├── goods.ts       # 谷子相关接口
│   ├── location.ts    # 位置相关接口
│   ├── metadata.ts    # 元数据接口（IP、角色、品类）
│   └── types.ts       # TypeScript 类型定义
├── components/   # 公共组件
│   ├── Layout.vue          # 主布局（导航栏、路由视图）
│   ├── SearchBar.vue       # 搜索栏组件（防抖处理）
│   ├── FilterPanel.vue     # 筛选面板组件（多维筛选）
│   ├── GoodsCard.vue       # 谷子卡片组件
│   └── GoodsDrawer.vue     # 详情抽屉组件（图片画廊、详细信息）
├── stores/       # Pinia 状态管理
│   ├── guzi.ts      # 谷子数据管理（搜索、筛选、分页）
│   └── location.ts  # 位置树数据管理
├── styles/       # 主题与全局样式
│   ├── variables.css           # 主题变量定义
│   ├── element-plus-theme.css  # Element Plus 主题定制
│   └── index.css              # 全局样式重置
├── utils/        # 工具函数
│   ├── request.ts  # Axios 封装（错误处理、限流处理）
│   └── tree.ts     # 树结构转换工具
├── views/        # 业务页面
│   ├── CloudShowcase.vue         # 云展柜（检索页）
│   ├── LocationManagement.vue    # 位置管理
│   ├── GoodsForm.vue             # 资产录入/编辑表单
│   ├── IPCharacterManagement.vue # IP作品与角色管理
│   └── CategoryManagement.vue    # 品类管理
└── router/       # 路由配置
    └── index.ts  # 路由入口（包含兼容性重定向）
```

## 4. 当前能力（前端侧）

### 核心功能页面

#### 云展柜 `/showcase`
- ✅ 300ms 防抖搜索，多维筛选（IP/角色/品类/状态/位置）
- ✅ 网格/瀑布流展示，响应式布局（PC/移动端自适应）
- ✅ 详情 Drawer 展示完整信息和图片画廊
- ✅ 分页功能（固定在底部，毛玻璃效果）
- ✅ 右键菜单快捷操作（编辑、删除）
- ✅ 位置路径点击跳转至位置管理页

#### 位置管理 `/location`
- ✅ 树形导航，支持展开/折叠
- ✅ 位置详情展示（名称、描述、照片）
- ✅ 该位置下的谷子列表
- ✅ 位置节点增删改操作

#### 资产录入 `/goods/new` 与 `/goods/:id/edit`
- ✅ 完整表单校验
- ✅ IP-角色联动选择（支持多角色关联）
- ✅ 主图上传功能（已对接 `/api/goods/{id}/upload-main-photo/`）
- ✅ 补充图片管理（UI 已实现）
- ✅ 幂等性友好提示（409 冲突检测）

#### IP作品与角色管理 `/ipcharacter`
- ✅ IP 作品列表展示（PC 端表格，移动端卡片）
- ✅ IP 下角色展开/折叠查看
- ✅ IP 关键词管理（别名/缩写）
- ✅ 角色头像上传功能
- ✅ IP 与角色增删改操作
- ✅ 搜索功能（按 IP 名称或关键词）
- ✅ 兼容旧路由：`/ip` 和 `/character` 自动重定向到 `/ipcharacter`

#### 品类管理 `/category`
- ✅ 品类列表展示（表格形式）
- ✅ 品类搜索功能
- ✅ 品类增删改操作

### 设计落地
- ✅ 香槟金主题（#D4AF37）、镭射动效、圆角规范（卡片 20px，按钮 8px）
- ✅ 移动端完整适配（响应式导航栏、折叠菜单、卡片式布局）
- ✅ PC 端表格展示，移动端卡片展示
- ✅ 固定分页器（毛玻璃效果，悬浮在底部）

## 5. 待办与风险提示

### 已完成 ✅
- ✅ **真实数据接入**：前端已按照 `/api/ips/`、`/api/characters/`、`/api/categories/`、`/api/goods/`、`/api/location/` 等接口对接
- ✅ **图片上传**：主图上传功能已实现（`/api/goods/{id}/upload-main-photo/`），角色头像上传已实现
- ✅ **IP 与角色管理**：已合并到统一页面，支持展开/折叠查看角色列表
- ✅ **品类管理**：独立页面，支持完整 CRUD 操作
- ✅ **右键快捷操作**：云展柜页面支持右键菜单编辑/删除
- ✅ **移动端适配**：响应式导航栏、折叠菜单、卡片式布局已完善

### 待完善 🔄
- **认证与权限**：如需多用户，需补登录/Token/权限控制
- **数据统计**：资产价值、占比、时间分布等图表未实现
- **补充图片上传**：补充图片的上传功能需进一步完善
- **性能优化**：大量数据时可考虑虚拟滚动优化
- **图片裁剪**：图片上传前裁剪功能（目前使用直接上传）

## 6. 技术栈与约定
- Vue 3 + TypeScript + Vite；状态管理：Pinia；路由：Vue Router 4
- UI：Element Plus；图标：@element-plus/icons-vue
- HTTP：Axios（`utils/request.ts` 封装，含 429 限流提示）
- 工具：lodash-es（防抖）；图片裁剪：vue-cropper
- Lint/TypeCheck：ESLint + vue-tsc；测试：Vitest

## 7. 配置与环境
- 环境变量：`VITE_API_BASE_URL` 指向后端网关；如有上传/鉴权，新增对应变量。
- 资源：`public/` 放静态资源；主题在 `src/styles/variables.css` 与 `element-plus-theme.css`。

## 8. API 对接（已实现）

### 谷子相关
- `GET /api/goods/` - 列表查询（支持分页、筛选、搜索）
- `GET /api/goods/{id}/` - 详情查询
- `POST /api/goods/` - 创建谷子
- `PUT /api/goods/{id}/` - 更新谷子
- `DELETE /api/goods/{id}/` - 删除谷子
- `POST /api/goods/{id}/upload-main-photo/` - 上传/更新主图

### 位置相关
- `GET /api/location/tree/` - 获取位置树
- `GET /api/location/nodes/` - 获取位置节点列表
- `GET /api/location/{id}/` - 获取位置详情
- `POST /api/location/nodes/` - 创建位置节点
- `PUT /api/location/nodes/{id}/` - 更新位置节点
- `DELETE /api/location/nodes/{id}/` - 删除位置节点

### 元数据相关
- **IP 作品**：`GET/POST/PUT/DELETE /api/ips/`
- **角色**：`GET/POST/PUT/DELETE /api/characters/`
  - `GET /api/ips/{id}/characters/` - 获取 IP 下的角色列表
- **品类**：`GET/POST/PUT/DELETE /api/categories/`

> 具体以后端 `api.md` 为准，按需在 `src/api/*` 调整。

## 9. 质量与交付检查清单

### 功能完整性 ✅
- ✅ 云展柜检索与筛选功能完整
- ✅ 位置树管理功能完整
- ✅ 资产录入与编辑功能完整
- ✅ IP作品与角色管理功能完整
- ✅ 品类管理功能完整
- ✅ 图片上传功能已实现（主图、角色头像）

### 技术质量 ✅
- ✅ 类型检查、ESLint、单测通过
- ✅ API 接口封装完整（`src/api/*`）
- ✅ 状态管理完善（Pinia stores）
- ✅ 组件化设计合理（可复用组件）

### 用户体验 ✅
- ✅ 首屏性能满足 1.5s 目标（内网数据 + 位置树 + 首屏列表）
- ✅ 429 限流有用户友好提示
- ✅ 移动端主要流程可用（检索、详情、录入、管理）
- ✅ 主题与视觉规范符合香槟镭射风
- ✅ 响应式设计完善（PC/移动端双端适配）
- ✅ 交互细节优化（防抖、加载状态、错误提示）

## 10. 角色协作指引

### 前端开发者
- 按照 `src/api/*` 定义对接后端接口
- 关注防抖/限流/幂等逻辑（已实现搜索防抖、429 处理）
- 样式调整集中在 `src/styles/` 目录
- 新增功能时注意移动端适配（使用响应式设计）
- 类型定义统一在 `src/api/types.ts` 中维护

### 后端开发者
- 提供稳定的 API 接口，返回格式与分页参数保持一致
- 图片上传接口：`/api/goods/{id}/upload-main-photo/` 已对接
- 若限流阈值变化需同步前端（目前默认 60次/分钟）
- 注意字段变更时同步更新前端 `src/api/types.ts`

### 测试人员
- 覆盖核心流程：检索、筛选、上传、位置树增删改、IP/角色/品类管理
- 异常场景：429 限流、网络错误、数据冲突（409）
- 移动端适配测试：不同屏幕尺寸下的交互体验
- 边界情况：空数据、大量数据、特殊字符输入

### 产品/设计
- 主题调整：集中在 `src/styles/variables.css` 与 `element-plus-theme.css`
- 交互调整：可在组件中直接修改（组件化设计便于调整）
- 如需新增页面，参考现有页面的布局和交互模式

## 11. 项目亮点

### 架构设计
- **模块化 API 封装**：按业务模块组织（`goods.ts`、`location.ts`、`metadata.ts`）
- **统一状态管理**：使用 Pinia 管理全局状态（谷子列表、位置树）
- **类型安全**：完整的 TypeScript 类型定义，提升开发体验和代码质量

### 用户体验优化
- **智能搜索**：300ms 防抖，避免频繁请求触发限流
- **响应式设计**：PC 端表格展示，移动端卡片展示，自动适配
- **快捷操作**：右键菜单、悬浮按钮，提升操作效率
- **友好提示**：429 限流、409 冲突、网络错误等场景的用户友好提示

### 交互细节
- **展开/折叠**：IP 作品下角色列表懒加载，提升性能
- **固定分页器**：底部固定，毛玻璃效果，不遮挡内容
- **联动选择**：IP-角色联动，避免选择无效组合

## 12. 参考资料
- `QUICKSTART.md`：更详细的启动与常见问题
- `PROJECT_SUMMARY.md`：阶段性总结与建议

## 13. 后端代码
`ShiGu_backend` 仓库（Django REST 后端，包含 `api.md` 接口说明）：`https://github.com/DICKQI/ShiGu_backend`

## 14. License
MIT
