<template>
  <el-drawer
    v-model="visible"
    :direction="drawerDirection"
    :size="drawerSize"
    :with-header="!isMobile"
    :show-close="!isMobile"
    :class="[
      'guzi-detail-drawer', 
      { 'is-mobile': isMobile },
      { 'is-dragging': isDragging } 
    ]"
    @close="handleClose"
    @open="handleOpen"
  >
    <!-- PC端原生Header -->
    <template #header v-if="!isMobile">
      <span class="drawer-title">谷子详情</span>
    </template>

    <div v-if="loading" class="drawer-loading">
      <el-skeleton :rows="10" animated />
    </div>

    <div v-else-if="detail" class="drawer-container">
      <!-- 
        移动端专属头部区域 
        添加 touch 事件监听，实现跟随拖拽
      -->
      <div
        v-if="isMobile"
        class="mobile-header-area"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <div class="handle-indicator"></div>
        <div class="mobile-close-btn" @click.stop="handleMobileClose">
          <el-icon><Close /></el-icon>
        </div>
      </div>

      <!-- 可滚动的内容区域 -->
      <div 
        class="scrollable-content"
        @touchstart="handleContentTouchStart"
        @touchmove="handleContentTouchMove"
        @touchend="handleContentTouchEnd"
      >
        <!-- 图片画廊区域 -->
        <div class="detail-images">
          <div class="main-image-wrapper">
            <el-image
              v-if="detail.main_photo"
              :src="detail.main_photo"
              fit="contain"
              :preview-src-list="allImages"
              class="main-image"
            >
              <template #error>
                <div class="image-placeholder">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </div>

          <div v-if="detail.additional_photos.length > 0" class="additional-images">
            <div
              v-for="(photo, index) in detail.additional_photos"
              :key="photo.id"
              class="additional-image-item"
            >
              <el-image
                :src="photo.image"
                fit="cover"
                :preview-src-list="allImages"
                :initial-index="index + 1"
                class="additional-image"
              >
                <template #error>
                  <div class="image-error">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div v-if="photo.label" class="photo-label">
                {{ photo.label }}
              </div>
            </div>
          </div>
        </div>

        <!-- 详细信息 -->
        <div class="detail-info">
          <div class="header-row">
            <h2 class="detail-title">{{ detail.name }}</h2>
            <el-tag :type="statusTagType" effect="dark" class="status-badge">{{ statusText }}</el-tag>
          </div>

          <div class="info-section">
            <div class="info-card">
              <div class="info-row">
                <span class="info-label">IP作品</span>
                <span class="info-value">{{ detail.ip.name }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">角色</span>
                <div class="info-value">
                  <el-tag
                    v-for="char in detail.characters"
                    :key="char.id"
                    class="character-tag"
                    size="small"
                    :type="char.gender === 'male' ? 'primary' : char.gender === 'female' ? 'danger' : 'info'"
                  >
                    {{ char.name }}
                  </el-tag>
                </div>
              </div>
              <div class="info-row">
                <span class="info-label">品类</span>
                <span class="info-value">{{ detail.category.name }}</span>
              </div>
              <div v-if="detail.theme" class="info-row">
                <span class="info-label">主题</span>
                <span class="info-value">{{ detail.theme.name }}</span>
              </div>
            </div>

            <div class="info-list">
              <div v-if="detail.location_path" class="info-item">
                <span class="info-label">位置</span>
                <span class="info-value location-path">{{ detail.location_path }}</span>
              </div>
              <div v-if="detail.price" class="info-item">
                <span class="info-label">购入价格</span>
                <span class="info-value price">¥ {{ detail.price }}</span>
              </div>
              <div v-if="detail.purchase_date" class="info-item">
                <span class="info-label">入手日期</span>
                <span class="info-value">{{ detail.purchase_date }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">是否官谷</span>
                <el-tag size="small" :type="detail.is_official ? 'success' : 'info'">
                  {{ detail.is_official ? '是' : '否' }}
                </el-tag>
              </div>
              <div class="info-item">
                <span class="info-label">数量</span>
                <span class="info-value">{{ detail.quantity }}</span>
              </div>
            </div>
            
            <div v-if="detail.notes" class="notes-section">
              <span class="info-label">备注</span>
              <div class="info-value notes">{{ detail.notes }}</div>
            </div>
          </div>

          <!-- 相同主题的谷子列表 -->
          <div v-if="detail.theme" class="same-theme-section">
            <el-collapse v-model="sameThemeExpanded" class="same-theme-collapse">
              <el-collapse-item name="same-theme">
                <template #title>
                  <div class="same-theme-title">
                    <el-icon class="theme-icon"><Collection /></el-icon>
                    <span>相同主题的谷子 ({{ sameThemeGoods.length }})</span>
                  </div>
                </template>
                <div v-if="sameThemeLoading" class="same-theme-loading">
                  <el-skeleton :rows="3" animated />
                </div>
                <div v-else-if="sameThemeGoods.length === 0" class="same-theme-empty">
                  <el-empty description="暂无相同主题的谷子" :image-size="80" />
                </div>
                <div v-else class="same-theme-grid">
                  <div
                    v-for="goods in sameThemeGoods"
                    :key="goods.id"
                    class="same-theme-item"
                    @click="handleSameThemeItemClick(goods.id)"
                  >
                    <el-image
                      v-if="goods.main_photo"
                      :src="goods.main_photo"
                      fit="cover"
                      class="same-theme-image"
                    >
                      <template #error>
                        <div class="same-theme-image-placeholder">
                          <el-icon><Picture /></el-icon>
                        </div>
                      </template>
                    </el-image>
                    <div v-else class="same-theme-image-placeholder">
                      <el-icon><Picture /></el-icon>
                    </div>
                    <div class="same-theme-item-name">{{ goods.name }}</div>
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="drawer-error">
      <el-empty description="加载失败" />
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Picture, Close, Collection } from '@element-plus/icons-vue'
import { useGuziStore } from '@/stores/guzi'
import { getGoodsList } from '@/api/goods'
import type { GoodsDetail, GoodsListItem } from '@/api/types'

interface Props {
  modelValue: boolean
  goodsId?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const guziStore = useGuziStore()
const detail = ref<GoodsDetail | null>(null)
const loading = ref(false)
// 添加请求标识，用于防止竞态条件
let currentRequestId: string | null = null

// 相同主题的谷子列表
const sameThemeGoods = ref<GoodsListItem[]>([])
const sameThemeLoading = ref(false)
const sameThemeExpanded = ref<string[]>([])

// --- 移动端状态管理 ---
const isMobile = ref(false)
const isDragging = ref(false) // 是否正在拖拽中
const sheetState = ref<'half' | 'full'>('half') // 当前吸附状态
const currentDrawerHeight = ref<number | string>('65%') // 实时高度

// 触摸相关临时变量
let startY = 0
let startHeight = 0
let windowHeight = 0

// 内容区域触摸相关变量
let contentStartY = 0
let contentScrollTop = 0
let contentScrollHeight = 0
let contentClientHeight = 0
let isContentScrolling = false

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) {
    windowHeight = window.innerHeight
  }
}

