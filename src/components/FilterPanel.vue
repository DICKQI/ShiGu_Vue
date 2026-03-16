<template>
  <div class="filter-panel">
    <el-card
      class="filter-card"
      :class="{ 'filter-card--collapsed': collapsed }"
      :body-style="cardBodyStyle"
    >
      <template #header>
        <div class="filter-header">
          <span>筛选谷子</span>
          <div class="filter-actions">
            <!-- 视图模式切换 - 滑块样式 -->
            <div class="view-mode-toggle">
              <div class="toggle-slider" :class="{ 'is-similar': guziStore.viewMode === 'similar' }">
                <div class="slider-bg"></div>
                <button
                  class="toggle-option"
                  :class="{ active: guziStore.viewMode === 'standard' }"
                  :disabled="!!localFilters.group_by"
                  @click="handleViewModeChange('standard')"
                >
                  <el-icon><List /></el-icon>
                  <span>标准</span>
                </button>
                <button
                  class="toggle-option"
                  :class="{ active: guziStore.viewMode === 'similar' }"
                  :disabled="!!localFilters.group_by"
                  @click="handleViewModeChange('similar')"
                >
                  <el-icon><MagicStick /></el-icon>
                  <span>相似</span>
                </button>
              </div>
            </div>
            <!-- 重置按钮改为图标形式 -->
            <el-button
              text
              class="icon-btn reset-btn"
              @click="handleReset"
              title="重置筛选"
            >
              <el-icon>
                <RefreshLeft />
              </el-icon>
            </el-button>
            <el-button
              text
              class="toggle-btn"
              @click="toggleCollapsed"
              :title="collapsed ? '展开筛选' : '收起筛选'"
            >
              <el-icon :class="['toggle-icon', { expanded: !collapsed }]">
                <ArrowDown />
              </el-icon>
            </el-button>
          </div>
        </div>
      </template>

      <!-- 展开/收起动画 -->
      <transition name="filter-collapse">
        <div
          v-show="!collapsed"
          class="filter-collapse-wrapper"
        >
          <div class="filter-content">
            <!-- IP筛选 -->
            <div class="filter-item">
          <label>IP作品</label>
          <el-select
            v-model="localFilters.ip"
            placeholder="选择IP"
            clearable
            @change="handleFilterChange"
            style="width: 100%"
          >
            <el-option
              v-for="ip in ipOptions"
              :key="ip.id"
              :label="ip.name"
              :value="ip.id"
            />
          </el-select>
        </div>

            <!-- 角色筛选（联动，支持文字搜索） -->
            <div class="filter-item">
          <label>角色</label>
          <el-select
            v-model="localFilters.character"
            placeholder="选择角色"
            clearable
            filterable
            :disabled="!localFilters.ip"
            @change="handleFilterChange"
            style="width: 100%"
          >
            <el-option
              v-for="char in filteredCharacters"
              :key="char.id"
              :label="char.name"
              :value="char.id"
            />
          </el-select>
        </div>

            <!-- 品类筛选（支持多层级树形选择） -->
            <div class="filter-item">
              <label>品类</label>
              <el-tree-select
                v-model="localFilters.category"
                :data="categoryTreeData"
                placeholder="选择品类"
                clearable
                @change="handleFilterChange"
                style="width: 100%"
                :props="{ label: 'label', value: 'id' }"
                check-strictly
              />
            </div>

            <!-- 主题筛选 -->
            <div class="filter-item">
              <label>主题</label>
              <el-select
                v-model="localFilters.theme"
                placeholder="选择主题"
                clearable
                filterable
                @change="handleFilterChange"
                style="width: 100%"
              >
                <el-option
                  v-for="theme in themeOptions"
                  :key="theme.id"
                  :label="theme.name"
                  :value="theme.id"
                />
              </el-select>
            </div>

            <!-- 状态筛选（支持多选） -->
            <div class="filter-item filter-item--status">
          <label>状态</label>
          <el-checkbox-group
            v-model="selectedStatuses"
            class="status-group"
            @change="handleStatusChange"
          >
            <el-checkbox-button class="status-chip status-chip--in-cabinet" label="in_cabinet">在馆</el-checkbox-button>
            <el-checkbox-button class="status-chip status-chip--outdoor" label="outdoor">出街中</el-checkbox-button>
            <el-checkbox-button class="status-chip status-chip--sold" label="sold">已售出</el-checkbox-button>
          </el-checkbox-group>
        </div>

            <!-- 是否官谷筛选（三态：全部/官谷/同人） -->
            <div class="filter-item filter-item--official">
              <label>是否官谷</label>
              <el-select
                v-model="localFilters.is_official"
                placeholder="全部"
                clearable
                @change="handleFilterChange"
                style="width: 100%"
              >
                <el-option label="官谷" :value="true" />
                <el-option label="同人" :value="false" />
              </el-select>
            </div>

            <!-- 位置筛选 -->
            <div class="filter-item">
              <label>位置</label>
              <el-tree-select
                v-model="localFilters.location"
                :data="locationTreeData"
                placeholder="选择位置"
                clearable
                @change="handleFilterChange"
                style="width: 100%"
                :props="{ label: 'label', value: 'id', children: 'children' }"
                check-strictly
              />
            </div>

            <!-- 分组显示筛选 -->
            <div class="filter-item">
              <label>分组显示</label>
              <el-select
                v-model="localFilters.group_by"
                placeholder="不分组"
                clearable
                @change="handleFilterChange"
                style="width: 100%"
              >
                <el-option label="按IP分组" value="ip" />
                <el-option label="按角色分组" value="character" />
                <el-option label="按品类分组" value="category" />
                <el-option label="按主题分组" value="theme" />
              </el-select>
            </div>
          </div>
        </div>
      </transition>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown, RefreshLeft, List, MagicStick } from '@element-plus/icons-vue'
