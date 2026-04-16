<template>
  <div class="goods-drafts">
    <div class="header-section">
      <div class="title-wrapper">
        <h2 class="page-title">草稿箱</h2>
        <span class="sub-title">仅显示状态为草稿的谷子，点击可继续编辑</span>
      </div>
      <div class="header-actions">
        <el-button @click="handleBack">返回</el-button>
        <el-button type="primary" @click="handleNew">新增谷子</el-button>
      </div>
    </div>

    <div class="content-body">
      <Transition name="fade-slide" mode="out-in">
        <div v-if="loading" key="loading" class="loading-container">
          <el-skeleton :rows="5" animated />
        </div>

        <div v-else-if="error" key="error" class="error-container">
          <el-alert :title="error" type="error" :closable="false" />
        </div>

        <div v-else-if="drafts.length === 0" key="empty" class="empty-container">
          <el-empty description="暂无草稿" />
        </div>

        <div v-else key="list" class="goods-grid">
          <GoodsCard
            v-for="goods in drafts"
            :key="goods.id"
            :goods="goods"
            :show-menu="false"
            @click="handleCardClick"
            @location-click="handleLocationClick"
          />
        </div>
      </Transition>
    </div>

    <div v-if="pagination.count > 0" class="pagination-container">
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pagination.page_size"
          :total="pagination.count"
          layout="prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getGoodsList } from '@/api/goods'
import type { GoodsListItem, PaginatedResponse } from '@/api/types'
import GoodsCard from '@/components/GoodsCard.vue'

const router = useRouter()

const drafts = ref<GoodsListItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const pagination = ref({
  count: 0,
  page: 1,
  page_size: 18,
  next: null as number | null,
  previous: null as number | null,
})

const currentPage = computed({
  get: () => pagination.value.page,
  set: (val) => (pagination.value.page = val),
})

const fetchDrafts = async () => {
  if (loading.value) return
  loading.value = true
  error.value = null
  try {
    const resp = await getGoodsList({
      status: 'draft',
      page: pagination.value.page,
      page_size: pagination.value.page_size,
    })
    const data = resp as PaginatedResponse<GoodsListItem>
    drafts.value = Array.isArray(data.results) ? data.results : []
    pagination.value = {
      count: typeof data.count === 'number' ? data.count : drafts.value.length,
      page: typeof data.page === 'number' ? data.page : pagination.value.page,
      page_size: typeof data.page_size === 'number' ? data.page_size : pagination.value.page_size,
      next: data.next ?? null,
      previous: data.previous ?? null,
    }
  } catch (e: any) {
    error.value = e?.message || '加载草稿失败'
    drafts.value = []
  } finally {
    loading.value = false
  }
}

const handlePageChange = async (page: number) => {
  pagination.value.page = page
  await fetchDrafts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleCardClick = (goods: GoodsListItem) => {
  router.push({ name: 'GoodsEdit', params: { id: goods.id } })
}

const handleLocationClick = (path: string) => {
  router.push({ name: 'Location', query: { highlight: path } })
}

const handleBack = () => router.back()
const handleNew = () => router.push({ name: 'GoodsNew' })

onMounted(fetchDrafts)
</script>

<style scoped>
.goods-drafts {
  padding: 20px;
  padding-bottom: 90px;
  max-width: 1400px;
  margin: 0 auto;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.title-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #303133;
}

.sub-title {
  font-size: 13px;
  color: #909399;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.content-body {
  margin-top: 12px;
  min-height: 260px;
}

.goods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.loading-container,
.error-container,
.empty-container {
  padding: 40px 20px;
  text-align: center;
}

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
  pointer-events: none;
}

.pagination-wrapper {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 8px 12px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1), 0 -2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.8);
  pointer-events: auto;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 768px) {
  .goods-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
  .header-section {
    flex-direction: column;
    align-items: stretch;
  }
  .header-actions {
    justify-content: flex-end;
  }
}
</style>

