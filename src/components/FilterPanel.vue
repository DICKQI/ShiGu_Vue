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
            <el-checkbox-button label="in_cabinet">在馆</el-checkbox-button>
            <el-checkbox-button label="outdoor">出街中</el-checkbox-button>
            <el-checkbox-button label="sold">已售出</el-checkbox-button>
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
          </div>
        </div>
      </transition>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown, RefreshLeft } from '@element-plus/icons-vue'
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
  }
  selectedStatuses.value = []
  guziStore.resetFilters()
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
  gap: 4px;
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


/* PC 大屏：强制单行显示，使用更稳定的分配方式 */
@media (min-width: 1280px) {
  .filter-content {
    /* 使用更稳定的分配方式：前4个等宽，状态自适应，是否官谷压缩，位置略宽 */
    grid-template-columns: repeat(4, 1fr) auto minmax(80px, 0.8fr) 1.2fr;
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
    gap: 0px;               /* PC 端取消间隙，使用按钮组样式更省空间 */
    align-items: stretch;   /* 确保按钮组内部元素高度一致 */
  }

  :deep(.el-checkbox-button__inner) {
    padding: 8px 12px !important; /* 缩小按钮内边距 */
    font-size: 13px !important;
    height: 32px;           /* 与 Element Plus 输入框默认高度一致 */
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
    /* 在这个区间，如果 7 个实在塞不下，才允许它自适应缩放，
       但仍优先保持单行，除非总宽小于 900px */
    grid-template-columns: repeat(7, minmax(80px, 1fr));
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
  :deep(.el-checkbox-button__inner) {
    width: 100%;
    padding: 10px 4px !important; /* 增加上下高度，方便手指点击 */
    font-size: 13px !important;
    border: 1px solid var(--el-border-color-light) !important;
    border-radius: 8px !important; /* 全圆角胶囊感 */
    background-color: #f9fafb !important;
    box-shadow: none !important;
    transition: all 0.2s ease;
  }

  /* 选中状态的视觉增强 */
  :deep(.el-checkbox-button.is-checked .el-checkbox-button__inner) {
    background-color: rgba(var(--accent-purple-rgb, 103, 58, 183), 0.1) !important;
    color: var(--accent-purple, #673ab7) !important;
    border-color: var(--accent-purple, #673ab7) !important;
    font-weight: bold;
  }

  /* 首尾也保持一致圆角，避免 Element 默认样式干扰 */
  :deep(.el-checkbox-button:first-child .el-checkbox-button__inner),
  :deep(.el-checkbox-button:last-child .el-checkbox-button__inner) {
    border-radius: 8px !important;
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
}

/* 状态按钮样式，保持与之前单选按钮风格一致 */
::deep(.el-checkbox-button__inner) {
  border-color: var(--border-color);
}

::deep(.el-checkbox-button.is-checked .el-checkbox-button__inner) {
  background-color: var(--accent-purple);
  border-color: var(--accent-purple);
  color: #fff;
}
/* PC 端状态组微调：增加间隙，弱化“合并式”按钮组观感 */
@media (min-width: 769px) {
  .status-group {
    gap: 12px;
  }

  :deep(.el-checkbox-button__inner) {
    border: 1px solid #dcdfe6 !important;
    border-radius: 6px !important; /* PC 端圆角稍尖一点，显得干练 */
    margin-right: 0;
  }
}

/* 统一输入框圆角 */
:deep(.el-input__wrapper),
:deep(.el-select__wrapper) {
  border-radius: 8px !important;
  background-color: #fff !important;
}
</style>