import { useGuziStore } from '@/stores/guzi'
import { useLocationStore } from '@/stores/location'
import { getIPList, getCharacterList, getCategoryTree, getThemeList } from '@/api/metadata'
import type { GoodsSearchParams, IP, Character, Category, GoodsStatus, Theme } from '@/api/types'

// 从API获取的数据
const ipOptions = ref<IP[]>([])
const characters = ref<Character[]>([])
const categoryList = ref<Category[]>([])
const themeOptions = ref<Theme[]>([])

// 品类树节点类型（用于 el-tree-select）
interface CategoryTreeNode {
  id: number
  label: string
  children?: CategoryTreeNode[]
}

const guziStore = useGuziStore()
const locationStore = useLocationStore()

// 设备类型 & 折叠状态（PC 默认展开，移动端默认收起）
const isMobile = ref(false)
const collapsed = ref(false)
// 统一由 CSS 控制 Card 内边距，避免动画过程中布局突变
const cardBodyStyle = computed(() => ({}))

const toggleCollapsed = () => {
  collapsed.value = !collapsed.value
}

const localFilters = ref<GoodsSearchParams>({
  ip: undefined,
  character: undefined,
  category: undefined,
  theme: undefined,
  status: undefined,
  status__in: undefined,
  is_official: undefined,
  location: undefined,
  group_by: undefined,
})

// 本地状态多选
const selectedStatuses = ref<GoodsStatus[]>([])

const locationTreeData = computed(() => locationStore.treeData)

// 将品类列表转换为树形结构（用于 el-tree-select）
const categoryTreeData = computed(() => {
  const list = categoryList.value
  if (!list || list.length === 0) return []

  // 创建节点映射
  const nodeMap = new Map<number, CategoryTreeNode>()
  const rootNodes: CategoryTreeNode[] = []

  // 第一遍：创建所有节点
  list.forEach((category) => {
    const treeNode: CategoryTreeNode = {
      id: category.id,
      label: category.name,
      children: [],
    }
    nodeMap.set(category.id, treeNode)
  })

  // 第二遍：建立父子关系
  list.forEach((category) => {
    const treeNode = nodeMap.get(category.id)!
    if (category.parent === null) {
      rootNodes.push(treeNode)
    } else {
      const parentNode = nodeMap.get(category.parent)
      if (parentNode) {
        if (!parentNode.children) {
          parentNode.children = []
        }
        parentNode.children.push(treeNode)
      }
    }
  })

  // 排序：按 order 字段排序，然后按名称排序
  const sortTree = (nodes: CategoryTreeNode[]) => {
    nodes.sort((a, b) => {
      const categoryA = list.find((cat) => cat.id === a.id)
      const categoryB = list.find((cat) => cat.id === b.id)
      const orderA = categoryA?.order ?? 0
      const orderB = categoryB?.order ?? 0
      return orderA - orderB || a.label.localeCompare(b.label)
    })
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        sortTree(node.children)
      }
    })
  }

  sortTree(rootNodes)
  return rootNodes
})

