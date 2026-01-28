<template>
  <div class="showcase-manager">
    <!-- 背景装饰 -->
    <div class="bg-decoration"></div>

    <div class="layout" :class="{ 'mobile-detail-active': isMobile && showcaseStore.activeShowcaseId }">
      <!-- 左侧：展柜列表 -->
      <div class="panel-container left-panel" v-show="!isMobile || !showcaseStore.activeShowcaseId">
        <el-card shadow="never" class="glass-card adaptive-card">
          <template #header>
            <div class="panel-header">
              <div class="panel-title">
                <el-icon><Collection /></el-icon> 我的展柜
              </div>
              <el-button type="primary" circle class="btn-accent" @click="openCreateShowcase">
                <el-icon><Plus /></el-icon>
              </el-button>
            </div>
          </template>

          <div class="scroll-content">
            <div v-if="showcaseStore.error" class="state-box">
              <el-alert :title="showcaseStore.error" type="error" :closable="false" show-icon />
            </div>

            <div v-else-if="showcaseStore.listLoading && showcaseStore.list.length === 0" class="state-box">
              <el-skeleton :rows="6" animated />
            </div>

            <div v-else-if="showcaseStore.list.length === 0" class="state-box empty">
              <el-empty description="暂无展柜，打造你的第一个痛柜吧！" image-size="100" />
            </div>

            <div v-else class="showcase-list">
              <div
                v-for="s in showcaseStore.list"
                :key="s.id"
                class="showcase-item"
                :class="{ active: s.id === showcaseStore.activeShowcaseId }"
                @click="handleSelectShowcase(s.id)"
              >
                <div class="showcase-cover">
                  <el-image
                    v-if="s.cover_image"
                    :src="s.cover_image"
                    fit="cover"
                    class="cover-img"
                    loading="lazy"
                  />
                  <div v-else class="cover-placeholder">
                    <el-icon><Picture /></el-icon>
                  </div>
                </div>
                <div class="showcase-info">
                  <div class="showcase-name text-truncate">{{ s.name }}</div>
                  <div class="showcase-desc text-truncate">{{ s.description || '暂无描述' }}</div>
                </div>
                <el-icon v-if="s.id === showcaseStore.activeShowcaseId" class="active-icon"><ArrowRight /></el-icon>
              </div>
            </div>

            <div class="pager-container">
              <el-pagination
                v-if="showcaseStore.pagination.count > 0"
                v-model:current-page="showcaseCurrentPage"
                :page-size="showcaseStore.pagination.page_size"
                :total="showcaseStore.pagination.count"
                small
                layout="prev, pager, next"
                background
              />
            </div>
          </div>
        </el-card>
      </div>

      <!-- 右侧：展柜详情 -->
      <div class="panel-container right-panel" v-show="!isMobile || showcaseStore.activeShowcaseId">
        <el-card shadow="never" class="glass-card adaptive-card detail-card">
          <template #header>
            <div class="panel-header detail-header">
              <div class="header-left">
                <el-button v-if="isMobile" link @click="backToList" class="back-btn">
                  <el-icon><ArrowLeft /></el-icon>
                </el-button>
                <div class="panel-title">展柜详情</div>
              </div>
              <div class="panel-actions">
                <el-button text bg size="small" :disabled="!showcaseStore.activeShowcaseId" @click="openEditShowcase">
                  编辑
                </el-button>
                <el-button
                  type="danger"
                  text
                  bg
                  size="small"
                  :disabled="!showcaseStore.activeShowcaseId"
                  @click="handleDeleteShowcase"
                >
                  删除
                </el-button>
              </div>
            </div>
          </template>

          <div v-if="!showcaseStore.activeShowcaseId && !isMobile" class="detail-empty-state">
            <el-empty description="请从左侧选择一个展柜开始布置" />
          </div>

          <div v-else-if="showcaseStore.detailLoading && !showcaseStore.activeShowcase" class="detail-loading">
            <el-skeleton :rows="10" animated />
          </div>

          <div v-else-if="showcaseStore.activeShowcase" class="detail-content scroll-content">
            <div class="detail-info-banner">
              <div class="info-text">
                <h2 class="detail-name">{{ showcaseStore.activeShowcase.name }}</h2>
                <p class="detail-desc">{{ showcaseStore.activeShowcase.description || '这个展柜还没有描述...' }}</p>
                <div class="detail-tags">
                  <el-tag size="small" :type="showcaseStore.activeShowcase.is_public ? 'success' : 'info'" effect="light" round>
                    {{ showcaseStore.activeShowcase.is_public ? '公开展示' : '私密收藏' }}
                  </el-tag>
                </div>
              </div>
              <div class="info-action">
                <el-button type="primary" class="btn-accent add-goods-btn" @click="openAddGoods">
                  <el-icon class="el-icon--left"><Goods /></el-icon> 添加谷子
                </el-button>
              </div>
            </div>

            <el-divider class="custom-divider" />

            <div class="goods-section">
              <div class="section-header">
                <span class="section-title">收纳物品</span>
                <span class="section-count">{{ showcaseStore.sortedShowcaseGoods.length }} 件</span>
              </div>

              <div v-if="showcaseStore.sortedShowcaseGoods.length === 0" class="goods-empty">
                <el-empty description="这里空空如也，快去添加心爱的谷子吧！" image-size="80" />
              </div>

              <div v-else class="goods-grid">
                <div
                  v-for="item in showcaseStore.sortedShowcaseGoods"
                  :key="item.id"
                  class="goods-wrapper"
                >
                  <GoodsCard
                    :goods="item.goods"
                    class="mini-goods-card"
                    @click="handleOpenGoodsDetail"
                    @location-click="noop"
                    @context-menu="noop"
                  />
                  <div class="goods-control">
                    <el-dropdown trigger="click" size="small">
                      <span class="el-dropdown-link">
                        <el-icon><MoreFilled /></el-icon>
                      </span>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item @click="moveUp(item.goods.id)" :disabled="isFirst(item.goods.id)">
                            <el-icon><Top /></el-icon> 上移
                          </el-dropdown-item>
                          <el-dropdown-item @click="moveDown(item.goods.id)" :disabled="isLast(item.goods.id)">
                            <el-icon><Bottom /></el-icon> 下移
                          </el-dropdown-item>
                          <el-dropdown-item divided @click="handleRemoveFromShowcase(item.goods.id)" class="text-danger">
                            <el-icon><Delete /></el-icon> 移除
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <GoodsDrawer v-model="goodsDrawerVisible" :goods-id="selectedGoodsId" />

    <el-dialog
      v-model="showcaseDialogVisible"
      :title="showcaseDialogTitle"
      width="460px"
      class="custom-dialog"
      align-center
    >
      <el-form :model="showcaseForm" label-position="top">
        <el-form-item label="展柜名称">
          <el-input v-model="showcaseForm.name" maxlength="200" show-word-limit placeholder="给你的痛柜起个名字" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="showcaseForm.description" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="写点什么..." />
        </el-form-item>
        <el-form-item>
          <div class="switch-row">
            <span>是否公开</span>
            <el-switch v-model="showcaseForm.is_public" active-color="#A29BFE" />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showcaseDialogVisible = false">取消</el-button>
        <el-button type="primary" class="btn-accent" :loading="showcaseStore.mutating" @click="submitShowcase">
          保存
        </el-button>
      </template>
    </el-dialog>

    <el-drawer
      v-model="addDrawerVisible"
      title="从谷仓选购"
      direction="rtl"
      :size="isMobile ? '100%' : '480px'"
      class="add-drawer-panel"
    >
      <div class="add-container full-height">
        <div class="search-bar">
          <el-input
            v-model="addSearch"
            placeholder="搜索名称/IP..."
            clearable
            :prefix-icon="Search"
            @keyup.enter="fetchAddGoods(1)"
          >
            <template #append>
              <el-button @click="fetchAddGoods(1)" :loading="addLoading">搜索</el-button>
            </template>
          </el-input>
        </div>

        <div class="search-results scroll-content">
          <div v-if="addError" class="state-box">
            <el-alert :title="addError" type="error" :closable="false" />
          </div>

          <div v-else-if="addLoading && addList.length === 0" class="state-box">
            <el-skeleton :rows="5" animated />
          </div>

          <div v-else-if="addList.length === 0" class="state-box">
            <el-empty description="没有找到相关谷子" image-size="80" />
          </div>

          <div v-else class="add-list">
            <div v-for="g in addList" :key="g.id" class="add-item-card">
              <div class="add-item-left" @click="openGoodsDetailFromAdd(g.id)">
                <el-image :src="g.main_photo || ''" fit="cover" class="add-thumb">
                  <template #error><div class="placeholder-img"></div></template>
                </el-image>
                <div class="add-info">
                  <div class="add-name">{{ g.name }}</div>
                  <div class="add-tags">
                    <el-tag size="small" type="info" effect="plain">{{ g.ip.name }}</el-tag>
                  </div>
                </div>
              </div>
              <el-button
                type="primary"
                size="small"
                circle
                class="btn-icon-only"
                :loading="showcaseStore.mutating"
                @click="handleAddToShowcase(g.id)"
              >
                <el-icon><Plus /></el-icon>
              </el-button>
            </div>
          </div>

          <div class="pager-container">
            <el-pagination
              v-if="addPagination.count > 0"
              v-model:current-page="addPagination.page"
              :page-size="addPagination.page_size"
              :total="addPagination.count"
              layout="prev, next"
              small
              @current-change="fetchAddGoods"
            />
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Search,
  Delete,
  Top,
  Bottom,
  MoreFilled,
  ArrowRight,
  ArrowLeft,
  Collection,
  Picture,
  Goods,
} from '@element-plus/icons-vue'
import GoodsCard from '@/components/GoodsCard.vue'
import GoodsDrawer from '@/components/GoodsDrawer.vue'
import { useShowcaseStore } from '@/stores/showcase'
import { getGoodsList } from '@/api/goods'
import type { GoodsListItem, PaginatedResponse } from '@/api/types'

