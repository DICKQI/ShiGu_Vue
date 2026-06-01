<template>
  <el-dialog
    v-model="visible"
    append-to-body
    destroy-on-close
    :show-close="false"
    :width="dialogWidth"
    :top="dialogTop"
    :class="['multi-display-dialog', { 'multi-display-dialog--grid': isGridMode }]"
  >
    <template #header>
      <div class="display-header">
        <span class="title-count">已选 {{ goodsList.length }} 件谷子</span>

        <div class="display-actions">
          <div class="density-toggle" aria-label="图片密度">
            <button
              v-for="option in densityOptions"
              :key="option.value"
              class="density-option"
              :class="{ active: density === option.value }"
              type="button"
              @click="density = option.value"
            >
              {{ option.label }}
            </button>
          </div>

          <el-button v-if="goodsList.length > 0" text class="clear-btn" @click="emit('clear')">
            清空
          </el-button>
          <el-button circle class="close-btn" @click="visible = false">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>
    </template>

    <div class="display-body" :class="{ 'display-body--grid': isGridMode }">
      <el-empty v-if="goodsList.length === 0" description="暂无已选谷子" />

      <div v-else class="display-grid" :class="gridClass" :style="gridStyle">
        <article v-for="goods in goodsList" :key="goods.id" class="display-item">
          <button
            class="remove-btn"
            type="button"
            :aria-label="`移除 ${goods.name}`"
            @click="emit('remove', goods.id)"
          >
            <el-icon><Close /></el-icon>
          </button>

          <el-image
            v-if="goods.main_photo"
            :src="goods.main_photo"
            :alt="goods.name"
            fit="contain"
            loading="lazy"
            class="display-image"
            :preview-src-list="previewImages"
            :initial-index="getPreviewIndex(goods.id)"
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

          <div v-if="!isGridMode" class="item-caption">
            <h3 :title="goods.name">{{ goods.name }}</h3>
            <p>{{ goods.ip.name }} / {{ goods.characters.map((c) => c.name).join('、') }}</p>
          </div>
        </article>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Close, Picture } from '@element-plus/icons-vue'
import type { GoodsListItem } from '@/api/types'

type Density = 'compact' | 'standard' | 'grid'

const props = defineProps<{
  modelValue: boolean
  goodsList: GoodsListItem[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  remove: [id: string]
  clear: []
}>()

const density = ref<Density>('standard')
const densityOptions: Array<{ label: string; value: Density }> = [
  { label: '紧凑', value: 'compact' },
  { label: '标准', value: 'standard' },
  { label: '宫格', value: 'grid' },
]

const viewportWidth = ref(typeof window === 'undefined' ? 1440 : window.innerWidth)
const viewportHeight = ref(typeof window === 'undefined' ? 900 : window.innerHeight)

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const gridClass = computed(() => `display-grid--${density.value}`)
const isGridMode = computed(() => density.value === 'grid')
const dialogWidth = computed(() => (isGridMode.value ? 'min(96vw, 1480px)' : 'min(92vw, 1120px)'))
const dialogTop = computed(() => (isGridMode.value ? '3vh' : '6vh'))
const gridColumnCount = computed(() => {
  const count = props.goodsList.length
  if (count <= 1) return 1
  if (count <= 4) return 2
  if (count <= 6) return 3
  return 4
})
const gridRowCount = computed(() => Math.max(1, Math.ceil(props.goodsList.length / gridColumnCount.value)))
const gridItemSize = computed(() => {
  const columns = gridColumnCount.value
  const rowsToFit = Math.min(gridRowCount.value, 2)
  const gap = 4
  const horizontalPadding = 28
  const verticalPadding = 24
  const dialogWidth = Math.min(viewportWidth.value * 0.96, 1480)
  const bodyHeight = Math.min(viewportHeight.value * 0.84, 900)
  const widthLimit = (dialogWidth - horizontalPadding - gap * (columns - 1)) / columns
  const heightLimit = (bodyHeight - verticalPadding - gap * (rowsToFit - 1)) / rowsToFit

  return Math.max(120, Math.floor(Math.min(widthLimit, heightLimit)))
})
const gridStyle = computed(() => (
  isGridMode.value
    ? {
        '--grid-columns': String(gridColumnCount.value),
        '--grid-item-size': `${gridItemSize.value}px`,
      }
    : undefined
))
const previewEntries = computed(() => props.goodsList.filter((goods) => Boolean(goods.main_photo)))
const previewImages = computed(() => previewEntries.value.map((goods) => goods.main_photo as string))

const getPreviewIndex = (id: string) => {
  const index = previewEntries.value.findIndex((goods) => goods.id === id)
  return index >= 0 ? index : 0
}

const updateViewportSize = () => {
  viewportWidth.value = window.innerWidth
  viewportHeight.value = window.innerHeight
}

onMounted(() => {
  updateViewportSize()
  window.addEventListener('resize', updateViewportSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateViewportSize)
})
</script>

<style scoped>
:deep(.multi-display-dialog.el-dialog) {
  border-radius: 14px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.34);
}