const drawerDirection = computed(() => isMobile.value ? 'btt' : 'rtl')

// Drawer Size 核心逻辑
const drawerSize = computed(() => {
  if (!isMobile.value) return '600px'
  // 如果正在拖拽，返回实时计算的像素值（数字）
  // 如果没拖拽，返回预设百分比（字符串）
  return currentDrawerHeight.value
})

const statusText = computed(() => {
  if (!detail.value) return ''
  const map: Record<string, string> = {
    in_cabinet: '在馆',
    outdoor: '出街中',
    sold: '已售出',
  }
  return map[detail.value.status] || detail.value.status
})

const statusTagType = computed(() => {
  if (!detail.value) return ''
  const map: Record<string, string> = {
    in_cabinet: 'success',
    outdoor: 'warning',
    sold: 'info',
  }
  return map[detail.value.status] || ''
})

const allImages = computed(() => {
  if (!detail.value) return []
  const images = detail.value.main_photo ? [detail.value.main_photo] : []
  return images.concat(detail.value.additional_photos.map((p) => p.image))
})

watch(
  () => props.goodsId,
  async (newId, oldId) => {
    // 如果 goodsId 没有真正变化，跳过
    if (newId === oldId) return
    if (newId && visible.value) {
      await loadDetail(newId)
      // 加载相同主题的谷子
      if (detail.value?.theme) {
        await loadSameThemeGoods(detail.value.theme.id, newId)
      }
    }
  },
  { immediate: true }
)

