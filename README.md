# 拾谷 ShiGu - 前端项目

二次元谷子资产管理系统前端，基于 Vue 3 + TypeScript + Element Plus 构建。

## 项目特色

- 🎨 **香槟镭射风格**：独特的视觉设计，体现"金属质感"与"数字化橱窗"的视觉体验
- ⚡ **高性能检索**：毫秒级筛选定位谷子，支持防抖搜索
- 📱 **响应式设计**：完美适配移动端和桌面端
- 🎯 **多维筛选**：IP、角色、品类、状态、位置等多维度筛选
- 📍 **位置管理**：树状结构管理物理收纳空间
- 🖼️ **图片裁剪上传**：支持图片裁剪和上传功能
- 📊 **元数据管理**：完整的IP作品、角色、品类管理功能

## 技术栈

- **框架**：Vue 3 (Composition API)
- **状态管理**：Pinia
- **路由**：Vue Router 4
- **UI 组件库**：Element Plus
- **HTTP 客户端**：Axios
- **构建工具**：Vite
- **语言**：TypeScript
- **图片处理**：vue-cropper
- **工具库**：lodash-es

## 项目结构

```
src/
├── api/              # API 接口封装
│   ├── goods.ts      # 谷子相关接口
│   ├── location.ts   # 位置相关接口
│   ├── metadata.ts   # 元数据接口（IP、角色、品类）
│   └── types.ts      # TypeScript 类型定义
├── components/       # 公共组件
│   ├── Layout.vue           # 布局组件
│   ├── SearchBar.vue        # 搜索栏
│   ├── FilterPanel.vue      # 筛选面板
│   ├── GoodsCard.vue        # 谷子卡片
│   └── GoodsDrawer.vue      # 详情抽屉
├── stores/           # Pinia 状态管理
│   ├── location.ts   # 位置状态
│   └── guzi.ts       # 谷子状态
├── styles/           # 样式文件
│   ├── variables.css         # CSS 变量
│   ├── index.css            # 全局样式
│   └── element-plus-theme.css # Element Plus 主题定制
├── utils/            # 工具函数
│   ├── request.ts    # Axios 封装
│   └── tree.ts       # 树结构工具
├── views/            # 页面组件
│   ├── CloudShowcase.vue         # 云展柜（核心检索页）
│   ├── LocationManagement.vue    # 位置管理
│   ├── GoodsForm.vue              # 资产录入/编辑
│   ├── IPManagement.vue          # IP作品管理
│   ├── CharacterManagement.vue   # 角色管理
│   └── CategoryManagement.vue    # 品类管理
└── router/           # 路由配置
    └── index.ts
```

## 快速开始

### 环境要求

- Node.js >= 20.19.0 或 >= 22.12.0
- pnpm >= 9.0.0 (推荐使用 pnpm 进行包管理)

> 如果还没有安装 pnpm，可以通过以下方式安装：
> ```bash
> npm install -g pnpm
> # 或使用其他方式：https://pnpm.io/installation
> ```

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

创建 `.env` 文件（参考 `.env.example`）：

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### 启动开发服务器

```bash
pnpm dev
```

访问 `http://localhost:5173`

### 构建生产版本

```bash
pnpm build
```

### 类型检查

```bash
pnpm type-check
```

### 代码检查

```bash
pnpm lint
```

## 核心功能

### 1. 云展柜（快速检索页）

- 全局搜索栏（300ms 防抖）
- 多维筛选（IP、角色、品类、状态、位置）
- 瀑布流/网格列表展示
- 详情侧滑窗（Drawer）
- 分页支持

### 2. 位置管理

- 树形导航展示收纳位置
- 位置详情展示（照片、备注、该位置下的谷子）
- 新增/编辑/删除位置节点

### 3. 资产录入/编辑

- 完整的表单录入
- IP 与角色联动选择
- 图片裁剪上传（支持 vue-cropper）
- 幂等性友好提示
- 表单验证

### 4. IP作品管理

- IP作品列表展示
- 搜索功能
- 新增/编辑/删除IP作品
- 关键词管理