:deep(.multi-display-dialog .el-dialog__header) {
  margin-right: 0;
  padding: 14px 18px;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
}

:deep(.multi-display-dialog .el-dialog__body) {
  padding: 0;
  height: min(72vh, 720px);
  background: #f6f7f9;
}

:deep(.multi-display-dialog--grid .el-dialog__body) {
  height: min(84vh, 900px);
}

.display-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: #111827;
}

.title-count {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #374151;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.display-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
}

.density-toggle {
  display: inline-flex;
  padding: 3px;
  border-radius: 8px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
}

.density-option {
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #4b5563;
  cursor: pointer;
  font-size: 13px;
  padding: 5px 10px;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.density-option.active {
  background: #111827;
  color: #ffffff;
  font-weight: 700;
}

.clear-btn {
  color: #4b5563;
  font-weight: 600;
}

.clear-btn:hover {
  color: #111827;
}

.close-btn {
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #374151;
}

.close-btn:hover {
  border-color: #9ca3af;
  background: #f3f4f6;
  color: #111827;
}

.display-body {
  height: 100%;
  overflow: auto;
  padding: 20px;
}

.display-body--grid {
  padding: 10px 14px 14px;
}

.display-grid {
  display: grid;
  gap: 14px;
  align-items: stretch;
}

.display-grid--compact {
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
}

.display-grid--standard {
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}

.display-grid--grid {
  grid-template-columns: repeat(var(--grid-columns, 4), minmax(0, var(--grid-item-size, 240px)));
  grid-auto-rows: var(--grid-item-size, 240px);
  gap: 4px;
  justify-content: center;
  align-content: start;
  align-items: stretch;
}

.display-item {
  position: relative;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  min-height: 260px;
  border-radius: 8px;
  overflow: hidden;
  background: #1b1e25;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.display-grid--compact .display-item {
  min-height: 210px;
}

.display-grid--grid .display-item {
  min-height: 0;
  height: 100%;
  grid-template-rows: 1fr;
  border-radius: 3px;
  border: 0;
  overflow: hidden;
  background: #ffffff;
}

.display-image {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.image-placeholder {
  min-height: 180px;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(248, 250, 252, 0.42);
  background: repeating-linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.04),
    rgba(255, 255, 255, 0.04) 10px,
    rgba(255, 255, 255, 0.02) 10px,
    rgba(255, 255, 255, 0.02) 20px
  );
}

.image-placeholder .el-icon {
  font-size: 40px;
}

.remove-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f8fafc;
  background: rgba(17, 19, 24, 0.72);
  cursor: pointer;
  transition: background-color 0.16s ease, transform 0.16s ease;
}

.remove-btn:hover {
  background: rgba(245, 108, 108, 0.92);
  transform: scale(1.04);
}

.display-grid--grid .remove-btn {
  top: 8px;
  right: 8px;
  opacity: 0.82;
}

.display-grid--grid .display-item:hover .remove-btn {
  opacity: 1;
}

.item-caption {
  min-width: 0;
  padding: 10px 12px 12px;
  background: rgba(17, 19, 24, 0.92);
  color: #f8fafc;
}

.item-caption h3 {
  margin: 0;
  font-size: 14px;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-caption p {
  margin: 5px 0 0;
  color: rgba(248, 250, 252, 0.58);
  font-size: 12px;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  :deep(.multi-display-dialog .el-dialog__header) {
    padding: 12px;
  }

  .display-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
  }

  .display-actions {
    width: 100%;
    justify-content: space-between;
  }

  .density-option {
    padding: 5px 8px;
    font-size: 12px;
  }

  .display-body {
    padding: 12px;
  }

  .display-grid--compact,
  .display-grid--standard,
  .display-grid--grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .display-item {
    min-height: 230px;
  }

  .display-grid--grid {
    grid-template-columns: repeat(var(--grid-columns, 2), minmax(0, var(--grid-item-size, 160px)));
    grid-auto-rows: var(--grid-item-size, 160px);
  }
}
</style>
