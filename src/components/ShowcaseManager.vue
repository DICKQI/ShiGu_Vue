<template>
  <div class="showcase-manager">
    <div class="layout">
      <!-- 左侧：展柜列表 -->
      <el-card shadow="hover" class="panel panel-left">
        <template #header>
          <div class="panel-header">
            <div class="panel-title">展柜列表</div>
            <div class="panel-actions">
              <el-button type="primary" size="small" @click="openCreateShowcase">
                新建
              </el-button>
            </div>
          </div>
        </template>

        <div v-if="showcaseStore.error" class="panel-error">
          <el-alert :title="showcaseStore.error" type="error" :closable="false" />
        </div>

        <div v-else-if="showcaseStore.listLoading && showcaseStore.list.length === 0" class="panel-loading">
          <el-skeleton :rows="6" animated />
        </div>

        <div v-else-if="showcaseStore.list.length === 0" class="panel-empty">
          <el-empty description="暂无展柜，先新建一个吧" />
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
              >
                <template #error>
                  <div class="cover-placeholder"></div>
                </template>
              </el-image>
              <div v-else class="cover-placeholder"></div>
            </div>
            <div class="showcase-meta">
              <div class="showcase-name" :title="s.name">{{ s.name }}</div>
              <div class="showcase-desc">{{ s.description || '—' }}</div>
            </div>
          </div>

          <div class="pager">
            <el-pagination
              v-if="showcaseStore.pagination.count > 0"
              v-model:current-page="showcaseCurrentPage"
              :page-size="showcaseStore.pagination.page_size"
              :total="showcaseStore.pagination.count"
              layout="prev, pager, next"
            />
          </div>
        </div>
      </el-card>

      <!-- 右侧：展柜详情 -->
      <el-card shadow="hover" class="panel panel-right">
        <template #header>
          <div class="panel-header">
            <div class="panel-title">展柜详情</div>
            <div class="panel-actions">
              <el-button
                size="small"
                :disabled="!showcaseStore.activeShowcaseId"
                @click="openEditShowcase"
              >
                编辑
              </el-button>
              <el-button
                size="small"
                type="danger"
                plain
                :disabled="!showcaseStore.activeShowcaseId"
                @click="handleDeleteShowcase"
              >
                删除
              </el-button>
            </div>
          </div>
        </template>

        <div v-if="!showcaseStore.activeShowcaseId" class="detail-empty">
          <el-empty description="请选择左侧一个展柜" />
        </div>

        <div
          v-else-if="showcaseStore.detailLoading && !showcaseStore.activeShowcase"
          class="panel-loading"
        >
          <el-skeleton :rows="10" animated />
        </div>

        <div v-else-if="showcaseStore.activeShowcase" class="detail">
          <div class="detail-head">
            <div class="detail-head-left">
              <div class="detail-name">{{ showcaseStore.activeShowcase.name }}</div>
              <div class="detail-desc">
                {{ showcaseStore.activeShowcase.description || '暂无描述' }}
              </div>
            </div>
            <div class="detail-head-right">
              <el-button type="primary" size="small" @click="openAddGoods">
                添加谷子
              </el-button>
            </div>
          </div>

          <el-divider />

          <!-- 展柜谷子（不分分类） -->
          <div class="category-section">
            <div class="category-block">
              <div class="category-head">
                <div class="category-title">
                  展柜内谷子
                  <span class="category-sub">({{ showcaseStore.sortedShowcaseGoods.length }})</span>
                </div>
              </div>

              <div v-if="showcaseStore.sortedShowcaseGoods.length === 0" class="category-empty">
                <el-empty description="该展柜暂无谷子" />
              </div>

              <div v-else class="goods-grid">
                <div
                  v-for="item in showcaseStore.sortedShowcaseGoods"
                  :key="item.id"
                  class="goods-item"
                >
                  <GoodsCard :goods="item.goods" @click="handleOpenGoodsDetail" @location-click="noop" @context-menu="noop" />
                  <div class="goods-actions">
                    <el-button-group>
                      <el-button size="small" @click="moveUp(item.goods.id)">上移</el-button>
                      <el-button size="small" @click="moveDown(item.goods.id)">下移</el-button>
                      <el-button size="small" type="danger" plain @click="handleRemoveFromShowcase(item.goods.id)">
                        移除
                      </el-button>
                    </el-button-group>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 谷子详情抽屉（复用现有） -->
    <GoodsDrawer v-model="goodsDrawerVisible" :goods-id="selectedGoodsId" />

    <!-- 新建/编辑展柜 -->
    <el-dialog v-model="showcaseDialogVisible" :title="showcaseDialogTitle" width="460px">
      <el-form :model="showcaseForm" label-width="90px">
        <el-form-item label="名称">
          <el-input v-model="showcaseForm.name" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="showcaseForm.description" type="textarea" :rows="3" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="公开">
          <el-switch v-model="showcaseForm.is_public" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showcaseDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="showcaseStore.mutating" @click="submitShowcase">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 从谷仓添加 -->
    <el-drawer v-model="addDrawerVisible" title="从谷仓添加谷子" direction="rtl" size="420px">
      <div class="add-drawer">
        <div class="add-toolbar">
          <el-input v-model="addSearch" placeholder="按名称/IP/关键词搜索（search）" clearable @keyup.enter="fetchAddGoods(1)" />
          <el-button type="primary" :loading="addLoading" @click="fetchAddGoods(1)">搜索</el-button>
        </div>

        <div class="add-hint">
          勾选后点击“加入展柜”。（一次加入一条，避免误操作；后续可扩展批量）
        </div>

        <div v-if="addError" class="panel-error">
          <el-alert :title="addError" type="error" :closable="false" />
        </div>

        <div v-else-if="addLoading && addList.length === 0" class="panel-loading">
          <el-skeleton :rows="8" animated />
        </div>

        <div v-else-if="addList.length === 0" class="panel-empty">
          <el-empty description="暂无结果" />
        </div>

        <div v-else class="add-list">
          <div v-for="g in addList" :key="g.id" class="add-item">
            <div class="add-item-main" @click="openGoodsDetailFromAdd(g.id)">
              <el-image v-if="g.main_photo" :src="g.main_photo" fit="cover" class="add-thumb" />
              <div v-else class="add-thumb placeholder"></div>
              <div class="add-meta">
                <div class="add-name">{{ g.name }}</div>
                <div class="add-sub">{{ g.ip.name }} · {{ g.characters.map(c => c.name).join('、') }}</div>
              </div>
            </div>

            <div class="add-item-actions">
              <el-button
                type="primary"
                size="small"
                :loading="showcaseStore.mutating"
                @click="handleAddToShowcase(g.id)"
              >
                加入展柜
              </el-button>
            </div>
          </div>

          <div class="pager">
            <el-pagination
              v-if="addPagination.count > 0"
              v-model:current-page="addPagination.page"
              :page-size="addPagination.page_size"
              :total="addPagination.count"
              layout="prev, pager, next"
              @current-change="fetchAddGoods"
            />
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import GoodsCard from '@/components/GoodsCard.vue'
import GoodsDrawer from '@/components/GoodsDrawer.vue'
import { useShowcaseStore } from '@/stores/showcase'
import { getGoodsList } from '@/api/goods'
import type { GoodsListItem, PaginatedResponse, ShowcaseGoods } from '@/api/types'

