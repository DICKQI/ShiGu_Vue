<template>
  <div class="cloud-showcase">
    <!-- 搜索栏 -->
    <div class="search-section">
      <SearchBar />
    </div>

    <!-- 筛选面板 -->
    <FilterPanel />

    <!-- 列表区域 -->
    <div class="list-section">
      <div v-if="guziStore.loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="guziStore.error" class="error-container">
        <el-alert :title="guziStore.error" type="error" :closable="false" />
      </div>

      <div v-else-if="guziStore.guziList.length === 0" class="empty-container">
        <el-empty description="暂无谷子数据" />
      </div>

      <div v-else class="goods-grid">
        <GoodsCard
          v-for="goods in guziStore.guziList"
          :key="goods.id"
          :goods="goods"
          @click="handleCardClick"
          @location-click="handleLocationClick"
          @context-menu="handleCardContextMenu"
        />
      </div>

      <!-- 分页 -->
      <div v-if="guziStore.pagination.count > 0" class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="20"
          :total="guziStore.pagination.count"
          layout="prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 详情抽屉 -->
    <GoodsDrawer v-model="drawerVisible" :goods-id="selectedGoodsId" />

    <!-- 右键菜单 -->
    <div
      v-if="contextMenuVisible"
      class="context-menu-overlay"
      @click="closeContextMenu"
      @contextmenu.prevent
    >
      <div
        class="context-menu"
        :style="{ top: contextMenuY + 'px', left: contextMenuX + 'px' }"
        @click.stop
      >
        <div class="context-menu-item" @click="handleEditGoods">
          编辑
        </div>
        <div class="context-menu-item context-menu-item-danger" @click="handleDeleteGoods">
          删除
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useGuziStore } from '@/stores/guzi'
import SearchBar from '@/components/SearchBar.vue'
import FilterPanel from '@/components/FilterPanel.vue'
import GoodsCard from '@/components/GoodsCard.vue'
import GoodsDrawer from '@/components/GoodsDrawer.vue'
import type { GoodsListItem } from '@/api/types'
import { deleteGoods } from '@/api/goods'

const router = useRouter()
const guziStore = useGuziStore()

const drawerVisible = ref(false)
const selectedGoodsId = ref<string>('')

const contextMenuVisible = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuGoods = ref<GoodsListItem | null>(null)

const currentPage = computed({
  get: () => guziStore.pagination.page,
  set: (val) => guziStore.setPage(val),
})

const handleCardClick = (goods: GoodsListItem) => {
  selectedGoodsId.value = goods.id
  drawerVisible.value = true
}

const handleCardContextMenu = (payload: { goods: GoodsListItem; x: number; y: number }) => {
  contextMenuGoods.value = payload.goods
  contextMenuX.value = payload.x
  contextMenuY.value = payload.y
  contextMenuVisible.value = true
}

const handleLocationClick = (path: string) => {
  // 跳转到位置管理页
  router.push({ name: 'Location', query: { highlight: path } })
}

const handlePageChange = (page: number) => {
  guziStore.setPage(page)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const closeContextMenu = () => {
  contextMenuVisible.value = false
}

const handleEditGoods = () => {
  if (!contextMenuGoods.value) return
  const id = contextMenuGoods.value.id
  closeContextMenu()
  router.push({ name: 'GoodsEdit', params: { id } })
}

const handleDeleteGoods = async () => {
  if (!contextMenuGoods.value) return
  const goods = contextMenuGoods.value
  closeContextMenu()
  try {
    await ElMessageBox.confirm(
      `确认删除「${goods.name}」吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
    await deleteGoods(goods.id)
    ElMessage.success('删除成功')
    guziStore.searchGuziImmediate()
  } catch (error: any) {
    // 用户取消
    if (error === 'cancel' || error === 'close') return
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  // 初始化加载数据（立即执行，不使用防抖）
  guziStore.searchGuziImmediate()
})
</script>

<style scoped>
.cloud-showcase {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.search-section {
  margin-bottom: 24px;
}

.list-section {
  margin-top: 24px;
}

.loading-container,
.error-container,
.empty-container {
  padding: 40px 20px;
  text-align: center;
}

.goods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

@media (max-width: 768px) {
  .goods-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 40px;
  padding-bottom: 40px;
}

.context-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
}

.context-menu {
  position: fixed;
  min-width: 140px;
  background-color: var(--bg-white);
  border-radius: 10px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-color);
  padding: 6px 0;
  z-index: 2100;
}

.context-menu-item {
  padding: 8px 16px;
  font-size: 14px;
  color: var(--text-dark);
  cursor: pointer;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.context-menu-item:hover {
  background-color: var(--primary-gold-light);
  color: var(--primary-gold-dark);
}

.context-menu-item-danger {
  color: #F56C6C;
}

.context-menu-item-danger:hover {
  background-color: rgba(245, 108, 108, 0.1);
  color: #F56C6C;
}

:deep(.el-pagination) {
  --el-pagination-button-color: var(--text-dark);
  --el-pagination-hover-color: var(--primary-gold);
  --el-pagination-active-color: var(--primary-gold);
}
</style>