const isMobile = ref(window.innerWidth < 768)
const handleResize = () => {
  isMobile.value = window.innerWidth < 768
}
onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))

const showcaseStore = useShowcaseStore()

const showCurrentPage = computed({
  get: () => showcaseStore.pagination.page,
  set: (val) => {
    showcaseStore.fetchList({ page: val, page_size: showcaseStore.pagination.page_size })
  },
})
const showcaseCurrentPage = showCurrentPage

const backToList = () => {
  showcaseStore.activeShowcaseId = null
}

const goodsDrawerVisible = ref(false)
const selectedGoodsId = ref<string>('')
const handleOpenGoodsDetail = (goods: GoodsListItem) => {
  selectedGoodsId.value = goods.id
  goodsDrawerVisible.value = true
}
const openGoodsDetailFromAdd = (id: string) => {
  selectedGoodsId.value = id
  goodsDrawerVisible.value = true
}
const noop = () => {}

const showcaseDialogVisible = ref(false)
const showcaseDialogMode = ref<'create' | 'edit'>('create')
const showcaseForm = reactive<{ id?: string; name: string; description: string; is_public: boolean }>({
  name: '',
  description: '',
  is_public: true,
})
const showcaseDialogTitle = computed(() => (showcaseDialogMode.value === 'create' ? '新建展柜' : '编辑展柜'))

