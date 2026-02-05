<template>
  <div class="list-view">
    <div class="list-body">
      <div v-if="error && showcases.length === 0" class="state-box">
        <el-alert :title="error" type="error" :closable="false" show-icon />
      </div>

      <div v-else-if="loading && showcases.length === 0" class="state-box">
        <el-skeleton :rows="8" animated />
      </div>

      <div v-else-if="showcases.length === 0" class="state-box empty">
        <el-empty description="暂无展柜，打造你的第一个痛柜吧！" image-size="100" />
      </div>

      <div v-else class="folder-grid">
        <ShowcaseFolderCard
          v-for="s in showcases"
          :key="s.id"
          :showcase="s"
          :preview-photos="getPreviewPhotos(s.id)"
          :loading-preview="isPreviewLoading(s.id)"
          :enable-watermark="enableWatermark"
          :user-id="'ID:' + s.id.slice(0, 8)"
          @click="emit('select', s.id)"
          @contextmenu.prevent.stop="emit('contextMenu', s.id, $event)"
        />
      </div>
    </div>

    <div class="pager-container">
      <el-pagination
        v-if="pagination.total > 0"
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :total="pagination.total"
        small
        layout="prev, pager, next"
        background
        @current-change="emit('pageChange', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Showcase } from '@/api/types'
import ShowcaseFolderCard from '@/components/showcase/ShowcaseFolderCard.vue'

const props = defineProps<{
  showcases: Showcase[]
  loading: boolean
  error: string | null
  pagination: { total: number; page: number; pageSize: number }
  getPreviewPhotos: (showcaseId: string) => string[]
  isPreviewLoading: (showcaseId: string) => boolean
  enableWatermark?: boolean
}>()

const emit = defineEmits<{
  select: [showcaseId: string]
  contextMenu: [showcaseId: string, event: MouseEvent]
  pageChange: [page: number]
}>()
</script>

<style scoped>
.list-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.list-body {
  flex: 1 1 auto;
  min-height: 0;
}

.folder-grid {
  display: grid;
  /* PC 默认一行 6 个 */
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
}

.state-box {
  padding: 12px 0;
}
.state-box.empty {
  padding: 24px 0;
}

.pager-container {
  display: flex;
  justify-content: center;
  padding: 14px 0 0;
}

@media (max-width: 768px) {
  .folder-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}
</style>