const filteredCharacters = computed(() => {
  // 如果选择了IP，只显示该IP下的角色；否则返回空数组（选择器会被禁用）
  if (!localFilters.value.ip) return []
  return characters.value.filter((char) => char.ip.id === localFilters.value.ip)
})

const applyStatusToFilters = (filters: GoodsSearchParams) => {
  // 先清空状态相关字段
  filters.status = undefined
  filters.status__in = undefined

  // 根据选中的状态构造单状态或多状态参数
  if (selectedStatuses.value.length === 1) {
    filters.status = selectedStatuses.value[0]
  } else if (selectedStatuses.value.length > 1) {
    filters.status__in = selectedStatuses.value.join(',')
  }
}

const handleFilterChange = () => {
  // 如果IP改变，清空角色选择
  if (localFilters.value.ip !== guziStore.filters.ip) {
    localFilters.value.character = undefined
  }

  const filters: GoodsSearchParams = {
    ip: localFilters.value.ip || undefined,
    character: localFilters.value.character || undefined,
    category: localFilters.value.category || undefined,
    theme: localFilters.value.theme || undefined,
    is_official: localFilters.value.is_official,
    location: localFilters.value.location || undefined,
    group_by: localFilters.value.group_by || undefined,
  }

  applyStatusToFilters(filters)

  guziStore.searchGuzi(filters)
}

// 状态多选变更时，同步到统一的处理函数
const handleStatusChange = () => {
  handleFilterChange()
}

const handleReset = () => {
  localFilters.value = {
    ip: undefined,
    character: undefined,
    category: undefined,
    theme: undefined,
    status: undefined,
    status__in: undefined,
    is_official: undefined,
    location: undefined,
    group_by: undefined,
  }
  selectedStatuses.value = []
  guziStore.resetFilters()
}

// 视图模式切换处理函数
const handleViewModeChange = (mode: 'standard' | 'similar') => {
  guziStore.setViewMode(mode)
}

// 同步外部筛选条件
watch(
  () => guziStore.filters,
  (newFilters) => {
    localFilters.value = {
      ip: newFilters.ip,
      character: newFilters.character,
      category: newFilters.category,
      theme: newFilters.theme,
      status: newFilters.status,
      status__in: newFilters.status__in,
      is_official: newFilters.is_official,
      location: newFilters.location,
      group_by: newFilters.group_by,
    }

    // 同步 store 中的状态到本地多选
    if (newFilters.status__in) {
      selectedStatuses.value = newFilters.status__in.split(',') as GoodsStatus[]
    } else if (newFilters.status) {
      selectedStatuses.value = [newFilters.status]
    } else {
      selectedStatuses.value = []
    }
  },
  { deep: true },
)

