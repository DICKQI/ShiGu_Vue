# API 接口文档

本文档以当前前端封装为准，覆盖 `src/api/*.ts`、`src/api/types.ts` 与 `src/utils/request.ts` 中实际使用的接口、请求体和运行时配置。

## 请求封装

HTTP 客户端位于 `src/utils/request.ts`，基于 Axios。

### 基础配置

- 默认超时：`10000ms`
- 默认请求头：`Content-Type: application/json`
- `FormData` 请求会自动移除 `Content-Type`，交给浏览器生成 multipart boundary
- 已登录时会自动注入 `Authorization: Bearer <token>`
- Token 存储键：`pickgoods_access_token`

### 后端地址优先级

每次请求前都会重新计算 `baseURL`：

1. `localStorage.pickgoods_api_base_url`
2. 兼容旧键 `localStorage.shigu_api_base_url`
3. `import.meta.env.VITE_API_BASE_URL`
4. `当前页面协议://当前页面主机名:8000`

设置页使用以下工具函数：

| 函数 | 说明 |
|------|------|
| `updateBaseURL(url)` | 校验并保存运行时后端地址 |
| `getCurrentBaseURL()` | 获取当前生效地址 |
| `resetBaseURL()` | 清理本地配置并恢复默认地址 |

## 响应与错误处理

### 分页响应

当前类型定义为：

```ts
interface PaginatedResponse<T> {
  count: number
  page: number
  page_size: number
  next: number | null
  previous: number | null
  results: T[]
}
```

### 全局错误处理

| 状态码 | 前端处理 |
|--------|----------|
| `401` | 清除本地 Token，并跳转登录页，附带 `redirect` |
| `403` | 弹出“无权限访问” |
| `409` | 不弹全局错误，交由业务层处理重复/冲突场景 |
| `429` | 弹出“搜索太快了，请稍后再试” |
| 其他错误 | 优先显示 `response.data.detail`，否则显示 Axios 错误信息 |

## 身份认证（Auth）

封装文件：`src/api/auth.ts`

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/auth/register/` | 注册并返回 Token |
| `POST` | `/api/auth/login/` | 登录并返回 Token |
| `GET` | `/api/auth/me/` | 获取当前用户信息 |
| `DELETE` | `/api/auth/logout/` | 登出；前端无论接口是否成功都会清理本地登录状态 |

### 登录/注册请求

```ts
{
  username: string
  password: string
}
```

### Token 响应

```ts
{
  access_token: string
  token_type: string
  expires_in: number
}
```

### 当前用户

```ts
{
  id: number
  username: string
  role: 'User' | 'Admin' | string
}
```

## 谷子（Goods）

封装文件：`src/api/goods.ts`

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/goods/` | 谷子列表，支持分页、搜索、筛选 |
| `GET` | `/api/goods/similar-random/` | 相似随机视图列表 |
| `GET` | `/api/goods/stats/` | 统计看板数据 |
| `GET` | `/api/goods/{id}/` | 谷子详情 |
| `POST` | `/api/goods/` | 创建谷子 |
| `PUT` | `/api/goods/{id}/` | 更新谷子 |
| `DELETE` | `/api/goods/{id}/` | 删除谷子 |
| `POST` | `/api/goods/{id}/upload-main-photo/` | 上传或更新主图 |
| `POST` | `/api/goods/{id}/upload-additional-photos/` | 上传补充图片，或用 `photo_ids + label` 更新标签 |
| `DELETE` | `/api/goods/{id}/additional-photos/{photoId}/` | 删除单张补充图片 |
| `DELETE` | `/api/goods/{id}/additional-photos/` | 批量删除补充图片，查询参数 `photo_ids=1,2` |
| `POST` | `/api/goods/{id}/move/` | 以锚点方式移动排序 |

### 列表查询参数

| 参数 | 说明 |
|------|------|
| `ip` | IP 作品 ID |
| `character` | 单角色 ID |
| `characters__in` | 多角色过滤，如 `5,6` |
| `category` | 品类 ID |
| `theme` | 主题 ID |
| `status` | 单状态：`draft`、`in_cabinet`、`outdoor`、`sold` |
| `status__in` | 多状态过滤，如 `in_cabinet,sold` |
| `is_official` | `true` 只看官谷，`false` 只看非官谷 |
| `location` | 位置 ID |
| `search` | 搜索关键词 |
| `group_by` | 分组显示：`ip`、`character`、`category`、`theme` |
| `page` | 页码 |
| `page_size` | 每页数量 |

管理后台的谷子管理页还会透传 `user` 查询参数，用于后端支持全站数据按用户筛选的场景。

### 创建/更新请求