### 5. 角色管理

- 角色列表展示
- 按IP筛选角色
- 搜索功能
- 新增/编辑/删除角色
- 角色头像上传

### 6. 品类管理

- 品类列表展示
- 搜索功能
- 新增/编辑/删除品类

## 设计规范

### 颜色系统

- **主色（香槟金）**：`#D4AF37` - 用于边框、图标高亮、重要标题
- **辅助色（明亮灰）**：`#F5F5F7` - 用于卡片背景、输入框底色
- **点缀色（镭射紫）**：`#A29BFE` - 用于主要按钮、加载条、幻彩渐变效果
- **背景色**：`#FFFFFF` - 纯白背景

### UI 特色

- 卡片使用 1px 香槟金细边框
- 交互元素悬浮时增加微弱的镭射渐变动效
- 圆角：卡片 20px，按钮 8px

## API 对接

项目已配置好与后端 API 的对接：

### 谷子相关
- 谷子列表：`GET /api/goods/`
- 谷子详情：`GET /api/goods/{id}/`
- 创建谷子：`POST /api/goods/`
- 更新谷子：`PUT /api/goods/{id}/`
- 删除谷子：`DELETE /api/goods/{id}/`

### 位置相关
- 位置树：`GET /api/location/tree/`
- 位置节点：`GET /api/location/nodes/`
- 创建位置：`POST /api/location/nodes/`
- 更新位置：`PUT /api/location/nodes/{id}/`
- 删除位置：`DELETE /api/location/nodes/{id}/`

### IP作品相关
- IP列表：`GET /api/ips/`
- IP详情：`GET /api/ips/{id}/`
- 创建IP：`POST /api/ips/`
- 更新IP：`PUT /api/ips/{id}/`
- 删除IP：`DELETE /api/ips/{id}/`

### 角色相关
- 角色列表：`GET /api/characters/`
- 角色详情：`GET /api/characters/{id}/`
- 创建角色：`POST /api/characters/`
- 更新角色：`PUT /api/characters/{id}/`
- 删除角色：`DELETE /api/characters/{id}/`

### 品类相关
- 品类列表：`GET /api/categories/`
- 品类详情：`GET /api/categories/{id}/`
- 创建品类：`POST /api/categories/`
- 更新品类：`PUT /api/categories/{id}/`
- 删除品类：`DELETE /api/categories/{id}/`

### 文件上传
- 图片上传：`POST /api/upload`

详细 API 文档请参考后端项目的 `api.md`。

## 路由配置

- `/showcase` - 云展柜（快速检索页）
- `/location` - 位置管理
- `/ip` - IP作品管理
- `/character` - 角色管理
- `/category` - 品类管理
- `/goods/new` - 新增谷子
- `/goods/:id/edit` - 编辑谷子

## 注意事项

1. **搜索防抖**：搜索框已实现 300ms 防抖，避免触发后端限流（60次/分）
2. **限流处理**：当后端返回 429 状态码时，前端会显示友好提示
3. **幂等性**：录入谷子时，如果检测到相同资产已存在，会显示提示信息
4. **移动端适配**：所有页面均已适配移动端浏览器
5. **图片上传**：图片上传功能需要配置实际的上传接口地址（默认：`/api/upload`）
6. **元数据管理**：IP、角色、品类等元数据已从后端 API 获取，支持完整的 CRUD 操作

## 开发建议

1. **图片上传**：确保后端已配置图片上传接口，并设置正确的上传地址
2. **主题定制**：可以根据实际需求调整 Element Plus 主题色
3. **调试工具**：建议使用 Vue DevTools 进行调试
4. **类型安全**：项目使用 TypeScript，建议充分利用类型检查功能
5. **代码规范**：使用 ESLint 进行代码检查，运行 `pnpm lint` 自动修复问题

## 测试

运行单元测试：

```bash
pnpm test:unit
```

## 预览生产构建

构建完成后，可以预览生产版本：

```bash
pnpm preview
```

## License

MIT