watch(visible, async (newVal) => {
  if (newVal) {
    // 每次打开，重置为半屏状态
    if (isMobile.value) {
      sheetState.value = 'half'
      currentDrawerHeight.value = '65%' 
    }
    // 如果已经有 goodsId，加载详情
    // 注意：这里可能会和 goodsId 的 watch 重复调用，但 loadDetail 内部会有去重处理
    if (props.goodsId) {
      await loadDetail(props.goodsId)
      // 加载相同主题的谷子
      if (detail.value?.theme) {
        await loadSameThemeGoods(detail.value.theme.id, props.goodsId)
      }
    }
  } else {
    // 清除当前请求标识
    currentRequestId = null
    // 延迟清理，避免关闭动画时闪烁
    setTimeout(() => { 
      // 只有在没有新的请求时才清空
      if (!currentRequestId) {
        detail.value = null
        sameThemeGoods.value = []
        sameThemeExpanded.value = []
      }
    }, 300)
  }
})

async function loadDetail(id: string) {
  // 如果正在加载同一个 ID，跳过
  if (currentRequestId === id && loading.value) {
    return
  }
  
  // 设置当前请求标识
  currentRequestId = id
  loading.value = true
  
  try {
    const data = await guziStore.fetchGoodsDetail(id)
    
    // 检查请求是否仍然有效（防止竞态条件）
    if (currentRequestId === id && visible.value) {
      // 如果返回 null，可能是请求失败，但网络是正常的
      // 这种情况下应该保留之前的数据，而不是显示"加载失败"
      if (data) {
        detail.value = data
        // 加载相同主题的谷子
        if (data.theme) {
          await loadSameThemeGoods(data.theme.id, id)
        } else {
          sameThemeGoods.value = []
        }
      } else if (!detail.value) {
        // 只有之前也没有数据时才设置为 null（显示加载失败）
        detail.value = null
        console.warn('获取详情返回 null，但网络请求可能已成功:', id)
      }
      // 如果 data 为 null 但之前有数据，保留之前的数据（不更新）
    }
  } catch (error) {
    // 只有当前请求仍然有效时才处理错误
    if (currentRequestId === id) {
      console.error('加载详情失败:', error)
      // 请求失败时，如果之前有数据，保留之前的数据
      // 如果没有数据，detail.value 保持为 null，会显示"加载失败"
      if (!detail.value) {
        detail.value = null
      }
    }
  } finally {
    // 只有当前请求仍然有效时才重置 loading
    if (currentRequestId === id) {
      loading.value = false
      // 如果请求完成且 Drawer 已关闭，清除标识
      if (!visible.value) {
        currentRequestId = null
      }
    }
  }
}

// 加载相同主题的谷子
async function loadSameThemeGoods(themeId: number, currentGoodsId: string) {
  sameThemeLoading.value = true
  try {
    const response = await getGoodsList({ theme: themeId, page_size: 100 })
    const allGoods = Array.isArray(response) ? response : (response.results || [])
    // 排除当前谷子本身
    sameThemeGoods.value = allGoods.filter(goods => goods.id !== currentGoodsId)
  } catch (error) {
    console.error('加载相同主题的谷子失败:', error)
    sameThemeGoods.value = []
  } finally {
    sameThemeLoading.value = false
  }
}

// 点击相同主题的谷子项
async function handleSameThemeItemClick(goodsId: string) {
  // 直接加载新谷子的详情
  await loadDetail(goodsId)
  // 确保相同主题列表展开
  if (sameThemeExpanded.value.length === 0) {
    sameThemeExpanded.value = ['same-theme']
  }
}

function handleClose() {}
function handleMobileClose() {
  visible.value = false
}
function handleOpen() { checkMobile() }

// ---------------- 核心：移动端跟随拖拽逻辑 ----------------

function handleTouchStart(e: TouchEvent) {
  if (!isMobile.value || !e.touches || e.touches.length === 0) return
  
  isDragging.value = true // 开启拖拽模式（禁用CSS过渡）
  startY = e.touches[0]!.clientY
  windowHeight = window.innerHeight
  
  // 获取当前Drawer的实际像素高度
  // 如果当前是百分比，转化为像素
  if (typeof currentDrawerHeight.value === 'string') {
    const ratio = parseFloat(currentDrawerHeight.value) / 100
    startHeight = windowHeight * ratio
  } else {
    startHeight = currentDrawerHeight.value as number
  }
}

