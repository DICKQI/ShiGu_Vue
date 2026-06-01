# 设计规范与主题配置

本文档说明当前项目的主题变量、全局样式、Element Plus 覆盖、响应式约定和已知样式注意事项。

## 主题风格

项目采用“香槟金 + 镭射紫 + 明亮灰”的轻量视觉体系。

| 用途 | 变量 | 色值 |
|------|------|------|
| 主色 | `--primary-gold` | `#D4AF37` |
| 主色浅色 | `--primary-gold-light` | `#EACDA3` |
| 主色深色 | `--primary-gold-dark` | `#B8941F` |
| 辅助背景 | `--secondary-gray` | `#F5F5F7` |
| 辅助背景深色 | `--secondary-gray-dark` | `#E5E5E7` |
| 点缀色 | `--accent-purple` | `#A29BFE` |
| 点缀浅色 | `--accent-purple-light` | `#C4B5FD` |
| 点缀深色 | `--accent-purple-dark` | `#9980FA` |

## 样式文件结构

```text
src/styles/
├── variables.css              # CSS 自定义属性
├── index.css                  # 全局重置、滚动条、通用工具类
└── element-plus-theme.css     # Element Plus 全局覆盖
```

`src/main.ts` 导入顺序：

```ts
import './styles/index.css'
import './styles/element-plus-theme.css'
```

`index.css` 内部通过 `@import './variables.css'` 引入变量。

## CSS 变量

### 颜色

| 变量 | 值 | 说明 |
|------|------|------|
| `--bg-white` | `#FFFFFF` | 白色背景 |
| `--bg-gray` | `var(--secondary-gray)` | 页面背景 |
| `--text-dark` | `#333333` | 主要文字 |
| `--text-light` | `#888888` | 次要文字 |
| `--text-lighter` | `#CCCCCC` | 禁用/弱提示 |
| `--border-color` | `rgba(212, 175, 55, 0.3)` | 默认边框 |
| `--border-color-active` | `var(--primary-gold)` | 激活边框 |

### 圆角与阴影

| 变量 | 值 | 说明 |
|------|------|------|
| `--card-radius` | `20px` | 通用卡片圆角 |
| `--button-radius` | `8px` | 按钮/输入框圆角 |
| `--shadow-sm` | `0 2px 10px rgba(0, 0, 0, 0.05)` | 轻阴影 |
| `--shadow-md` | `0 4px 15px rgba(212, 175, 55, 0.15)` | 中等阴影 |
| `--shadow-lg` | `0 8px 20px rgba(212, 175, 55, 0.25)` | 强阴影 |
| `--shadow-purple` | `0 4px 15px rgba(162, 155, 254, 0.5)` | 紫色阴影 |

### 过渡

| 变量 | 值 |
|------|------|
| `--transition-fast` | `0.2s ease` |
| `--transition-normal` | `0.3s ease` |
| `--transition-slow` | `0.5s ease` |

## 全局样式

`src/styles/index.css` 提供：

- 全局 `box-sizing: border-box`
- `html/body/#app` 高度与移动端滚动基础设置
- 全站默认字体族
- 自定义滚动条
- `.card` 通用卡片类
- `.gold-gradient-text` 香槟金渐变文字
- `.laser-gradient` 镭射紫渐变背景
- `.metal-border` 金属边框
- 点击元素的焦点轮廓和移动端 tap highlight 重置

`.laser-gradient` 当前已定义，但源码模板中未明显使用，可按后续需求保留或清理。

## Element Plus 覆盖

`src/styles/element-plus-theme.css` 覆盖了：

| 组件/能力 | 定制点 |
|-----------|--------|
| 全局主色 | `--el-color-primary` 设为香槟金 |
| Primary Button | 实际背景使用 `--accent-purple` |
| Input/Select | 聚焦态使用金色内阴影 |
| Card | 金色半透明边框 |
| Menu/Tabs/Pagination | 激活态使用金色 |
| Drawer | 标题金色加粗 |
| Tree | 当前节点浅金背景 |
| ElMessage | 胶囊型 Toast、毛玻璃、移动端顶部安全区 |

注意：Element Plus 的 primary 变量是金色，但 `.el-button--primary` 被覆盖为紫色按钮，这是当前设计体系的一部分。

## 响应式约定

常用断点：

| 断点 | 用途 |
|------|------|
| `max-width: 768px` | 主要移动端适配 |
| `max-width: 480px` | 小屏手机 |
| `max-width: 900px` | 统计图表筛选折叠 |
| `min-width: 769px` | 桌面端布局 |
| `min-width: 1280px` | 大屏筛选控件布局 |

移动端相关能力：

- 底部导航栏固定定位
- `env(safe-area-inset-top)` / `env(safe-area-inset-bottom)` 安全区适配
- `touch-action: pan-y`
- `-webkit-tap-highlight-color: transparent`

## Scoped CSS 与深度选择器

Vue 组件样式基本使用 `<style scoped>`。

当前项目存在两种深度选择器写法：

- 推荐新代码使用：`:deep(...)`
- 旧/兼容写法：`::deep(...)`

当前源码未发现 `::v-deep`。后续重构时可逐步把 `::deep(...)` 统一为 `:deep(...)`。

## 局部变量体系

部分组件有独立局部变量：

| 组件 | 说明 |
|------|------|
| `ShowcaseManager.vue` | 使用 `--c-*` 与 `--radius-*` 管理展柜内部视觉 |
| `FilterPanel.vue` | 使用 `--filter-control-*` 和状态色变量管理筛选控件 |
| `Login.vue` / `GoodsCard.vue` / `LocationManagement.vue` | 有少量局部颜色变量或硬编码颜色 |

新代码优先复用全局变量，只有组件内部有独立视觉语义时再新增局部变量。

## Z-Index 约定

当前 z-index 分散在组件中，尚未集中变量化。新增浮层时建议参考：

| 范围 | 用途 |
|------|------|
| `0-20` | 局部普通层、装饰层 |
| `50-100` | sticky header、普通固定区域 |
| `999-1000` | 悬浮按钮、底部导航、顶部导航 |
| `2000-3000` | 右键菜单、Dialog、Drawer、裁剪弹窗 |
| `9999` | 全屏水印/预览遮罩 |

## 静态资源

当前仓库存在：

| 目录 | 说明 |
|------|------|
| `public/` | Vite 静态资源，构建时复制到 `dist/` |
| `screenshot/` | 文档截图 |

当前没有 `src/assets/` 目录。如后续需要通过模块系统导入图片、字体或媒体资源，可新增该目录。

## 已知注意事项

1. 全局变量命名与部分组件局部变量命名不完全统一。
2. 断点多数使用 `768px`，个别组件仍有自己的布局阈值。
3. 深度选择器存在 `:deep()` 与 `::deep()` 混用。
4. 暂无深色模式。
5. 字号、间距、z-index 尚未完全变量化。
6. `.laser-gradient` 工具类已定义但当前使用较少。
