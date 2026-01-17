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
    </div>

    <!-- 分页 - 悬浮固定在底部 -->
    <div 
      v-if="guziStore.pagination.count > 0" 
      class="pagination-container"
      :class="{ 'pagination-visible': showPagination || !isMobile }"
    >
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="guziStore.pagination.page_size"
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
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

// 移动端分页器显示控制
const isMobile = ref(window.innerWidth < 768)
const showPagination = ref(false)

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

// 检测是否滚动到底部
const checkScrollBottom = () => {
  if (!isMobile.value) {
    showPagination.value = true
    return
  }

  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  
  // 当距离底部小于等于 100px 时显示分页器
  const threshold = 100
  const distanceToBottom = documentHeight - (scrollTop + windowHeight)
  
  showPagination.value = distanceToBottom <= threshold
}

const handleResize = () => {
  isMobile.value = window.innerWidth < 768
  if (!isMobile.value) {
    showPagination.value = true
  } else {
    checkScrollBottom()
  }
}

onMounted(() => {
  // 初始化加载数据（立即执行，不使用防抖）
  guziStore.searchGuziImmediate()
  
  // 初始化分页器显示状态
  if (isMobile.value) {
    checkScrollBottom()
  } else {
    showPagination.value = true
  }
  
  // 添加滚动监听
  window.addEventListener('scroll', checkScrollBottom, { passive: true })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('scroll', checkScrollBottom)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.cloud-showcase {
  padding: 20px;
  padding-bottom: 100px; /* 为固定分页器预留空间 */
  max-width: 1400px;
  margin: 0 auto;
  min-height: calc(100vh - 64px); /* 减去导航栏高度 */
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
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .goods-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
  
  .cloud-showcase {
    padding-bottom: 120px; /* 移动端预留更多空间 */
  }
}

/* 悬浮分页器容器 - 固定在底部 */
.pagination-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px 20px;
  z-index: 100;
  pointer-events: none; /* 让容器本身不拦截点击 */
}

/* 悬浮卡片包装器 */
.pagination-wrapper {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 8px 12px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1), 0 -2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.8);
  pointer-events: auto; /* 恢复分页器本身的点击事件 */
  transition: all var(--transition-normal);
  display: inline-flex; /* 让宽度根据内容自适应 */
}

.pagination-wrapper:hover {
  box-shadow: 0 -6px 24px rgba(0, 0, 0, 0.12), 0 -4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .pagination-container {
    padding: 10px 16px;
    /* 在移动端，将分页器放在底部导航栏上方 */
    bottom: calc(64px + env(safe-area-inset-bottom));
    /* 默认隐藏，通过 transform 向下移动 */
    transform: translateY(calc(100% + 20px));
    opacity: 0;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  
  .pagination-container.pagination-visible {
    transform: translateY(0);
    opacity: 1;
  }
  
  .pagination-wrapper {
    padding: 6px 10px;
    border-radius: 12px;
    /* 移除 width 设置，让分页器根据内容自适应宽度 */
  }
  
  /* 兼容不支持 safe-area-inset-bottom 的环境 */
  @supports not (bottom: env(safe-area-inset-bottom)) {
    .pagination-container {
      bottom: 64px;
    }
  }
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
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.context-menu-item:focus,
.context-menu-item:active {
  outline: none;
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

/* 让分页器更紧凑 */
:deep(.el-pagination .el-pager li),
:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next) {
  min-width: 32px;
  height: 32px;
  line-height: 32px;
  font-size: 14px;
}

@media (max-width: 768px) {
  :deep(.el-pagination .el-pager li),
  :deep(.el-pagination .btn-prev),
  :deep(.el-pagination .btn-next) {
    min-width: 28px;
    height: 28px;
    line-height: 28px;
    font-size: 13px;
  }
}
</style>