onMounted(async () => {
  // 根据当前窗口宽度决定默认展开/收起
  isMobile.value = window.innerWidth < 768
  collapsed.value = isMobile.value

  // 从 store 同步初始筛选条件到本地状态
  localFilters.value = {
    ip: guziStore.filters.ip,
    character: guziStore.filters.character,
    category: guziStore.filters.category,
    theme: guziStore.filters.theme,
    status: guziStore.filters.status,
    status__in: guziStore.filters.status__in,
    is_official: guziStore.filters.is_official,
    location: guziStore.filters.location,
    group_by: guziStore.filters.group_by,
  }

  // 同步状态多选
  if (guziStore.filters.status__in) {
    selectedStatuses.value = guziStore.filters.status__in.split(',') as GoodsStatus[]
  } else if (guziStore.filters.status) {
    selectedStatuses.value = [guziStore.filters.status]
  } else {
    selectedStatuses.value = []
  }

  // 加载基础数据
  try {
    const [ipList, characterList, categoryTree, themeList] = await Promise.all([
      getIPList(),
      getCharacterList(),
      getCategoryTree(),
      getThemeList(),
    ])
    ipOptions.value = ipList
    characters.value = characterList
    categoryList.value = categoryTree
    themeOptions.value = themeList
  } catch (err) {
    ElMessage.error('加载基础数据失败')
  }

  locationStore.fetchNodes()
})
onUnmounted(() => {})
</script>

<style scoped>
.filter-panel {
  margin-bottom: 20px;
}

