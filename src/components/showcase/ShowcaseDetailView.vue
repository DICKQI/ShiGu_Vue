<template>
  <div class="detail-root">
    <div class="detail-header-bar">
      <el-button link @click="emit('back')" class="back-btn">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <div class="title">展柜详情</div>
    </div>

    <div v-if="loading && !showcase" class="detail-loading">
      <el-skeleton :rows="10" animated />
    </div>

    <div v-else-if="showcase" class="detail-content">
      <div class="detail-info-banner">
        <div class="info-text">
          <h2 class="detail-name">{{ showcase.name }}</h2>
          <p class="detail-desc">{{ showcase.description || '这个展柜还没有描述...' }}</p>
          <div class="detail-tags">
            <el-tag size="small" :type="showcase.is_public ? 'success' : 'info'" effect="light" round>
              {{ showcase.is_public ? '公开展示' : '私密收藏' }}
            </el-tag>
          </div>
        </div>
        <div class="info-action">
          <el-button v-if="!readonly" type="primary" class="btn-accent add-goods-btn" @click="emit('addGoods')">
            <el-icon class="el-icon--left"><Goods /></el-icon> 添加谷子
          </el-button>
        </div>
      </div>

      <el-divider class="custom-divider" />

      <div class="goods-section">
        <div class="section-header">
          <span class="section-title">收纳物品</span>
          <span class="section-count">{{ goods.length }} 件</span>
        </div>

        <div v-if="goods.length === 0" class="goods-empty">
          <el-empty description="这里空空如也，快去添加心爱的谷子吧！" image-size="80" />
        </div>

        <div v-else class="goods-grid">
          <div
            v-for="item in goods"
            :key="item.id"
            class="goods-wrapper"
            @contextmenu.prevent.stop="!readonly && emit('goodsContextMenuFromDom', item.goods.id, $event)"
          >
            <GoodsCard
              :goods="item.goods"
              :show-menu="false"
              :enable-watermark="readonly"
              class="mini-goods-card"
              :style="{ cursor: readonly ? 'default' : 'pointer' }"
              @click="!readonly && emit('openGoods', item.goods)"
              @location-click="noop"
              @context-menu="!readonly && emit('goodsContextMenu', $event)"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-else class="detail-empty-state">
      <el-empty description="展柜不存在或加载失败" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, Goods } from '@element-plus/icons-vue'
import GoodsCard from '@/components/GoodsCard.vue'
import type { GoodsListItem, Showcase, ShowcaseGoods } from '@/api/types'

withDefaults(defineProps<{
  loading: boolean
  showcase: Showcase | null
  goods: ShowcaseGoods[]
  readonly?: boolean
}>(), {
  readonly: false
})

const emit = defineEmits<{
  back: []
  addGoods: []
  openGoods: [goods: GoodsListItem]
  goodsContextMenu: [payload: { goods: GoodsListItem; x: number; y: number }]
  goodsContextMenuFromDom: [goodsId: string, event: MouseEvent]
}>()

const noop = () => {}
</script>

<style scoped>
.detail-root {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.detail-header-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0 6px;
}
.title {
  font-size: 16px;
  font-weight: 800;
  color: rgba(0, 0, 0, 0.8);
}
.back-btn {
  padding: 0;
}

.detail-loading {
  padding: 16px;
}

.detail-content {
  flex: 1 1 auto;
  min-height: 0;
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
  color: rgba(0, 0, 0, 0.84);
  margin: 0;
  font-weight: 900;
}
.detail-desc {
  color: rgba(0, 0, 0, 0.55);
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
  font-weight: 800;
  color: rgba(0, 0, 0, 0.8);
}
.section-count {
  margin-left: 8px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
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

@media (max-width: 768px) {
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
}
</style>