function handleTouchMove(e: TouchEvent) {
  if (!isMobile.value || !isDragging.value || !e.touches || e.touches.length === 0) return
  
  // 阻止浏览器默认滚动（防止下拉刷新等干扰）
  e.preventDefault() 

  const currentY = e.touches[0]!.clientY
  const deltaY = startY - currentY // 向上拖拽 delta 为正，向下为负
  
  // 实时计算新高度
  let newHeight = startHeight + deltaY

  // 限制高度范围：最小 20% (防止拖太低直接没了)，最大 100%
  const minHeight = windowHeight * 0.2
  const maxHeight = windowHeight
  
  if (newHeight > maxHeight) newHeight = maxHeight
  if (newHeight < minHeight) newHeight = minHeight

  currentDrawerHeight.value = newHeight
}

function handleTouchEnd(e: TouchEvent) {
  if (!isMobile.value) return
  isDragging.value = false // 恢复CSS过渡动画
  
  // 最终的高度比例
  const finalHeight = currentDrawerHeight.value as number
  const ratio = finalHeight / windowHeight

  // 阈值判断
  // 1. 如果高度小于 40%，则关闭
  if (ratio < 0.4) {
    visible.value = false
    return
  }

  // 2. 如果高度超过 80%，吸附到全屏
  if (ratio > 0.8) {
    snapTo('full')
  } 
  // 3. 否则吸附到半屏
  else {
    // 细化体验：如果之前是 full，往下拉只要过了 80% 线就回弹到 half
    // 如果之前是 half，往上拉没过 80% 线就回弹到 half
    snapTo('half')
  }
}

// 辅助函数：吸附到指定状态
function snapTo(state: 'half' | 'full') {
  sheetState.value = state
  currentDrawerHeight.value = state === 'half' ? '65%' : '100%'
}

// ---------------- 内容区域触摸事件处理（实现任意位置上滑展开） ----------------

function handleContentTouchStart(e: TouchEvent) {
  if (!isMobile.value || sheetState.value !== 'half') return
  
  if (!e.touches || e.touches.length === 0) return
  
  const touch = e.touches[0]
  if (!touch) return
  
  contentStartY = touch.clientY
  
  // 获取滚动容器的状态
  const scrollContainer = e.currentTarget as HTMLElement
  if (scrollContainer) {
    contentScrollTop = scrollContainer.scrollTop
    contentScrollHeight = scrollContainer.scrollHeight
    contentClientHeight = scrollContainer.clientHeight
    isContentScrolling = false
  }
}

function handleContentTouchMove(e: TouchEvent) {
  if (!isMobile.value || sheetState.value !== 'half') return
  
  if (!e.touches || e.touches.length === 0) return
  
  const touch = e.touches[0]
  if (!touch) return
  
  const currentY = touch.clientY
  const deltaY = contentStartY - currentY // 向上滑动为正
  
  // 判断是否在滚动内容
  const scrollContainer = e.currentTarget as HTMLElement
  if (scrollContainer) {
    const currentScrollTop = scrollContainer.scrollTop
    const canScrollUp = currentScrollTop > 0
    const canScrollDown = currentScrollTop < contentScrollHeight - contentClientHeight
    
    // 如果内容可以滚动，且用户是在滚动内容，则不触发展开
    if (deltaY > 0 && canScrollUp) {
      // 向上滚动内容
      isContentScrolling = true
      return
    }
    if (deltaY < 0 && canScrollDown) {
      // 向下滚动内容
      isContentScrolling = true
      return
    }
    
    // 如果内容已经滚动到顶部，且向上滑动，则触发展开
    if (deltaY > 0 && currentScrollTop === 0 && !isContentScrolling) {
      // 阻止默认滚动行为，准备展开
      e.preventDefault()
      isContentScrolling = false
    }
  }
}

function handleContentTouchEnd(e: TouchEvent) {
  if (!isMobile.value || sheetState.value !== 'half') return
  
  if (!e.changedTouches || e.changedTouches.length === 0) return
  
  // 如果正在滚动内容，不触发展开
  if (isContentScrolling) {
    isContentScrolling = false
    return
  }
  
  const touch = e.changedTouches[0]
  if (!touch) return
  
  const endY = touch.clientY
  const deltaY = contentStartY - endY // 向上滑动为正
  
  // 如果向上滑动超过 50px，展开到全屏
  if (deltaY > 50) {
    snapTo('full')
  }
  
  // 重置状态
  contentStartY = 0
  isContentScrolling = false
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
/* 通用布局 */
.drawer-loading { padding: 20px; }
.drawer-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.scrollable-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 40px;
  /* 在半屏状态下，允许触摸事件响应 */
  touch-action: pan-y;
}

