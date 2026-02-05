<template>
  <div class="mosaic" :class="layoutClass">
    <template v-if="!loading && normalized.length === 0">
      <div class="placeholder">
        <el-icon><Picture /></el-icon>
      </div>
    </template>

    <template v-else-if="loading && normalized.length === 0">
      <div class="skeleton"></div>
    </template>

    <template v-else>
      <div v-for="(src, idx) in tiles" :key="idx" class="tile" :class="tileClass(idx)">
        <WatermarkImage
          v-if="enableWatermark"
          :src="src"
          fit="cover"
          class="tile-img"
          :user-id="userId"
        />
        <el-image v-else :src="src" fit="cover" class="tile-img" loading="lazy">
          <template #error>
            <div class="placeholder">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
        </el-image>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Picture } from '@element-plus/icons-vue'
import WatermarkImage from '@/components/WatermarkImage.vue'

const props = withDefaults(
  defineProps<{
    photos: string[]
    loading?: boolean
    enableWatermark?: boolean
    userId?: string
  }>(),
  { loading: false },
)

const normalized = computed(() => (props.photos || []).filter(Boolean).slice(0, 4))
const count = computed(() => normalized.value.length)

const layoutClass = computed(() => {
  if (count.value >= 4) return 'l4'
  if (count.value === 3) return 'l3'
  if (count.value === 2) return 'l2'
  if (count.value === 1) return 'l1'
  return 'l0'
})

const tiles = computed(() => {
  // 4+：取前四张
  if (count.value >= 4) return normalized.value.slice(0, 4)
  return normalized.value
})

const tileClass = (idx: number) => {
  if (count.value === 3) {
    // “三角形”近似：上1下2（tile0 跨两列）
    if (idx === 0) return 'span2'
  }
  return ''
}
</script>

<style scoped>
.mosaic {
  width: 100%;
  height: 100%;
  position: relative;
  background: rgba(0, 0, 0, 0.02);
}

.placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.25);
  font-size: 20px;
}

.skeleton {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.04), rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.04));
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
}

@keyframes shimmer {
  0% { background-position: 0% 0; }
  100% { background-position: -200% 0; }
}

.tile {
  overflow: hidden;
}

.tile-img {
  width: 100%;
  height: 100%;
}

/* 1 张：铺满 */
.mosaic.l1 {
  display: block;
}
.mosaic.l1 .tile {
  width: 100%;
  height: 100%;
}

/* 2 张：左右分隔 */
.mosaic.l2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
  gap: 2px;
}
.mosaic.l2 .tile {
  width: 100%;
  height: 100%;
}

/* 3 张：上1下2（近似三角形布局） */
.mosaic.l3 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 2px;
}
.mosaic.l3 .tile {
  width: 100%;
  height: 100%;
}
.mosaic.l3 .tile.span2 {
  grid-column: 1 / span 2;
}

/* 4+：2x2 */
.mosaic.l4 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 2px;
}
.mosaic.l4 .tile {
  width: 100%;
  height: 100%;
}
</style>