const showcaseStore = useShowcaseStore()

const showCurrentPage = computed({
  get: () => showcaseStore.pagination.page,
  set: (val) => {
    showcaseStore.fetchList({ page: val, page_size: showcaseStore.pagination.page_size })
  },
})

const showcaseCurrentPage = showCurrentPage

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

// 展柜 dialog
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
  showcaseForm.id = undefined
  showcaseForm.name = ''
  showcaseForm.description = ''
  showcaseForm.is_public = true
  showcaseDialogVisible.value = true
}

const openEditShowcase = () => {
  if (!showcaseStore.activeShowcase) return
  showcaseDialogMode.value = 'edit'
  showcaseForm.id = showcaseStore.activeShowcase.id
  showcaseForm.name = showcaseStore.activeShowcase.name
  showcaseForm.description = showcaseStore.activeShowcase.description || ''
  showcaseForm.is_public = showcaseStore.activeShowcase.is_public ?? true
  showcaseDialogVisible.value = true
}

const submitShowcase = async () => {
  if (!showcaseForm.name.trim()) {
    ElMessage.warning('请输入展柜名称')
    return
  }
  if (showcaseDialogMode.value === 'create') {
    const created = await showcaseStore.createOne({
      name: showcaseForm.name.trim(),
      description: showcaseForm.description?.trim() || null,
      is_public: showcaseForm.is_public,
    })
    if (created) {
      ElMessage.success('展柜已创建')
      showcaseDialogVisible.value = false
    }
  } else {
    if (!showcaseForm.id) return
    const updated = await showcaseStore.updateOne(showcaseForm.id, {
      name: showcaseForm.name.trim(),
      description: showcaseForm.description?.trim() || null,
      is_public: showcaseForm.is_public,
    })
    if (updated) {
      ElMessage.success('展柜已更新')
      showcaseDialogVisible.value = false
    }
  }
}