const openCreateShowcase = () => {
  showcaseDialogMode.value = 'create'
  Object.assign(showcaseForm, { id: undefined, name: '', description: '', is_public: true })
  showcaseDialogVisible.value = true
}
const openEditShowcase = () => {
  if (!showcaseStore.activeShowcase) return
  showcaseDialogMode.value = 'edit'
  const { id, name, description, is_public } = showcaseStore.activeShowcase
  Object.assign(showcaseForm, { id, name, description: description || '', is_public: is_public ?? true })
  showcaseDialogVisible.value = true
}

const submitShowcase = async () => {
  if (!showcaseForm.name.trim()) return ElMessage.warning('请输入展柜名称')
  const payload = {
    name: showcaseForm.name.trim(),
    description: showcaseForm.description?.trim() || null,
    is_public: showcaseForm.is_public,
  }
  let success = false
  if (showcaseDialogMode.value === 'create') {
    const created = await showcaseStore.createOne(payload)
    success = !!created
  } else {
    if (showcaseForm.id) {
      const updated = await showcaseStore.updateOne(showcaseForm.id, payload)
      success = !!updated
    }
  }
  if (success) {
    ElMessage.success(showcaseDialogMode.value === 'create' ? '展柜已创建' : '展柜已更新')
    showcaseDialogVisible.value = false
  }
}

