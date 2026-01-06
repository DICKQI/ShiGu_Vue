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
    <div v-if="goods.status !== 'in_cabinet'" class="status-tag" :class="statusClass">
      {{ statusText }}
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
import { Picture, Location } from '@element-plus/icons-vue'
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
  top: 10px;
  left: 10px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  color: white;
  z-index: 10;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.status-outdoor {
  background: linear-gradient(135deg, #FF9F43, #FDBE77);
}

.status-sold {
  background: linear-gradient(135deg, #95a5a6, #7f8c8d);
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
</style>