.filter-card {
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.filter-card--collapsed :deep(.el-card__header) {
  border-bottom: none;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  color: var(--primary-gold);
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 视图模式切换 - 滑块样式 */
.view-mode-toggle {
  display: flex;
  align-items: center;
}

.toggle-slider {
  position: relative;
  display: flex;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
}

.slider-bg {
  position: absolute;
  top: 3px;
  left: 3px;
  width: calc(50% - 4px);
  height: calc(100% - 6px);
  background: #ffffff;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
}

.toggle-slider.is-similar .slider-bg {
  transform: translateX(calc(100% + 2px));
}

.toggle-option {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: #909399;
  font-size: 13px;
  cursor: pointer;
  transition: color 0.3s;
  z-index: 1;
  border-radius: 6px;
  white-space: nowrap;
}

.toggle-option:hover:not(:disabled) {
  color: #606266;
}

.toggle-option.active {
  color: var(--primary-gold);
  font-weight: 500;
}

.toggle-option:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.toggle-option .el-icon {
  font-size: 14px;
}

.icon-btn {
  padding: 4px;
  min-height: auto;
}

.toggle-btn {
  padding: 4px;
  min-height: auto;
}

.toggle-icon {
  transition: transform var(--transition-fast);
}

.toggle-icon.expanded {
  transform: rotate(180deg);
}

/* 展开/收起外层：使用 grid-template-rows 实现高性能动画 */
.filter-collapse-wrapper {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows 0.3s ease, opacity 0.2s ease;
  overflow: hidden;
}

/* 筛选内容：PC 用自适应网格，移动端单列 */
.filter-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  /* 间距自适应：不同屏宽下更均衡 */
  gap: clamp(12px, 1.6vw, 20px);
  align-items: start;
  padding-bottom: 4px; /* 留一点空隙防止阴影被裁切 */
  min-height: 0; /* 确保内部内容在折叠时不会溢出 */
}

/* 展开/收起动画：使用 grid-template-rows，性能最优 */
.filter-collapse-enter-active,
.filter-collapse-leave-active {
  transition: grid-template-rows 0.3s ease, opacity 0.2s ease;
}

.filter-collapse-enter-from,
.filter-collapse-leave-to {
  grid-template-rows: 0fr;
  opacity: 0;
}

.filter-collapse-enter-to,
.filter-collapse-leave-from {
  grid-template-rows: 1fr;
  opacity: 1;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-item label {
  /* 标签美化：更紧凑、更清晰 */
  font-size: 12px;
  color: #909399;
  font-weight: 600;
  margin-bottom: 4px;
  padding-left: 2px;
}

/* 状态按钮组：PC 保持同一行，移动端再用三列网格 */
.status-group {
  display: inline-flex;
  flex-wrap: nowrap;
  gap: 8px;
  align-items: center;
}

/* 统一筛选控件的高度与圆角（下拉框/输入框/状态按钮严格对齐） */
.filter-panel {
  --filter-control-height: 32px;
  --filter-control-radius: 8px;
}

@media (max-width: 768px) {
  .filter-panel {
    --filter-control-height: 36px;
  }
}

::deep(.el-input__wrapper),
::deep(.el-select__wrapper) {
  border-radius: var(--filter-control-radius) !important;
  height: var(--filter-control-height);
  min-height: var(--filter-control-height);
  background-color: #fff !important;
}

::deep(.el-input__inner),
::deep(.el-select__selected-item) {
  line-height: var(--filter-control-height);
}


/* PC 大屏：强制单行显示，使用更稳定的分配方式 */
@media (min-width: 1280px) {
  .filter-content {
    /* 使用更稳定的分配方式：前4个等宽，状态自适应，是否官谷压缩，位置略宽，分组显示略宽 */
    grid-template-columns: repeat(4, 1fr) auto minmax(80px, 0.8fr) 1.1fr 1.1fr;
    gap: 12px;
    align-items: start;     /* 顶部对齐，确保所有元素垂直位置一致 */
    white-space: nowrap;    /* 防止内部元素由于挤压而换行 */
    /* 开启硬件加速，减少缩放时的重绘 */
    transform: translateZ(0);
    will-change: contents;
  }

  /* 2. 针对状态按钮组的深度优化：PC端改回紧凑型，并确保高度与其他输入框一致 */
  .filter-item--status {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .filter-item--status .status-group {
    gap: 6px;               /* PC 大屏：稍微隔开一点点 */
    align-items: stretch;   /* 确保按钮组内部元素高度一致 */
  }

  .filter-item--status :deep(.el-checkbox-button__inner) {
    padding: 0 12px !important; /* 高度统一，横向留白即可 */
    font-size: 13px !important;
    height: var(--filter-control-height);
    min-height: var(--filter-control-height);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* 3. 针对"是否官谷"下拉框的特定优化 */
  .filter-item--official {
    min-width: 90px;
  }
}

/* 针对 1280px 以下、769px 以上的屏幕（如 13寸笔记本） */
@media (min-width: 769px) and (max-width: 1279px) {
  .filter-content {
    /* 在这个区间，8 个筛选器自适应缩放 */
    grid-template-columns: repeat(8, minmax(80px, 1fr));
    gap: 8px;
  }
}

@media (max-width: 768px) {
  /* 移动端状态组深度优化：三列等宽平铺，消除右侧留白 */
  .status-group {
    display: grid !important;
    /* 核心：三列等宽，1:1:1 分配空间 */
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 8px !important; /* 统一间距 */
    margin-left: 0 !important; /* 移除之前的左边距 */
    width: 100%;
  }

  /* 移除 Element Plus 按钮组默认的连接效果，改为独立的圆角胶囊 */
  .filter-item--status :deep(.el-checkbox-button__inner) {
    width: 100%;
    padding: 0 8px !important; /* 高度由变量控制，避免各控件不齐 */
    font-size: 13px !important;
    border: 1px solid var(--el-border-color-light) !important;
    border-radius: var(--filter-control-radius) !important;
    background-color: #f9fafb !important;
    box-shadow: none !important;
    transition: all 0.2s ease;
    height: var(--filter-control-height);
    min-height: var(--filter-control-height);
  }

  /* 首尾也保持一致圆角，避免 Element 默认样式干扰 */
  .filter-item--status :deep(.el-checkbox-button:first-child .el-checkbox-button__inner),
  .filter-item--status :deep(.el-checkbox-button:last-child .el-checkbox-button__inner) {
    border-radius: var(--filter-control-radius) !important;
  }
}

/* 统一处理 Card 内边距，不使用动态 style 防止动画跳变 */
:deep(.el-card__body) {
  padding: 20px;
  transition: padding 0.3s;
}

.filter-card--collapsed :deep(.el-card__body) {
  /* 折叠时减少上下 padding，但不要瞬间归零，避免内容位置突变 */
  padding-top: 0;
  padding-bottom: 0;
}

@media (max-width: 768px) {
  .filter-panel {
    margin-bottom: 12px;
  }

  .filter-content {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  /* 与上方移动端状态组设置保持一致，避免被二次覆盖 */
  .status-group {
    margin-left: 0 !important;
  }

  /* 移动端优化：缩小切换按钮 */
  .toggle-option {
    padding: 4px 8px;
    font-size: 12px;
    gap: 2px;
  }

  .toggle-option .el-icon {
    font-size: 13px;
  }

  .toggle-slider {
    padding: 2px;
  }

  .slider-bg {
    top: 2px;
    left: 2px;
    width: calc(50% - 3px);
    height: calc(100% - 4px);
  }

  .toggle-slider.is-similar .slider-bg {
    transform: translateX(calc(100% + 1px));
  }
}

/* 状态按钮样式，保持与之前单选按钮风格一致 */
.filter-item--status :deep(.el-checkbox-button__inner) {
  border-color: var(--border-color);
}
/* PC 端状态组微调：增加间隙，弱化“合并式”按钮组观感 */
@media (min-width: 769px) {
  .status-group {
    gap: 12px;
  }

  .filter-item--status :deep(.el-checkbox-button__inner) {
    border: 1px solid #dcdfe6 !important;
    border-radius: var(--filter-control-radius) !important;
    margin-right: 0;
  }
}

/* 状态筛选：多选胶囊 Chip（按状态语义着色） */
.filter-item--status {
  --status-in-cabinet: #0ea371; /* 翠绿：安全/存储中 */
  --status-outdoor: #d4a017; /* 香槟金/橙黄：活跃/携带中 */
  --status-sold: #6b7280; /* 中性灰：已售出 */
  --status-chip-bg: #f3f4f6;
  --status-chip-border: #d1d5db;
  --status-chip-text: #374151;
}

.filter-item--status :deep(.status-chip .el-checkbox-button__inner) {
  background-color: var(--status-chip-bg) !important;
  border: 1px solid var(--status-chip-border) !important;
  border-radius: var(--filter-control-radius) !important;
  color: var(--status-chip-text) !important;
  font-weight: 600;
  gap: 6px;
  justify-content: center;
  box-shadow: none !important;
  transition: background-color 0.18s ease, border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
  height: var(--filter-control-height);
  min-height: var(--filter-control-height);
  padding: 0 12px !important;
}

.filter-item--status :deep(.status-chip .el-checkbox-button__inner)::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.9;
  flex: 0 0 auto;
}

/* 仅激活态：小圆点微微闪烁（呼吸感） */
.filter-item--status :deep(.status-chip.is-checked .el-checkbox-button__inner)::before {
  animation: statusDotPulse 1.6s ease-in-out infinite;
}

@keyframes statusDotPulse {
  0% {
    opacity: 0.55;
    transform: scale(0.92);
  }
  50% {
    opacity: 1;
    transform: scale(1.12);
  }
  100% {
    opacity: 0.55;
    transform: scale(0.92);
  }
}

@media (prefers-reduced-motion: reduce) {
  .filter-item--status :deep(.status-chip.is-checked .el-checkbox-button__inner)::before {
    animation: none;
  }
}

.filter-item--status :deep(.status-chip:not(.is-disabled):hover .el-checkbox-button__inner) {
  background-color: #eef2f7 !important;
  border-color: #9ca3af !important;
}

.filter-item--status :deep(.status-chip.is-focus .el-checkbox-button__inner) {
  box-shadow: 0 0 0 2px rgba(17, 24, 39, 0.18) !important;
}

.filter-item--status :deep(.status-chip--in-cabinet.is-checked .el-checkbox-button__inner) {
  color: var(--status-in-cabinet) !important;
  background-color: rgba(14, 163, 113, 0.12) !important;
  border-color: rgba(14, 163, 113, 0.55) !important;
}

.filter-item--status :deep(.status-chip--outdoor.is-checked .el-checkbox-button__inner) {
  color: var(--status-outdoor) !important;
  background-color: rgba(212, 160, 23, 0.14) !important;
  border-color: rgba(212, 160, 23, 0.55) !important;
}

.filter-item--status :deep(.status-chip--sold .el-checkbox-button__inner) {
  color: var(--status-sold) !important;
  font-weight: 500;
}

.filter-item--status :deep(.status-chip--sold.is-checked .el-checkbox-button__inner) {
  background-color: #e5e7eb !important;
  border-color: #cbd5e1 !important;
}

/* 输入类控件的高度/圆角已在上方统一变量中设置 */
</style>






