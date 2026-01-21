<template>
  <div
    class="goods-card"
    @click="handleClick"
    @contextmenu.prevent="handleContextMenu"
    @touchstart.stop="handleTouchStart"
    @touchend="handleTouchEnd"
    @touchcancel="handleTouchEnd"
    @touchmove="handleTouchMove"
  >
    <!-- 1. 图片区域 -->
    <div class="card-image-wrapper">
      <el-image
        v-if="goods.main_photo"
        :src="goods.main_photo"
        :alt="goods.name"
        fit="cover"
        class="main-image"
        loading="lazy"
      >
        <template #error>
          <div class="image-placeholder">
            <el-icon><Picture /></el-icon>
          </div>
        </template>
      </el-image>
      <div v-else class="image-placeholder">
        <el-icon><Picture /></el-icon>
      </div>

      <!-- 官谷/同人 标签 -->
      <div class="attr-tag" :class="tagClass">
        <el-icon class="tag-icon">
          <CircleCheck v-if="goods.is_official" />
          <Brush v-else />
        </el-icon>
        <span class="tag-text">{{ tagText }}</span>
      </div>

      <!-- 数量角标 -->
      <div v-if="goods.quantity > 1" class="quantity-badge">
        x{{ goods.quantity }}
      </div>

      <!-- 更多按钮 -->
      <div class="menu-button" @click.stop="handleMenuButtonClick">
        <el-icon><MoreFilled /></el-icon>
      </div>
    </div>

    <!-- 2. 内容区域 -->
    <div class="card-content">
      <!-- 标题 -->
      <h3 class="goods-title" :title="goods.name">{{ goods.name }}</h3>

      <!-- 参数对齐布局 -->
      <div class="info-meta">
        <div class="info-row">
          <span class="info-label">IP</span>
          <span class="info-value truncate">{{ goods.ip.name }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">角色</span>
          <span class="info-value truncate">
            {{ goods.characters.map(c => c.name).join('、') }}
          </span>
        </div>
      </div>

      <!-- 3. 底部脚部（解决移动端冲突的核心区域） -->
      <div class="card-footer">
        <!-- 品类标签：固定宽度不收缩 -->
        <div class="category-wrapper">
          <span class="category-tag" :style="categoryStyle">
            {{ goods.category.name }}
          </span>
        </div>

        <!-- 位置信息：空间不足时自动收缩并显示省略号 -->
        <div 
          v-if="goods.location_path" 
          class="location-box" 
          @click.stop="handleLocationClick"
        >
          <el-icon class="loc-icon"><Location /></el-icon>
          <span class="location-text">{{ goods.location_path.split('/').pop() }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { Picture, Location, CircleCheck, MoreFilled, Brush } from '@element-plus/icons-vue'
import type { GoodsListItem } from '@/api/types'

interface Props {
  goods: GoodsListItem
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [goods: GoodsListItem]
  locationClick: [path: string]
  contextMenu: [{ goods: GoodsListItem; x: number; y: number }]
}>()

const isLongPress = ref(false)
let longPressTimer: number | null = null

const tagText = computed(() => props.goods.is_official ? '官谷' : '同人')
const tagClass = computed(() => ({
  'tag-official': props.goods.is_official,
  'tag-unofficial': !props.goods.is_official
}))

// 动态计算品类标签样式
const categoryStyle = computed(() => {
  const color = props.goods.category.color_tag || '#D4AF37';
  return {
    color: color,
    backgroundColor: `${color}15`, 
    borderColor: `${color}30`     
  }
})

// --- 逻辑处理 ---
const handleClick = () => {
  if (isLongPress.value) {
    isLongPress.value = false
    return
  }
  emit('click', props.goods)
}

const handleLocationClick = () => {
  emit('locationClick', props.goods.location_path)
}

const handleMenuButtonClick = (event: MouseEvent) => {
  event.stopPropagation()
  emit('contextMenu', { goods: props.goods, x: event.clientX, y: event.clientY })
}

const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  emit('contextMenu', { goods: props.goods, x: event.clientX, y: event.clientY })
}

const clearLongPressTimer = () => {
  if (longPressTimer !== null) {
    window.clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

const handleTouchStart = (event: TouchEvent) => {
  clearLongPressTimer()
  const touch = event.touches[0]
  if (!touch) return
  longPressTimer = window.setTimeout(() => {
    isLongPress.value = true
    const currentTouch = event.touches[0] || touch
    emit('contextMenu', { goods: props.goods, x: currentTouch.clientX, y: currentTouch.clientY })
  }, 600)
}

const handleTouchEnd = () => clearLongPressTimer()
const handleTouchMove = () => clearLongPressTimer()
onBeforeUnmount(() => clearLongPressTimer())
</script>

<style scoped>
.goods-card {
  --primary-gold: #D4AF37;
  --text-main: #303133;
  --text-sub: #909399;
  --bg-gray: #f8f9fa;
  
  background-color: #fff;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.goods-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
  border-color: var(--primary-gold);
}

/* 图片区域 */
.card-image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  background-color: var(--bg-gray);
  overflow: hidden;
}

.main-image {
  width: 100%;
  height: 100%;
}

/* 官谷/同人标签 */
.attr-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: bold;
  z-index: 2;
  backdrop-filter: blur(8px) brightness(0.85);
  -webkit-backdrop-filter: blur(8px) brightness(0.85);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
}

.tag-official { background: rgba(212, 175, 55, 0.5); color: #FFD700; }
.tag-unofficial { background: rgba(162, 155, 254, 0.5); color: #E0DEFF; }

.quantity-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
}

.menu-button {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
  z-index: 3;
}

.goods-card:hover .menu-button { opacity: 1; }

/* 内容区 */
.card-content {
  padding: 12px;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0; /* 允许内部元素收缩 */
}

.goods-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.info-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 10px;
}

.info-row {
  display: flex;
  align-items: center;
  font-size: 12px;
}

.info-label {
  color: var(--text-sub);
  background: #f0f2f5;
  padding: 1px 5px;
  border-radius: 4px;
  margin-right: 10px;
  font-weight: 500;
  width: 32px;
  text-align: center;
  flex-shrink: 0;
  font-size: 11px;
}

.info-value {
  color: #606266;
  flex: 1;
  min-width: 0;
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 底部脚部 - 解决冲突的关键样式 */
.card-footer {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px dashed #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px; /* 强制两者之间的最小间距 */
  width: 100%;
}

.category-wrapper {
  flex-shrink: 0; /* 保证标签不会被挤压变窄 */
}

.category-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid transparent;
  white-space: nowrap;
}

.location-box {
  display: flex;
  align-items: center;
  justify-content: flex-end; /* 在右侧对齐内容 */
  gap: 3px;
  font-size: 11px;
  color: var(--text-sub);
  flex: 1; /* 占据剩余所有空间 */
  min-width: 0; /* flex容器内允许省略号的关键 */
}

.loc-icon {
  flex-shrink: 0; /* 图标不收缩 */
}

.location-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; /* 长位置信息自动显示省略号 */
}

@media (max-width: 768px) {
  .goods-title { -webkit-line-clamp: 1; }
  .menu-button { opacity: 1; }
  .card-content { padding: 10px; }
}
</style>