/* ---------------- 头部与图片区域 ---------------- */
.mobile-header-area {
  flex-shrink: 0;
  height: 40px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-bottom: 1px solid transparent;
  cursor: grab;
  z-index: 10;
  /* 关键：防止浏览器默认行为，保证拖拽流畅 */
  touch-action: none; 
}
.mobile-header-area:active { cursor: grabbing; }

.handle-indicator {
  width: 40px;
  height: 4px;
  background-color: #e0e0e0;
  border-radius: 10px;
}

.mobile-close-btn {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #909399;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
}

/* 图片区域 */
.detail-images { margin-bottom: 20px; }

.main-image-wrapper {
  width: 100%;
  height: 400px; /* PC默认 */
  background-color: var(--bg-light-gray, #f7f8fa);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}
.main-image { width: 100%; height: 100%; display: block; }
.image-placeholder { display: flex; align-items: center; justify-content: center; color: #c0c4cc; font-size: 40px; width: 100%; height: 100%; }

/* 移动端覆盖 */
.is-mobile .main-image-wrapper {
  height: 38vh;
  max-height: 450px;
  min-height: 250px;
  margin: 0;
  border-radius: 0; 
  border-bottom: 1px solid #eee;
}

.additional-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
  padding: 0 4px; 
}
.is-mobile .additional-images { 
  padding: 12px 16px 0 16px;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 16px;
}
.additional-image-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.additional-image {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid transparent;
}
.additional-image:hover { border-color: var(--primary-gold, #e6a23c); }
.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
  color: #909399;
}
.photo-label {
  font-size: 12px;
  color: #606266;
  text-align: center;
  line-height: 1.4;
  padding: 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.is-mobile .photo-label {
  font-size: 13px;
  padding: 0 2px;
}

/* ---------------- 信息区域 ---------------- */
.detail-info { padding: 0 8px; }
.is-mobile .detail-info { padding: 20px 16px; }

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}
.detail-title {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
  margin: 0;
  line-height: 1.4;
  flex: 1;
  margin-right: 12px;
}

.info-section { display: flex; flex-direction: column; gap: 16px; }
.info-card {
  background: var(--bg-light-gray, #f9f9f9);
  padding: 16px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px 24px; }
.is-mobile .info-list { grid-template-columns: 1fr; gap: 12px; }

.info-row, .info-item { display: flex; align-items: center; gap: 10px; }
.info-label { min-width: 60px; font-size: 13px; color: #909399; }
.info-value { flex: 1; font-size: 14px; color: #303133; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }

.character-tag { border: none; }
.location-path { color: var(--primary-gold, #e6a23c); font-weight: 500; }
.price { color: #f56c6c; font-weight: bold; font-size: 16px; }
.notes-section { margin-top: 8px; }
.notes {
  margin-top: 6px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 8px;
  line-height: 1.6;
  white-space: pre-wrap;
  font-size: 13px;
  color: #606266;
}

/* 相同主题的谷子列表样式 */
.same-theme-section {
  margin-top: 24px;
  padding: 0 8px;
}
.is-mobile .same-theme-section {
  padding: 0;
}

.same-theme-collapse {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
}

.same-theme-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.theme-icon {
  color: var(--primary-gold, #e6a23c);
  font-size: 16px;
}

.same-theme-loading {
  padding: 16px;
}

.same-theme-empty {
  padding: 20px;
}

.same-theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  padding: 16px;
}

.same-theme-item {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #ebeef5;
}

.same-theme-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.same-theme-image {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px 8px 0 0;
}

.same-theme-image-placeholder {
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  color: #c0c4cc;
  font-size: 24px;
}

.same-theme-item-name {
  padding: 8px;
  font-size: 12px;
  color: #606266;
  text-align: center;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.is-mobile .same-theme-grid {
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
  padding: 12px;
}

.is-mobile .same-theme-item-name {
  font-size: 11px;
  padding: 6px;
}

/* ---------------- Element UI 样式重置与动画控制 ---------------- */

:deep(.el-drawer__body) { padding: 20px; overflow-y: auto; }

/* 移动端特殊处理 */
.is-mobile :deep(.el-drawer__body) {
  padding: 0 !important;
  display: flex;
  flex-direction: column;
}
.is-mobile :deep(.el-drawer) {
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  overflow: visible;
}

/* 
  关键：当正在拖拽时，强制移除 Drawer 的过渡动画
  这样高度变化就是实时的，不会有滞后感
*/
.is-dragging :deep(.el-drawer) {
  transition: none !important;
}
</style>

