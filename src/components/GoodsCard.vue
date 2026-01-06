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
    <!-- 状态标签 -->
    <div class="status-tag" :class="statusClass">
      <el-icon class="status-icon">
        <Box v-if="goods.status === 'in_cabinet'" />
        <Location v-else-if="goods.status === 'outdoor'" />
        <CircleCheck v-else-if="goods.status === 'sold'" />
      </el-icon>
      <span class="status-text">{{ statusText }}</span>
    </div>

    <!-- 主图 -->
    <div class="card-image">
      <el-image
        v-if="goods.main_photo"
        :src="goods.main_photo"
        :alt="goods.name"
        fit="cover"
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
    </div>

    <!-- 信息区 -->
    <div class="card-info">
      <div class="card-title" :title="goods.name">{{ goods.name }}</div>
      <div class="card-meta">
        <span class="meta-item">{{ goods.ip.short_name || goods.ip.name }}</span>
        <span class="meta-separator">·</span>
        <span class="meta-item">{{ goods.character.name }}</span>
        <span class="meta-separator">·</span>
        <span class="meta-item">{{ goods.category.name }}</span>
      </div>
      <div v-if="goods.location_path" class="card-location" @click.stop="handleLocationClick">
        <el-icon><Location /></el-icon>
        <span>{{ goods.location_path }}</span>
      </div>
      <div v-if="goods.quantity > 1" class="card-quantity">
        数量: {{ goods.quantity }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { Picture, Location, Box, CircleCheck } from '@element-plus/icons-vue'
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

const statusText = computed(() => {
  const map: Record<string, string> = {
    in_cabinet: '在馆',
    outdoor: '出街中',
    sold: '已售出',
  }
  return map[props.goods.status] || props.goods.status
})

const statusClass = computed(() => {
  return {
    'status-in-cabinet': props.goods.status === 'in_cabinet',
    'status-outdoor': props.goods.status === 'outdoor',
    'status-sold': props.goods.status === 'sold',
  }
})

const handleClick = () => {
  // 长按已经触发菜单时，不再触发点击打开详情
  if (isLongPress.value) {
    isLongPress.value = false
    return
  }
  emit('click', props.goods)
}

const handleLocationClick = () => {
  emit('locationClick', props.goods.location_path)
}

const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  emit('contextMenu', {
    goods: props.goods,
    x: event.clientX,
    y: event.clientY,
  })
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
    // 再次安全获取最新的触点坐标
    const currentTouch = event.touches[0] || touch
    emit('contextMenu', {
      goods: props.goods,
      x: currentTouch.clientX,
      y: currentTouch.clientY,
    })
  }, 600)
}

const handleTouchEnd = () => {
  clearLongPressTimer()
}

const handleTouchMove = () => {
  // 手指移动则认为取消长按
  clearLongPressTimer()
}

onBeforeUnmount(() => {
  clearLongPressTimer()
})
</script>

<style scoped>
.goods-card {
  background-color: var(--bg-white);
  border-radius: var(--card-radius);
  overflow: hidden;
  position: relative;
  cursor: pointer;
  transition: all var(--transition-normal);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.goods-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-gold);
}

.status-tag {
  position: absolute;
  top: 12px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(4px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.3px;
}

.status-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.status-icon {
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  opacity: 0.95;
  transition: transform 0.3s ease;
}

.status-tag:hover .status-icon {
  transform: scale(1.1);
}

.status-text {
  line-height: 1;
}

/* 在馆 - 绿色渐变，表示可用 */
.status-in-cabinet {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.status-in-cabinet:hover {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.status-in-cabinet::before {
  content: '';
  position: absolute;
  top: -2px;
  right: -2px;
  bottom: -2px;
  left: -2px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 18px;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s;
}

.status-in-cabinet:hover::before {
  opacity: 0.2;
}

/* 出街中 - 橙色渐变，表示临时外出 */
.status-outdoor {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.status-outdoor:hover {
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.status-outdoor::before {
  content: '';
  position: absolute;
  top: -2px;
  right: -2px;
  bottom: -2px;
  left: -2px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border-radius: 18px;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s;
}

.status-outdoor:hover::before {
  opacity: 0.2;
}

/* 已售出 - 灰色渐变，表示已售出 */
.status-sold {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  box-shadow: 0 2px 8px rgba(107, 114, 128, 0.3);
}

.status-sold:hover {
  box-shadow: 0 4px 12px rgba(107, 114, 128, 0.4);
}

.status-sold::before {
  content: '';
  position: absolute;
  top: -2px;
  right: -2px;
  bottom: -2px;
  left: -2px;
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  border-radius: 18px;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s;
}

.status-sold:hover::before {
  opacity: 0.2;
}

.card-image {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background-color: var(--secondary-gray);
}

:deep(.el-image) {
  width: 100%;
  height: 100%;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-lighter);
  font-size: 48px;
  background-color: var(--secondary-gray);
}

.card-info {
  padding: 15px;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-dark);
}

.card-meta {
  font-size: 13px;
  color: var(--text-light);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.meta-separator {
  color: var(--text-lighter);
}

.card-location {
  font-size: 12px;
  color: var(--text-light);
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding: 4px 8px;
  background-color: var(--secondary-gray);
  border-radius: 4px;
  transition: all var(--transition-fast);
}

.card-location:hover {
  background-color: var(--primary-gold-light);
  color: var(--primary-gold-dark);
}

.card-quantity {
  font-size: 12px;
  color: var(--primary-gold);
  margin-top: 8px;
  font-weight: 500;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .status-tag {
    top: 8px;
    right: 8px;
    padding: 5px 10px;
    font-size: 11px;
  }

  .status-icon {
    font-size: 12px;
  }
}
</style>

