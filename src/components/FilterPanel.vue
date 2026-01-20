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
            placeholder="选择角色（支持搜索）"
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
                placeholder="选择品类（支持任意层级）"
                clearable
                @change="handleFilterChange"
                style="width: 100%"
                :props="{ label: 'label', value: 'id' }"
                check-strictly
              />
            </div>

            <!-- 状态筛选（支持多选） -->
            <div class="filter-item">
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
                :props="{ label: 'label', value: 'id' }"
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
import { getIPList, getCharacterList, getCategoryTree } from '@/api/metadata'
import type { GoodsSearchParams, IP, Character, Category, GoodsStatus } from '@/api/types'

// 从API获取的数据
const ipOptions = ref<IP[]>([])
const characters = ref<Character[]>([])
const categoryList = ref<Category[]>([])

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
const cardBodyStyle = computed(() =>
  collapsed.value ? { padding: '0' } : {}
)

const toggleCollapsed = () => {
  collapsed.value = !collapsed.value
}

const localFilters = ref<GoodsSearchParams>({
  ip: undefined,
  character: undefined,
  category: undefined,
  status: undefined,
  status__in: undefined,
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
    status: undefined,
    status__in: undefined,
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
      status: newFilters.status,
      status__in: newFilters.status__in,
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
    const [ipList, characterList, categoryTree] = await Promise.all([
      getIPList(),
      getCharacterList(),
      getCategoryTree(),
    ])
    ipOptions.value = ipList
    characters.value = characterList
    categoryList.value = categoryTree
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

/* 展开/收起外层，用于高度动画 */
.filter-collapse-wrapper {
  overflow: hidden;
}

.filter-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

/* 展开/收起动画：使用 max-height + 透明度，模拟「缓慢缩小」 */
.filter-collapse-enter-active,
.filter-collapse-leave-active {
  transition:
    max-height 0.3s ease,
    opacity 0.25s ease;
}

.filter-collapse-enter-from,
.filter-collapse-leave-to {
  max-height: 0;
  opacity: 0;
}

.filter-collapse-enter-to,
.filter-collapse-leave-from {
  max-height: 800px; /* 足够覆盖筛选内容高度 */
  opacity: 1;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-item label {
  font-size: 14px;
  color: var(--text-light);
  font-weight: 500;
}

.status-group {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
}

@media (max-width: 768px) {
  .filter-panel {
    margin-bottom: 12px;
  }

  .filter-content {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .status-group {
    margin-left: 4px;
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
</style>






