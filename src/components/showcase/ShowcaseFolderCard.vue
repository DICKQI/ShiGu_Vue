<template>
  <div class="folder-card" @click="emit('click')" @contextmenu="emit('contextmenu', $event)">
    <div class="folder-preview">
      <ShowcasePreviewMosaic
        :photos="previewPhotos"
        :loading="loadingPreview"
        :enable-watermark="enableWatermark"
        :user-id="userId"
      />
    </div>
    <div class="folder-title" :title="showcase.name">
      {{ showcase.name }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Showcase } from '@/api/types'
import ShowcasePreviewMosaic from '@/components/showcase/ShowcasePreviewMosaic.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  showcase: Showcase
  previewPhotos: string[]
  loadingPreview?: boolean
  enableWatermark?: boolean
  userId?: string
}>()

const emit = defineEmits<{
  click: []
  contextmenu: [event: MouseEvent]
}>()

// 避免未使用 props 警告（某些配置下会触发）
void props
</script>

<style scoped>
.folder-card {
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 16px;
  box-shadow:
    0 10px 40px -12px rgba(0, 0, 0, 0.08),
    0 2px 10px -2px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  display: flex;
  flex-direction: column;
}

.folder-card:hover {
  transform: translateY(-3px);
  background: rgba(255, 255, 255, 0.9);
  box-shadow:
    0 14px 44px -12px rgba(0, 0, 0, 0.10),
    0 2px 14px -2px rgba(0, 0, 0, 0.06);
}

.folder-preview {
  width: 100%;
  /* 预览区域改为正方形 */
  aspect-ratio: 1 / 1;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.04);
  background: rgba(0, 0, 0, 0.02);
}

.folder-title {
  padding: 10px 12px 12px;
  font-size: 13px;
  font-weight: 900;
  color: rgba(0, 0, 0, 0.82);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .folder-preview {
    aspect-ratio: 1 / 1;
    border-radius: 14px 14px 0 0;
  }
  .folder-title {
    padding: 10px 12px 12px;
  }
}
</style>