const handleDeleteShowcase = async () => {
  if (!showcaseStore.activeShowcaseId) return
  try {
    await ElMessageBox.confirm('确认删除该展柜吗？里面的谷子不会被删除，仅解除关联。', '删除警告', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
    })
    const ok = await showcaseStore.removeOne(showcaseStore.activeShowcaseId)
    if (ok) {
      ElMessage.success('已删除')
      if (isMobile.value) backToList()
    }
  } catch {
    /* ignore */
  }
}

const handleSelectShowcase = async (id: string) => {
  await showcaseStore.setActive(id)
}

const addDrawerVisible = ref(false)
const addSearch = ref('')
const addLoading = ref(false)
const addError = ref<string | null>(null)
const addList = ref<GoodsListItem[]>([])
const addPagination = reactive<PaginatedResponse<GoodsListItem>>({
  count: 0,
  page: 1,
  page_size: 10,
  next: null,
  previous: null,
  results: [],
})

const openAddGoods = async () => {
  addDrawerVisible.value = true
  addSearch.value = ''
  await fetchAddGoods(1)
}

const fetchAddGoods = async (page: number) => {
  addLoading.value = true
  addError.value = null
  try {
    const data = await getGoodsList({
      search: addSearch.value?.trim() || undefined,
      page,
      page_size: addPagination.page_size,
    })
    Object.assign(addPagination, data)
    addList.value = data.results
  } catch (e: unknown) {
    const err = e as { message?: string }
    addError.value = err?.message || '加载失败'
  } finally {
    addLoading.value = false
  }
}

const handleAddToShowcase = async (goodsId: string) => {
  const showcaseId = showcaseStore.activeShowcaseId
  if (!showcaseId) return
  const created = await showcaseStore.addGoods({ showcaseId, goodsId })
  if (created) ElMessage.success('已加入展柜')
  else if (showcaseStore.mutationStatus === 400) ElMessage.info(showcaseStore.mutationMessage || '该谷子已在展柜中')
}

const handleRemoveFromShowcase = async (goodsId: string) => {
  const showcaseId = showcaseStore.activeShowcaseId
  if (!showcaseId) return
  const ok = await showcaseStore.removeGoods({ showcaseId, goodsId })
  if (ok) ElMessage.success('已移除')
}

const findInList = (goodsId: string) => {
  const items = showcaseStore.sortedShowcaseGoods
  const index = items.findIndex((x) => x.goods.id === goodsId)
  return index > -1 ? { items, index } : null
}
const isFirst = (id: string) => {
  const f = findInList(id)
  return f ? f.index === 0 : true
}
const isLast = (id: string) => {
  const f = findInList(id)
  return f ? f.index >= f.items.length - 1 : true
}

const moveUp = async (goodsId: string) => {
  const showcaseId = showcaseStore.activeShowcaseId
  const found = findInList(goodsId)
  if (!showcaseId || !found || found.index === 0) return
  const prev = found.items[found.index - 1]
  if (!prev) return
  await showcaseStore.moveGoods(showcaseId, {
    goods_id: goodsId,
    anchor_goods_id: prev.goods.id,
    position: 'before',
  })
}

