<template>
  <el-drawer
    v-model="visible"
    title="谷子详情"
    :size="isMobile ? '100%' : '600px'"
    direction="rtl"
    @close="handleClose"
  >
    <div v-if="loading" class="drawer-loading">
      <el-skeleton :rows="10" animated />
    </div>

    <div v-else-if="detail" class="drawer-content">
      <!-- 图片画廊 -->
      <div class="detail-images">
        <el-image
          v-if="detail.main_photo"
          :src="detail.main_photo"
          fit="cover"
          :preview-src-list="allImages"
          class="main-image"
        >
          <template #error>
            <div class="image-placeholder">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
        </el-image>

        <div v-if="detail.additional_photos.length > 0" class="additional-images">
          <el-image
            v-for="(photo, index) in detail.additional_photos"
            :key="photo.id"
            :src="photo.image"
            fit="cover"
            :preview-src-list="allImages"
            :initial-index="index + 1"
            class="additional-image"
          />
        </div>
      </div>

      <!-- 详细信息 -->
      <div class="detail-info">
        <h2 class="detail-title">{{ detail.name }}</h2>

        <div class="info-section">
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
          <div class="info-row">
            <span class="info-label">状态</span>
            <el-tag :type="statusTagType">{{ statusText }}</el-tag>
          </div>
          <div v-if="detail.location_path" class="info-row">
            <span class="info-label">位置</span>
            <span class="info-value location-path">{{ detail.location_path }}</span>
          </div>
          <div v-if="detail.price" class="info-row">
            <span class="info-label">购入价格</span>
            <span class="info-value price">¥ {{ detail.price }}</span>
          </div>
          <div v-if="detail.purchase_date" class="info-row">
            <span class="info-label">入手日期</span>
            <span class="info-value">{{ detail.purchase_date }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">是否官谷</span>
            <el-tag :type="detail.is_official ? 'success' : 'info'">
              {{ detail.is_official ? '是' : '否' }}
            </el-tag>
          </div>
          <div class="info-row">
            <span class="info-label">数量</span>
            <span class="info-value">{{ detail.quantity }}</span>
          </div>
          <div v-if="detail.notes" class="info-row notes-row">
            <span class="info-label">备注</span>
            <div class="info-value notes">{{ detail.notes }}</div>
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
import { ref, computed, watch } from 'vue'
import { Picture } from '@element-plus/icons-vue'
import { useGuziStore } from '@/stores/guzi'
import type { GoodsDetail } from '@/api/types'

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

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const isMobile = computed(() => window.innerWidth < 768)

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
  async (newId) => {
    if (newId && visible.value) {
      await loadDetail(newId)
    }
  },
  { immediate: true }
)

watch(visible, async (newVal) => {
  if (newVal && props.goodsId) {
    await loadDetail(props.goodsId)
  } else {
    detail.value = null
  }
})

async function loadDetail(id: string) {
  loading.value = true
  try {
    const data = await guziStore.fetchGoodsDetail(id)
    detail.value = data
  } finally {
    loading.value = false
  }
}

function handleClose() {
  detail.value = null
}
</script>

<style scoped>
.drawer-loading {
  padding: 20px;
}

.drawer-content {
  padding-bottom: 20px;
}

.detail-images {
  margin-bottom: 24px;
}

.main-image {
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--card-radius);
  overflow: hidden;
  margin-bottom: 12px;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--secondary-gray);
  color: var(--text-lighter);
  font-size: 48px;
}

.additional-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
}

.additional-image {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.detail-info {
  padding: 0 4px;
}

.detail-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 24px;
  color: var(--text-dark);
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.info-label {
  min-width: 80px;
  font-size: 14px;
  color: var(--text-light);
  font-weight: 500;
}

.info-value {
  flex: 1;
  font-size: 14px;
  color: var(--text-dark);
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.character-tag {
  margin: 0;
}

.location-path {
  color: var(--primary-gold);
  cursor: pointer;
}

.price {
  color: var(--primary-gold);
  font-weight: bold;
  font-size: 16px;
}

.notes-row {
  flex-direction: column;
  align-items: flex-start;
}

.notes {
  padding: 12px;
  background-color: var(--secondary-gray);
  border-radius: 8px;
  line-height: 1.6;
  white-space: pre-wrap;
}

.drawer-error {
  padding: 40px 20px;
  text-align: center;
}

:deep(.el-drawer__header) {
  border-bottom: 1px solid var(--border-color);
  padding: 20px;
}

:deep(.el-drawer__title) {
  color: var(--primary-gold);
  font-weight: bold;
}
</style>