```ts
interface GoodsInput {
  name?: string
  ip_id?: number
  character_ids?: number[]
  category_id?: number
  theme_id?: number | null
  status?: 'draft' | 'in_cabinet' | 'outdoor' | 'sold'
  location?: number | null
  quantity?: number
  price?: string | null
  purchase_date?: string | null
  is_official?: boolean
  notes?: string | null
  merge_strategy?: 'auto' | 'new' | 'merge'
  merge_target_id?: string
}
```

创建接口可能返回：

- `201`：新建成功
- `200` 且 `merged: true`：合并成功
- `409`：检测到重复谷子，业务层弹出候选项确认

### 补充图片标签更新

前端复用上传接口进行标签更新：

```ts
POST /api/goods/{id}/upload-additional-photos/
FormData:
  photo_ids = 1
  photo_ids = 2
  label = "标签"
```

### 排序请求

```ts
POST /api/goods/{id}/move/

{
  anchor_id: string
  position: 'before' | 'after'
}
```

### 统计接口参数

统计接口复用部分列表筛选参数，并额外支持：

| 参数 | 说明 |
|------|------|
| `top` | Top N 数量，当前前端滑块范围为 3-30 |
| `group_by` | API 类型预留的时间粒度：`month`、`week`、`day` |
| `purchase_start` / `purchase_end` | 入手日期区间，格式 `YYYY-MM-DD` |
| `created_start` / `created_end` | 录入日期区间，格式 `YYYY-MM-DD` |

当前统计页面展示概览、状态分布、官谷/同人、作品类型、IP TopN、品类 TopN；类型中也保留了趋势数据结构。

## 位置（Location）

封装文件：`src/api/location.ts`

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/location/tree/` | 获取位置树数据 |
| `GET` | `/api/location/nodes/` | 获取位置节点列表 |
| `GET` | `/api/location/nodes/{id}/` | 获取位置节点详情 |
| `POST` | `/api/location/nodes/` | 创建位置节点 |
| `PUT` | `/api/location/nodes/{id}/` | 完整更新位置节点 |
| `PATCH` | `/api/location/nodes/{id}/` | 部分更新位置节点 |
| `DELETE` | `/api/location/nodes/{id}/` | 删除位置节点 |
| `GET` | `/api/location/nodes/{id}/goods/` | 获取指定位置下谷子 |

位置下谷子查询参数：

| 参数 | 说明 |
|------|------|
| `include_children` | 是否包含子位置 |
| `page` | 页码 |

## 元数据（Metadata）

封装文件：`src/api/metadata.ts`

### IP 作品

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/ips/` | IP 列表，支持 `name`、`search`、`subject_type`、`subject_type__in` |
| `POST` | `/api/ips/` | 创建 IP |
| `GET` | `/api/ips/{id}/` | IP 详情 |
| `PUT` | `/api/ips/{id}/` | 完整更新 IP |
| `PATCH` | `/api/ips/{id}/` | 部分更新 IP |
| `DELETE` | `/api/ips/{id}/` | 删除 IP |
| `GET` | `/api/ips/{id}/characters/` | 获取该 IP 下角色 |
| `POST` | `/api/ips/batch-update-order/` | 批量更新 IP 排序 |

IP 创建/更新字段：

```ts
{
  name: string
  keywords?: string[]
  subject_type?: number | null
}
```

### 角色

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/characters/` | 角色列表，支持 `ip`、`name`、`search` |
| `POST` | `/api/characters/` | 创建角色，支持 JSON 或 FormData |
| `GET` | `/api/characters/{id}/` | 角色详情 |
| `PUT` | `/api/characters/{id}/` | 完整更新角色 |
| `PATCH` | `/api/characters/{id}/` | 部分更新角色 |
| `DELETE` | `/api/characters/{id}/` | 删除角色 |

角色字段：

```ts
{
  name: string
  ip_id: number
  avatar?: string | null
  gender?: 'male' | 'female' | 'other'
}
```

### 品类

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/categories/` | 品类列表，支持 `name`、`search`、`parent`、`parent__isnull` |
| `GET` | `/api/categories/tree/` | 品类树数据，前端用于组装树形选择 |
| `POST` | `/api/categories/` | 创建品类 |
| `GET` | `/api/categories/{id}/` | 品类详情 |
| `PUT` | `/api/categories/{id}/` | 完整更新品类 |
| `PATCH` | `/api/categories/{id}/` | 部分更新品类 |
| `DELETE` | `/api/categories/{id}/` | 删除品类 |
| `POST` | `/api/categories/batch-update-order/` | 批量更新品类排序 |

品类字段：

```ts
{
  name: string
  parent?: number | null
  color_tag?: string | null
  order?: number
}
```

排序请求：

```ts
{
  items: Array<{
    id: number
    order: number
  }>
}
```