const moveDown = async (goodsId: string) => {
  const showcaseId = showcaseStore.activeShowcaseId
  const found = findInList(goodsId)
  if (!showcaseId || !found || found.index >= found.items.length - 1) return
  const next = found.items[found.index + 1]
  if (!next) return
  await showcaseStore.moveGoods(showcaseId, {
    goods_id: goodsId,
    anchor_goods_id: next.goods.id,
    position: 'after',
  })
}

onMounted(async () => {
  await showcaseStore.fetchList()
  if (showcaseStore.activeShowcaseId) {
    await showcaseStore.fetchDetail(showcaseStore.activeShowcaseId)
  }
})
</script>

<style scoped>
.showcase-manager {
  --c-brand: #d4af37;
  --c-brand-light: rgba(212, 175, 55, 0.1);
  --c-accent: #a29bfe;
  --c-accent-hover: #8e86fa;
  --c-bg: #f5f5f7;
  --c-text-main: #2c3e50;
  --c-text-sub: #909399;
  --radius-lg: 16px;
  --radius-md: 12px;

  /*
   * 优化后的阴影系统（更“悬浮”、更“柔和”）：
   * - 大模糊 + 负扩散（negative spread）收缩阴影，消除边缘生硬感
   * - 多层叠加形成弥散云端质感
   */
  --shadow-float:
    0 10px 40px -10px rgba(0, 0, 0, 0.08),
    0 2px 10px -2px rgba(0, 0, 0, 0.04);

  /* 更通透的玻璃边框色，减少黑边感 */
  --c-border-glass: rgba(255, 255, 255, 0.6);
  --glass-bg: rgba(255, 255, 255, 0.85);

  width: 100%;
  min-height: calc(100vh - 80px);
  position: relative;
  /* 只允许垂直滚动，禁止横向滚动避免底部滑动条 */
  overflow-x: hidden;
  overflow-y: auto;
  font-family: 'PingFang SC', 'Helvetica Neue', sans-serif;
}

.bg-decoration {
  position: absolute;
  top: -50%;
  right: -20%;
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, rgba(162, 155, 254, 0.15) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  padding: 10px;
  position: relative;
  z-index: 1;
}

.panel-container {
  display: flex;
  flex-direction: column;
  align-self: flex-start;
}

.left-panel {
  width: 340px;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.right-panel {
  flex: 1;
  min-width: 0;
}

.glass-card {
  /* 核心布局 */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 确保内容不溢出圆角 */

  /* 视觉样式 */
  border-radius: var(--radius-lg);
  border: 1px solid var(--c-border-glass);

  /* 背景与毛玻璃 */
  background: var(--glass-bg);
  backdrop-filter: blur(16px); /* 稍微增加模糊度提升质感 */
  -webkit-backdrop-filter: blur(16px);

  /* 关键优化：背景裁切，防止背景色溢出圆角造成直角伪影 */
  background-clip: padding-box;

  /* 应用优化后的柔和阴影 */
  box-shadow: var(--shadow-float);

  /* 消除可能的渲染层级问题 */
  transform: translateZ(0);
}

/* Element Plus Card：隐藏组件自带边框，避免与玻璃边框叠加 */
:deep(.el-card) {
  border: none;
}

/* 桌面端：内容少时缩短，内容多时最大高度 + 内部滚动 */
.adaptive-card {
  height: fit-content;
  max-height: calc(100vh - 100px);
}

:deep(.el-card__body) {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  padding: 0;
  display: flex;
  flex-direction: column;
}
:deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

/* 更轻盈的 Header 分割线（覆盖默认值） */
::deep(.el-card__header) {
  padding: 18px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
/* Header 轻分割线（最终覆盖，避免旧值残留） */
::deep(.el-card__header) {
  padding: 18px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--c-text-main);
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-accent {
  background-color: var(--c-accent);
  border-color: var(--c-accent);
  color: #fff;
}
.btn-accent:hover {
  background-color: var(--c-accent-hover);
  border-color: var(--c-accent-hover);
}

.scroll-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
.scroll-content::-webkit-scrollbar {
  width: 6px;
}
.scroll-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.state-box {
  padding: 12px 0;
}
.state-box.empty {
  padding: 24px 0;
}

.showcase-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.showcase-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s ease;
}
.showcase-item:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
.showcase-item.active {
  border-color: var(--c-brand);
  background: linear-gradient(to right, rgba(212, 175, 55, 0.05), rgba(162, 155, 254, 0.05));
}
.showcase-cover {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f0f0f0;
  border: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}
.cover-img {
  width: 100%;
  height: 100%;
}
.cover-placeholder {
  color: #ccc;
  font-size: 20px;
}
.showcase-info {
  flex: 1;
  margin-left: 12px;
  min-width: 0;
}
.showcase-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text-main);
}
.showcase-desc {
  font-size: 12px;
  color: var(--c-text-sub);
  margin-top: 4px;
}
.active-icon {
  color: var(--c-brand);
  font-size: 16px;
  margin-left: 8px;
}
.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pager-container {
  display: flex;
  justify-content: center;
  padding: 10px 0 0;
}

