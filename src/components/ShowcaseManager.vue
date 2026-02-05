<template>
  <div class="showcase-manager">
    <!-- 背景装饰 -->
    <div class="bg-decoration"></div>

    <div class="layout single-page">
      <!-- 列表 / 详情页切换过渡 -->
      <Transition name="detail-fade" mode="out-in">
        <!-- 列表页 -->
        <div v-if="viewMode === 'list'" key="list" class="panel-container full-panel">
          <el-card shadow="never" class="glass-card adaptive-card">
            <template #header>
              <div class="panel-header">
                <div class="header-left">
                  <div class="panel-title">
                    <el-icon><Collection /></el-icon>
                  </div>
                  <el-radio-group v-model="showcaseStore.scope" size="small" @change="handleScopeChange" class="scope-switch">
                    <el-radio-button label="private">我的展柜</el-radio-button>
                    <el-radio-button label="public">公共展柜</el-radio-button>
                  </el-radio-group>
                </div>
                <el-button
                  v-if="showcaseStore.scope === 'private'"
                  type="primary" circle class="btn-accent" @click="openCreateShowcase">
                  <el-icon><Plus /></el-icon>
                </el-button>
              </div>
            </template>

            <div class="scroll-content">
              <ShowcaseListView
                :showcases="showcaseStore.list"
                :loading="showcaseStore.listLoading"
                :error="showcaseStore.error"
                :pagination="{
                  total: showcaseStore.pagination.count,
                  page: showcaseStore.pagination.page,
                  pageSize: showcaseStore.pagination.page_size,
                }"
                :get-preview-photos="showcaseStore.getPreviewPhotos"
                :is-preview-loading="showcaseStore.isPreviewLoading"
                @select="handleEnterShowcaseDetail"
                @context-menu="openShowcaseContextMenu"
                @page-change="handleListPageChange"
              />
            </div>
          </el-card>
        </div>

        <!-- 详情页 -->
        <div v-else key="detail" class="panel-container full-panel">
          <el-card shadow="never" class="glass-card adaptive-card detail-card">
            <div class="scroll-content">
              <ShowcaseDetailView
                :loading="showcaseStore.detailLoading"
                :showcase="showcaseStore.activeShowcase"
                :goods="showcaseStore.sortedShowcaseGoods"
                @back="backToList"
                @add-goods="openAddGoods"
                @open-goods="handleOpenGoodsDetail"
                @goods-context-menu="openGoodsContextMenu"
                @goods-context-menu-from-dom="openGoodsContextMenuFromDom"
              />
            </div>
          </el-card>
        </div>
      </Transition>
    </div>

    <!-- 右键菜单（谷子/展柜共用遮罩） -->
    <div v-if="contextMenu.visible" class="context-menu-overlay" @click="closeContextMenu" @contextmenu.prevent>
      <div
        class="context-menu"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
        @click.stop
        @contextmenu.prevent
      >
        <!-- 谷子卡片右键菜单 -->
        <template v-if="contextMenu.type === 'goods'">
          <div class="context-menu-item" :class="{ 'is-disabled': isFirst(contextMenu.goodsId!) }" @click="ctxMoveUp">
            <el-icon class="context-menu-icon"><Top /></el-icon>
            上移
          </div>
          <div class="context-menu-item" :class="{ 'is-disabled': isLast(contextMenu.goodsId!) }" @click="ctxMoveDown">
            <el-icon class="context-menu-icon"><Bottom /></el-icon>
            下移
          </div>
          <div class="context-menu-item context-menu-item-danger" @click="ctxRemoveFromShowcase">
            <el-icon class="context-menu-icon"><Delete /></el-icon>
            移除
          </div>
        </template>

        <!-- 左侧展柜右键菜单 -->
        <template v-else-if="contextMenu.type === 'showcase'">
          <div class="context-menu-item" @click="ctxEditShowcase">
            <el-icon class="context-menu-icon"><Edit /></el-icon>
            编辑
          </div>
          <div class="context-menu-item context-menu-item-danger" @click="ctxDeleteShowcase">
            <el-icon class="context-menu-icon"><Delete /></el-icon>
            删除
          </div>
        </template>
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
        <el-form-item label="封面图片（可选）">
          <el-upload
            v-model:file-list="showcaseCoverFileList"
            list-type="picture-card"
            :auto-upload="false"
            :limit="1"
            :on-change="handleCoverChange"
            :on-remove="handleCoverRemove"
            :http-request="dummyUpload"
            accept="image/*"
            :class="{ 'hide-upload-trigger': showcaseCoverFileList.length >= 1 }"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div class="cover-tip">建议使用 1:1 或 4:3 比例图片；大小不限，后端会自动压缩到合适体积。</div>
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
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox, type UploadFile } from 'element-plus'
import {
  Plus,
  Search,
  Delete,
  Edit,
  Top,
  Bottom,
  ArrowRight,
  ArrowLeft,
  Collection,
  Picture,
  Goods,
} from '@element-plus/icons-vue'
import GoodsCard from '@/components/GoodsCard.vue'
import GoodsDrawer from '@/components/GoodsDrawer.vue'
import ShowcaseListView from '@/components/showcase/ShowcaseListView.vue'
import ShowcaseDetailView from '@/components/showcase/ShowcaseDetailView.vue'
import { useShowcaseStore } from '@/stores/showcase'
import { getGoodsList } from '@/api/goods'
import { uploadShowcaseCoverImage } from '@/api/showcase'
import type { GoodsListItem, PaginatedResponse } from '@/api/types'