const handleDeleteShowcase = async () => {
  const id = showcaseStore.activeShowcaseId
  if (!id || !showcaseStore.activeShowcase) return
  try {
    await ElMessageBox.confirm(`确认删除展柜「${showcaseStore.activeShowcase.name}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
    const ok = await showcaseStore.removeOne(id)
    if (ok) ElMessage.success('已删除')
  } catch (e: any) {
    if (e === 'cancel' || e === 'close') return
    ElMessage.error('删除失败')
  }
}

const handleSelectShowcase = async (id: string) => {
  await showcaseStore.setActive(id)
}

// 添加抽屉（从谷仓搜索）
const addDrawerVisible = ref(false)
const addSearch = ref('')
const addLoading = ref(false)
const addError = ref<string | null>(null)
const addList = ref<GoodsListItem[]>([])
const addPagination = reactive<PaginatedResponse<GoodsListItem>>({
  count: 0,
  page: 1,
  page_size: 18,
  next: null,
  previous: null,
  results: [],
})

const openAddGoods = async () => {
  addDrawerVisible.value = true
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
    addPagination.count = data.count
    addPagination.page = data.page
    addPagination.page_size = data.page_size
    addPagination.next = data.next
    addPagination.previous = data.previous
    addPagination.results = data.results
    addList.value = data.results
  } catch (e: any) {
    addError.value = e?.message || '加载谷仓数据失败'
    addList.value = []
  } finally {
    addLoading.value = false
  }
}

const handleAddToShowcase = async (goodsId: string) => {
  const showcaseId = showcaseStore.activeShowcaseId
  if (!showcaseId) return
  const created = await showcaseStore.addGoods({
    showcaseId,
    goodsId,
  })
  if (created) {
    ElMessage.success('已加入展柜')
    return
  }
  // 友好提示：避免左侧出现 400 报错字样影响体验
  if (showcaseStore.mutationStatus === 400) {
    ElMessage.info(showcaseStore.mutationMessage || '该谷子已在此展柜中')
  }
}

const handleRemoveFromShowcase = async (goodsId: string) => {
  const showcaseId = showcaseStore.activeShowcaseId
  if (!showcaseId) return
  try {
    await ElMessageBox.confirm('确认从展柜移除该谷子吗？', '移除确认', {
      type: 'warning',
      confirmButtonText: '移除',
      cancelButtonText: '取消',
    })
    const ok = await showcaseStore.removeGoods({ showcaseId, goodsId })
    if (ok) ElMessage.success('已移除')
  } catch (e: any) {
    if (e === 'cancel' || e === 'close') return
    ElMessage.error('移除失败')
  }
}

// 排序：用相邻锚点 before/after 实现
const findInList = (goodsId: string): { items: ShowcaseGoods[]; index: number } | null => {
  const items = showcaseStore.sortedShowcaseGoods
  const index = items.findIndex((x) => x.goods.id === goodsId)
  if (index < 0) return null
  return { items, index }
}

const moveUp = async (goodsId: string) => {
  const showcaseId = showcaseStore.activeShowcaseId
  if (!showcaseId) return
  const found = findInList(goodsId)
  if (!found) return
  if (found.index === 0) {
    ElMessage.info('已经是第一项')
    return
  }
  const anchor = found.items[found.index - 1]
  if (!anchor) return
  await showcaseStore.moveGoods(showcaseId, {
    goods_id: goodsId,
    anchor_goods_id: anchor.goods.id,
    position: 'before',
  })
}

const moveDown = async (goodsId: string) => {
  const showcaseId = showcaseStore.activeShowcaseId
  if (!showcaseId) return
  const found = findInList(goodsId)
  if (!found) return
  if (found.index >= found.items.length - 1) {
    ElMessage.info('已经是最后一项')
    return
  }
  const anchor = found.items[found.index + 1]
  if (!anchor) return
  await showcaseStore.moveGoods(showcaseId, {
    goods_id: goodsId,
    anchor_goods_id: anchor.goods.id,
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
  width: 100%;
}

.layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 16px;
  align-items: start;
}

.panel {
  border-radius: var(--card-radius);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: var(--shadow-sm);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.panel-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-dark);
}

.panel-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.panel-loading,
.panel-error,
.panel-empty {
  padding: 12px 0;
}

.showcase-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.showcase-item {
  display: grid;
  grid-template-columns: 54px 1fr;
  gap: 10px;
  align-items: center;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.showcase-item:hover {
  border-color: rgba(212, 175, 55, 0.6);
  transform: translateY(-1px);
}

.showcase-item.active {
  border-color: var(--primary-gold);
  box-shadow: 0 6px 20px rgba(212, 175, 55, 0.12);
}

.showcase-cover {
  width: 54px;
  height: 54px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(245, 245, 247, 0.9);
}

.cover-img {
  width: 54px;
  height: 54px;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.12), rgba(162, 155, 254, 0.12));
}

.showcase-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.showcase-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.showcase-desc {
  font-size: 12px;
  color: var(--text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pager {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

.detail-empty {
  padding: 24px 0;
}

.detail-head {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: flex-start;
}

.detail-name {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-dark);
}

.detail-desc {
  margin-top: 6px;
  color: var(--text-light);
  font-size: 13px;
  line-height: 1.6;
  max-width: 720px;
}

.category-section {
  font-size: 13px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.category-block {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.65);
}

.category-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.category-title {
  font-size: 14px;
  font-weight: 800;
  color: var(--text-dark);
}

.category-sub {
  font-weight: 600;
  margin-left: 6px;
  color: var(--text-light);
}

.category-actions {
  display: flex;
  gap: 6px;
}

.category-empty {
  padding: 8px 0;
}

.goods-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}

.goods-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.goods-actions {
  display: flex;
  justify-content: flex-end;
}

.add-drawer {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.add-toolbar {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

.add-hint {
  font-size: 12px;
  color: var(--text-light);
}

.add-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.add-item {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.add-item-main {
  display: grid;
  grid-template-columns: 54px 1fr;
  gap: 10px;
  align-items: center;
  cursor: pointer;
}

.add-thumb {
  width: 54px;
  height: 54px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(245, 245, 247, 0.9);
}

.add-thumb.placeholder {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.12), rgba(162, 155, 254, 0.12));
}

.add-meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.add-name {
  font-size: 13px;
  font-weight: 800;
  color: var(--text-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.add-sub {
  font-size: 12px;
  color: var(--text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.add-item-actions {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
}

@media (max-width: 960px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>