### 主题

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/themes/` | 主题列表，支持 `name`、`search` |
| `GET` | `/api/themes/{id}/` | 主题详情 |
| `POST` | `/api/themes/` | 创建主题 |
| `PUT` | `/api/themes/{id}/` | 完整更新主题 |
| `PATCH` | `/api/themes/{id}/` | 部分更新主题 |
| `DELETE` | `/api/themes/{id}/` | 删除主题 |
| `POST` | `/api/themes/{id}/upload-images/` | 上传主题图片，或用 `photo_ids + label` 更新标签 |
| `DELETE` | `/api/themes/{themeId}/images/{photoId}/` | 删除单张主题图片 |
| `DELETE` | `/api/themes/{themeId}/images/` | 批量删除主题图片，查询参数 `photo_ids=1,2` |

主题字段：

```ts
{
  name: string
  description?: string | null
}
```

## Bangumi 导入（BGM）

封装文件：`src/api/metadata.ts`

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/bgm/search-subjects/` | 搜索 Bangumi 作品列表 |
| `POST` | `/api/bgm/get-characters-by-id/` | 根据 Bangumi 作品 ID 获取角色 |
| `POST` | `/api/bgm/search-characters/` | 兼容的一步搜索：按作品名获取角色 |
| `POST` | `/api/bgm/create-characters/` | 批量创建 IP 和角色 |

### 搜索作品

```ts
{
  keyword: string
  subject_type?: number
}
```

### 根据作品 ID 获取角色

```ts
{
  subject_id: number
}
```

### 一步搜索角色

```ts
{
  ip_name: string
  subject_type?: number
}
```

### 批量创建

```ts
{
  characters: Array<{
    ip_name: string
    character_name: string
    subject_type?: number | null
    avatar?: string | null
  }>
}
```

`subject_type` 常用值：`1=书籍`、`2=动画`、`3=音乐`、`4=游戏`、`6=三次元/特摄`。

## 展柜（Showcase）

封装文件：`src/api/showcase.ts`

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/showcases/` | 展柜列表 |
| `GET` | `/api/showcases/public/` | 公共展柜列表 |
| `GET` | `/api/showcases/private/` | 我的展柜列表 |
| `GET` | `/api/showcases/{id}/` | 展柜详情 |
| `POST` | `/api/showcases/` | 创建展柜，支持 JSON 或 FormData |
| `PATCH` | `/api/showcases/{id}/` | 更新展柜 |
| `DELETE` | `/api/showcases/{id}/` | 删除展柜 |
| `POST` | `/api/showcases/{id}/upload-cover-image/` | 上传/更新展柜封面 |
| `GET` | `/api/showcases/{id}/goods/` | 获取展柜内谷子 |
| `POST` | `/api/showcases/{id}/add-goods/` | 添加谷子到展柜 |
| `POST` | `/api/showcases/{id}/remove-goods/` | 从展柜移除谷子 |
| `POST` | `/api/showcases/{id}/move-goods/` | 移动展柜内谷子排序 |

展柜创建/更新字段：

```ts
{
  name: string
  description?: string | null
  is_public?: boolean
}
```

当前前端在添加谷子到展柜时不再传递 `category_id`，展柜详情页只展示单一收纳物品列表。

添加谷子：

```ts
{
  goods_id: string
  notes?: string
}
```

移除谷子：

```ts
{
  goods_id: string
}
```

移动展柜谷子：

```ts
{
  goods_id: string
  anchor_goods_id: string
  position: 'before' | 'after'
  category_id?: string
}
```

## 管理后台（Admin）

封装文件：`src/api/admin.ts`

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/admin/users/` | 用户分页列表，支持 `page`、`page_size` |
| `GET` | `/api/admin/users/{id}/` | 用户详情 |
| `POST` | `/api/admin/users/` | 创建用户 |
| `PATCH` | `/api/admin/users/{id}/` | 更新用户角色、状态或密码 |
| `GET` | `/api/admin/roles/` | 角色列表 |

创建用户：

```ts
{
  username: string
  password: string
  role_id: number
}
```

更新用户：

```ts
{
  role_id?: number
  is_active?: boolean
  password?: string
}
```

管理员路由由前端路由守卫根据 `user.role === 'Admin'` 控制；后端仍需进行权限校验。

## 主要类型位置

所有共享 API 类型集中在 `src/api/types.ts`：

| 类型 | 说明 |
|------|------|
| `AuthTokenResponse`、`UserInfo` | 认证和当前用户 |
| `GoodsListItem`、`GoodsDetail`、`GoodsInput` | 谷子列表、详情和提交字段 |
| `GoodsStatsResponse` | 统计看板响应 |
| `StorageNode` | 位置节点 |
| `IP`、`Character`、`Category`、`Theme` | 公共元数据 |
| `Showcase`、`ShowcaseGoods` | 展柜 |
| `AdminUser`、`AdminRole` | 管理后台 |
| `PaginatedResponse<T>` | 分页响应 |
| `BGM*` | Bangumi 搜索与导入 |
