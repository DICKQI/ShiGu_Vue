<template>
  <div class="filter-panel">
    <el-card class="filter-card">
      <template #header>
        <div class="filter-header">
          <span>筛选条件</span>
          <el-button text @click="handleReset">重置</el-button>
        </div>
      </template>

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

        <!-- 角色筛选（联动） -->
        <div class="filter-item">
          <label>角色</label>
          <el-select
            v-model="localFilters.character"
            placeholder="选择角色"
            clearable
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

        <!-- 品类筛选 -->
        <div class="filter-item">
          <label>品类</label>
          <el-select
            v-model="localFilters.category"
            placeholder="选择品类"
            clearable
            @change="handleFilterChange"
            style="width: 100%"
          >
            <el-option
              v-for="cat in categoryOptions"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
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
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useGuziStore } from '@/stores/guzi'
import { useLocationStore } from '@/stores/location'
import { getIPList, getCharacterList, getCategoryList } from '@/api/metadata'
import type { GoodsSearchParams, IP, Character, Category, GoodsStatus } from '@/api/types'

// 从API获取的数据
const ipOptions = ref<IP[]>([])
const characters = ref<Character[]>([])
const categoryOptions = ref<Category[]>([])

const guziStore = useGuziStore()
const locationStore = useLocationStore()

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

const filteredCharacters = computed(() => {
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
  // 加载基础数据
  try {
    const [ipList, characterList, categoryList] = await Promise.all([
      getIPList(),
      getCharacterList(),
      getCategoryList(),
    ])
    ipOptions.value = ipList
    characters.value = characterList
    categoryOptions.value = categoryList
  } catch (err) {
    ElMessage.error('加载基础数据失败')
  }

  locationStore.fetchNodes()
})
</script>

<style scoped>
.filter-panel {
  margin-bottom: 20px;
}

.filter-card {
  border: 1px solid var(--border-color);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  color: var(--primary-gold);
}

.filter-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
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