const isMobile = ref(window.innerWidth < 768)
const handleResize = () => {
  isMobile.value = window.innerWidth < 768
}
onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))

const showcaseStore = useShowcaseStore()
const viewMode = ref<'list' | 'detail'>('list')

const showCurrentPage = computed({
  get: () => showcaseStore.pagination.page,
  set: (val) => {
    showcaseStore.fetchList({ page: val, page_size: showcaseStore.pagination.page_size })
  },
})
const showcaseCurrentPage = showCurrentPage
const handleListPageChange = (page: number) => {
  // computed ref 在 template 里有自动解包，但这里显式写，避免歧义
  showcaseCurrentPage.value = page
}

const handleScopeChange = async () => {
  showcaseStore.pagination.page = 1
  showcaseStore.error = null
  showcaseStore.activeShowcaseId = null
  showcaseStore.activeShowcase = null
  await showcaseStore.fetchList({ page: 1 })
}

const backToList = async () => {
  // 先清空当前选中的展柜
  showcaseStore.activeShowcaseId = null
  showcaseStore.activeShowcase = null
  // 返回「我的展柜」列表时，强制刷新一次列表数据
  await showcaseStore.fetchList({
    page: showcaseStore.pagination.page,
    page_size: showcaseStore.pagination.page_size,
  })
  viewMode.value = 'list'
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

const contextMenu = reactive<{
  visible: boolean
  type: 'goods' | 'showcase' | null
  x: number
  y: number
  goodsId: string | null
  showcaseId: string | null
}>({
  visible: false,
  type: null,
  x: 0,
  y: 0,
  goodsId: null,
  showcaseId: null,
})

const clampMenuPosition = (x: number, y: number) => {
  // 估一个菜单尺寸，避免贴边溢出（不要求精确）
  const w = 180
  const h = 140
  const maxX = Math.max(8, window.innerWidth - w - 8)
  const maxY = Math.max(8, window.innerHeight - h - 8)
  return { x: Math.min(Math.max(8, x), maxX), y: Math.min(Math.max(8, y), maxY) }
}

const closeContextMenu = () => {
  contextMenu.visible = false
  contextMenu.type = null
  contextMenu.goodsId = null
  contextMenu.showcaseId = null
}

const openGoodsContextMenu = (payload: { goods: GoodsListItem; x: number; y: number }) => {
  const pos = clampMenuPosition(payload.x, payload.y)
  contextMenu.visible = true
  contextMenu.type = 'goods'
  contextMenu.x = pos.x
  contextMenu.y = pos.y
  contextMenu.goodsId = payload.goods.id
  contextMenu.showcaseId = null
}

const openGoodsContextMenuFromDom = (goodsId: string, event: MouseEvent) => {
  const pos = clampMenuPosition(event.clientX, event.clientY)
  contextMenu.visible = true
  contextMenu.type = 'goods'
  contextMenu.x = pos.x
  contextMenu.y = pos.y
  contextMenu.goodsId = goodsId
  contextMenu.showcaseId = null
}

const openShowcaseContextMenu = (showcaseId: string, event: MouseEvent) => {
  const pos = clampMenuPosition(event.clientX, event.clientY)
  contextMenu.visible = true
  contextMenu.type = 'showcase'
  contextMenu.x = pos.x
  contextMenu.y = pos.y
  contextMenu.showcaseId = showcaseId
  contextMenu.goodsId = null
}

const showcaseDialogVisible = ref(false)
const showcaseDialogMode = ref<'create' | 'edit'>('create')
const showcaseForm = reactive<{ id?: string; name: string; description: string; is_public: boolean }>({
  name: '',
  description: '',
  is_public: true,
})
const showcaseDialogTitle = computed(() => (showcaseDialogMode.value === 'create' ? '新建展柜' : '编辑展柜'))

// 展柜封面本地状态
const showcaseCoverFile = ref<File | null>(null)
const showcaseCoverFileList = ref<UploadFile[]>([])

const resetShowcaseCoverState = () => {
  showcaseCoverFile.value = null
  showcaseCoverFileList.value = []
}

const dummyUpload = () => Promise.resolve()

const handleCoverChange = (file: UploadFile, fileList: UploadFile[]) => {
  if (file.raw) {
    showcaseCoverFile.value = file.raw
    // 仅保留一条记录，使用当前选择的文件作为预览
    showcaseCoverFileList.value = [
      {
        name: file.name || 'cover_image',
        url: file.url,
        status: 'success',
      } as UploadFile,
    ]
  } else {
    showcaseCoverFile.value = null
    showcaseCoverFileList.value = []
  }
}

const handleCoverRemove = () => {
  showcaseCoverFile.value = null
  showcaseCoverFileList.value = []
}

const openCreateShowcase = () => {
  showcaseDialogMode.value = 'create'
  Object.assign(showcaseForm, { id: undefined, name: '', description: '', is_public: true })
  showcaseDialogVisible.value = true
  resetShowcaseCoverState()
}
const openEditShowcase = () => {
  if (!showcaseStore.activeShowcase) return
  showcaseDialogMode.value = 'edit'
  const { id, name, description, is_public } = showcaseStore.activeShowcase
  Object.assign(showcaseForm, { id, name, description: description || '', is_public: is_public ?? true })
  showcaseDialogVisible.value = true
  // 预填现有封面预览（不把远端封面当作待上传文件，仅做展示）
  if (showcaseStore.activeShowcase.cover_image) {
    showcaseCoverFile.value = null
    showcaseCoverFileList.value = [
      {
        name: 'current_cover',
        url: showcaseStore.activeShowcase.cover_image,
        status: 'success',
      } as UploadFile,
    ]
  } else {
    resetShowcaseCoverState()
  }
}

const submitShowcase = async () => {
  if (!showcaseForm.name.trim()) return ElMessage.warning('请输入展柜名称')
  const payload = {
    name: showcaseForm.name.trim(),
    description: showcaseForm.description?.trim() || null,
    is_public: showcaseForm.is_public,
  }
  let success = false
  let targetId: string | undefined
  if (showcaseDialogMode.value === 'create') {
    const created = await showcaseStore.createOne(payload)
    success = !!created
    if (created) {
      targetId = created.id
    }
  } else {
    if (showcaseForm.id) {
      const updated = await showcaseStore.updateOne(showcaseForm.id, payload)
      success = !!updated
      if (updated) {
        targetId = updated.id
      }
    }
  }
  if (success) {
    // 如有选择新的封面文件，调用封面上传 / 更新接口
    if (targetId && showcaseCoverFile.value) {
      try {
        await uploadShowcaseCoverImage(targetId, showcaseCoverFile.value)
        // 上传封面后刷新当前展柜详情和列表，保证左侧缩略图与详情封面同步
        await Promise.all([
          showcaseStore.fetchDetail(targetId),
          showcaseStore.fetchList({ page: showcaseStore.pagination.page, page_size: showcaseStore.pagination.page_size }),
        ])
      } catch (err: any) {
        ElMessage.error('封面上传失败：' + (err?.message || '未知错误'))
      }
    }
    ElMessage.success(showcaseDialogMode.value === 'create' ? '展柜已创建' : '展柜已更新')
    showcaseDialogVisible.value = false
    // 提交完成后清理本地封面选择状态
    resetShowcaseCoverState()
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

const handleDeleteShowcaseById = async (id: string) => {
  try {
    await ElMessageBox.confirm('确认删除该展柜吗？里面的谷子不会被删除，仅解除关联。', '删除警告', {
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
    })
    const ok = await showcaseStore.removeOne(id)
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

const handleEnterShowcaseDetail = async (id: string) => {
  await handleSelectShowcase(id)
  viewMode.value = 'detail'
}

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

const ctxMoveUp = async () => {
  const id = contextMenu.goodsId
  if (!id || isFirst(id)) return
  closeContextMenu()
  await moveUp(id)
}
const ctxMoveDown = async () => {
  const id = contextMenu.goodsId
  if (!id || isLast(id)) return
  closeContextMenu()
  await moveDown(id)
}
const ctxRemoveFromShowcase = async () => {
  const id = contextMenu.goodsId
  if (!id) return
  closeContextMenu()
  await handleRemoveFromShowcase(id)
}

const ctxEditShowcase = async () => {
  const id = contextMenu.showcaseId
  if (!id) return
  closeContextMenu()
  await showcaseStore.setActive(id)
  openEditShowcase()
}

const ctxDeleteShowcase = async () => {
  const id = contextMenu.showcaseId
  if (!id) return
  closeContextMenu()
  await handleDeleteShowcaseById(id)
}

onMounted(async () => {
  showcaseStore.activeShowcaseId = null
  showcaseStore.activeShowcase = null
  viewMode.value = 'list'
  await showcaseStore.fetchList()
})

watch(
  () => showcaseStore.list.map((x) => x.id).join(','),
  () => {
    // 列表变更（首次加载/翻页/创建/删除刷新）后拉取预览图（前四张谷子主图）
    showcaseStore.fetchPreviewPhotos(showcaseStore.list.map((x) => x.id))
  },
  { immediate: true },
)
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

.layout.single-page {
  display: block;
}

.panel-container {
  display: flex;
  flex-direction: column;
  align-self: flex-start;
}

.full-panel {
  width: 100%;
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
.panel-header .header-left {
  display: flex;
  align-items: center;
  gap: 16px;
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

/* 列表 / 详情切换过渡动画，参考 CloudShowcase.vue 中 tab-fade */
.detail-fade-enter-active,
.detail-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.detail-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.detail-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
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

/* 右键菜单（复用谷仓风格） */
.context-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: transparent;
}
.context-menu {
  position: fixed;
  min-width: 170px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
  padding: 6px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.context-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 10px;
  cursor: pointer;
  user-select: none;
  font-size: 13px;
  color: var(--c-text-main);
}
.context-menu-icon {
  font-size: 16px;
  color: #606266;
}
.context-menu-item:hover {
  background: rgba(162, 155, 254, 0.12);
}
.context-menu-item.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.context-menu-item.is-disabled:hover {
  background: transparent;
}
.context-menu-item-danger {
  color: #f56c6c;
}
.context-menu-item-danger .context-menu-icon {
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

/* 选中一张封面后隐藏新增按钮（只保留已选卡片） */
.hide-upload-trigger :deep(.el-upload--picture-card) {
  display: none;
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
  .right-panel,
  .full-panel {
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