.detail-header .header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.detail-empty-state {
  padding: 24px 0;
}
.detail-loading {
  padding: 16px;
}
.detail-info-banner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 8px 0;
  gap: 20px;
}
.detail-name {
  font-size: 24px;
  color: var(--c-text-main);
  margin: 0;
  font-weight: 800;
}
.detail-desc {
  color: var(--c-text-sub);
  font-size: 14px;
  margin: 8px 0;
  line-height: 1.5;
}
.custom-divider {
  margin: 20px 0;
  border-color: rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  align-items: baseline;
  margin-bottom: 16px;
}
.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--c-text-main);
}
.section-count {
  margin-left: 8px;
  font-size: 13px;
  color: var(--c-text-sub);
}
.goods-empty {
  padding: 16px 0;
}

.goods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}
.goods-wrapper {
  position: relative;
  transition: transform 0.2s;
}
.goods-wrapper:hover {
  transform: translateY(-4px);
  z-index: 2;
}
.goods-control {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  opacity: 0;
  transition: opacity 0.2s;
  cursor: pointer;
}
.goods-wrapper:hover .goods-control {
  opacity: 1;
}
@media (hover: none) {
  .goods-control {
    opacity: 1;
    background: rgba(255, 255, 255, 0.7);
  }
}

.text-danger {
  color: #f56c6c;
}

.add-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.search-bar {
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
.search-results {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
.add-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.add-item-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
}
.add-item-left {
  display: flex;
  gap: 10px;
  align-items: center;
  flex: 1;
  cursor: pointer;
}
.add-thumb {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: #fafafa;
  flex-shrink: 0;
}
.placeholder-img {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.12), rgba(162, 155, 254, 0.12));
}
.add-info {
  min-width: 0;
}
.add-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.add-tags {
  margin-top: 4px;
}
.btn-icon-only {
  width: 32px;
  height: 32px;
  background: var(--c-accent);
  border-color: var(--c-accent);
}

.switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

@media (max-width: 768px) {
  .showcase-manager {
    min-height: calc(100vh - 50px);
    height: calc(100vh - 50px);
  }
  .layout {
    gap: 0;
    padding: 0;
    display: block;
    height: 100%;
  }

  .left-panel,
  .right-panel {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    align-self: unset;
  }

  .panel-container {
    height: 100%;
  }

  .glass-card {
    border-radius: 0;
    border: none;
    box-shadow: none;
  }

  /* 移动端恢复卡片填满可用高度 */
  .adaptive-card {
    height: 100%;
    max-height: none;
  }

  .detail-info-banner {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .add-goods-btn {
    width: 100%;
  }

  .goods-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .right-panel {
    z-index: 10;
    background: var(--c-bg);
  }
}
</style>

