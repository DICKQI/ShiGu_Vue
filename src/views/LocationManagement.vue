<template>
  <div class="location-management">
    <el-row :gutter="20" class="main-layout">
      <!-- 左侧树形导航 -->
      <el-col :xs="24" :sm="8" :md="8" class="tree-col">
        <el-card class="tree-card" :body-style="{ padding: '0', height: '100%', display: 'flex', flexDirection: 'column' }">
          <template #header>
            <div class="card-header">
              <span>收纳位置</span>
              <el-button type="primary" size="small" @click="handleAddNode">
                <el-icon><Plus /></el-icon>
                新增
              </el-button>
            </div>
          </template>

          <!-- 下拉刷新容器 wrapper -->
          <div 
            class="pull-refresh-wrapper"
            ref="scrollContainerRef"
            @touchstart="handleTouchStart"
            @touchmove="handleTouchMove"
            @touchend="handleTouchEnd"
          >
            <!-- 下拉加载提示区 -->
            <div class="pull-indicator" :style="{ height: `${pullDistance}px`, opacity: pullDistance > 0 ? 1 : 0 }">
              <div class="indicator-content">
                <el-icon v-if="isRefreshing" class="is-loading"><Loading /></el-icon>
                <el-icon v-else :style="{ transform: `rotate(${pullDistance > 50 ? 180 : 0}deg)` }"><Top /></el-icon>
                <span class="indicator-text">
                  {{ isRefreshing ? '正在刷新...' : (pullDistance > 50 ? '释放刷新' : '下拉刷新') }}
                </span>
              </div>
            </div>

            <!-- 内容区域 -->
            <div class="tree-content-inner" :style="{ transform: `translateY(${pullDistance}px)` }">
              <div v-if="locationStore.loading && !isRefreshing" class="loading-container">
                <el-skeleton :rows="5" animated />
              </div>

              <el-tree
                v-else
                ref="treeRef"
                :data="locationStore.treeData"
                :props="{ label: 'label', children: 'children' }"
                :expand-on-click-node="false"
                node-key="id"
                :default-expand-all="false"
                @node-click="handleNodeClick"
                class="custom-tree"
              >
                <template #default="{ node, data }">
                  <div class="tree-node">
                    <span class="node-label">{{ node.label }}</span>
                    <!-- PC端操作按钮 -->
                    <span class="node-actions hidden-xs-only">
                      <el-button text size="small" @click.stop="handleEditNode(data)">
                        <el-icon><Edit /></el-icon>
                      </el-button>
                      <el-button text size="small" type="danger" @click.stop="handleDeleteNode(data)">
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </span>
                    <!-- 移动端箭头 -->
                    <el-icon class="node-arrow hidden-sm-and-up"><ArrowRight /></el-icon>
                  </div>
                </template>
              </el-tree>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧详情 (PC) -->
      <el-col :xs="0" :sm="16" :md="16" class="detail-col hidden-xs-only">
        <el-card v-if="selectedNode" class="detail-card">
          <template #header>
            <div class="card-header">
              <span>{{ selectedNode.name }}</span>
            </div>
          </template>
          <NodeDetailContent 
            :node="selectedNode" 
            :guzi-list="locationGuziList"
            :loading="goodsLoading"
            :include-children="includeChildren"
            @update:include-children="val => includeChildren = val"
            @change-include="handleIncludeChildrenChange"
            @click-guzi="handleGuziClick"
          />
        </el-card>
        <el-empty v-else description="请选择一个位置节点" class="detail-empty" />
      </el-col>
    </el-row>

    <!-- 移动端详情抽屉 -->
    <el-drawer
      v-model="mobileDrawerVisible"
      direction="btt"
      size="85%"
      :with-header="false"
      class="mobile-detail-drawer"
      destroy-on-close
    >
      <div class="mobile-drawer-content" v-if="selectedNode">
        <div class="drawer-header sticky-header">
          <h2 class="drawer-title">{{ selectedNode.name }}</h2>
          <div class="drawer-actions">
            <el-button circle size="small" @click="handleEditNode({ id: selectedNode.id, data: selectedNode } as any)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button circle size="small" type="danger" @click="handleDeleteNode({ id: selectedNode.id, data: selectedNode } as any)">
              <el-icon><Delete /></el-icon>
            </el-button>
            <el-button circle size="small" @click="mobileDrawerVisible = false">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>
        <div class="drawer-body">
           <NodeDetailContent 
            :node="selectedNode" 
            :guzi-list="locationGuziList"
            :loading="goodsLoading"
            :include-children="includeChildren"
            @update:include-children="val => includeChildren = val"
            @change-include="handleIncludeChildrenChange"
            @click-guzi="handleGuziClick"
          />
        </div>
      </div>
    </el-drawer>

    <!-- 弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :width="isMobile ? '100%' : '600px'"
      :fullscreen="isMobile"
      class="responsive-dialog"
      @close="handleDialogClose"
      append-to-body
    >
      <el-form :model="formData" label-width="100px" label-position="left" class="dialog-form">
        <el-form-item label="位置名称" required>
          <el-input v-model="formData.name" placeholder="请输入位置名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="父节点位置">
          <div class="parent-select-wrapper">
            <el-tree-select
              v-model="formData.parent"
              :data="parentNodeOptions"
              placeholder="选择父节点"
              clearable
              :props="{ label: 'label', value: 'id', children: 'children' }"
              check-strictly
              style="width: 100%"
              filterable
              :filter-method="filterParentNodes"
            />
          </div>
        </el-form-item>
        <el-form-item label="显示顺序">
          <el-input-number v-model="formData.order" :min="0" :max="9999" style="width: 100%" controls-position="right" />
          <div class="form-tip-mobile">数字越小越靠前</div>
        </el-form-item>
        <el-form-item label="备注说明">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="可选备注信息" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineComponent, h } from 'vue'
import { Plus, Edit, Delete, ArrowRight, Close, Loading, Top } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useLocationStore } from '@/stores/location'
import {
  createLocationNode,
  patchLocationNode,
  deleteLocationNode,
  getLocationNodeDetail,
  getLocationNodeGoods,
} from '@/api/location'
import GoodsCard from '@/components/GoodsCard.vue'
import type { StorageNode, GoodsListItem } from '@/api/types'
import type { TreeNode } from '@/utils/tree'

// --- 详情内容组件 (PC/Mobile 复用) ---
const NodeDetailContent = defineComponent({
  props: ['node', 'guziList', 'loading', 'includeChildren'],
  emits: ['update:includeChildren', 'changeInclude', 'clickGuzi'],
  setup(props, { emit }) {
    return () => h('div', { class: 'node-detail' }, [
      props.node.image && h('div', { class: 'node-image' }, [
        h('img', { src: props.node.image, style: 'width:100%; height:100%; object-fit:cover;' })
      ]),
      h('div', { class: 'node-info' }, [
        h('div', { class: 'info-item' }, [
          h('span', { class: 'info-label' }, '完整路径'),
          h('span', { class: 'info-value path-value' }, props.node.path_name)
        ]),
        props.node.description && h('div', { class: 'info-item column-layout' }, [
          h('span', { class: 'info-label' }, '备注'),
          h('div', { class: 'info-value notes' }, props.node.description)
        ])
      ]),
      h('div', { class: 'guzi-list-section' }, [
        h('div', { class: 'section-header' }, [
          h('h3', { class: 'section-title' }, [
            '该位置的谷子',
            h('span', { class: 'count-badge' }, props.guziList.length)
          ]),
          h('label', { class: 'custom-switch-label' }, [
            h('input', { 
              type: 'checkbox', 
              checked: props.includeChildren, 
              onChange: (e: any) => {
                emit('update:includeChildren', e.target.checked);
                emit('changeInclude', e.target.checked);
              }
            }),
            h('span', { class: 'switch-text' }, props.includeChildren ? '含子节点' : '仅当前')
          ])
        ]),
        props.loading 
          ? h('div', { class: 'loading-guzi' }, '加载中...') 
          : (props.guziList.length === 0 
              ? h('div', { class: 'empty-guzi' }, '暂无谷子') 
              : h('div', { class: 'guzi-grid' }, 
                  props.guziList.map((goods: any) => 
                    h(GoodsCard, { 
                      key: goods.id, 
                      goods, 
                      onClick: () => emit('clickGuzi', goods) 
                    })
                  )
                )
            )
      ])
    ])
  }
})

const locationStore = useLocationStore()
const treeRef = ref()
const scrollContainerRef = ref<HTMLElement | null>(null) // 滚动容器引用

// 响应式
const windowWidth = ref(window.innerWidth)
const isMobile = computed(() => windowWidth.value < 768)
const updateWidth = () => windowWidth.value = window.innerWidth

// 基础数据
const selectedNode = ref<StorageNode | null>(null)
const locationGuziList = ref<GoodsListItem[]>([])
const goodsLoading = ref(false)
const includeChildren = ref(true)
const dialogVisible = ref(false)
const mobileDrawerVisible = ref(false)
const isEdit = ref(false)
const editingNodeId = ref<number | null>(null)
const formData = ref({ name: '', parent: null as number | null, order: 0, description: '' })

// 下拉刷新相关状态
const startY = ref(0)
const pullDistance = ref(0)
const isRefreshing = ref(false)
const MAX_PULL = 80       // 最大下拉距离
const TRIGGER_DIST = 50   // 触发刷新的阈值

// 计算属性
const dialogTitle = computed(() => (isEdit.value ? '编辑位置' : '新增位置'))
const parentNodeOptions = computed(() => {
  const treeData = locationStore.treeData
  if (!isEdit.value || !editingNodeId.value) return treeData
  const excludeIds = locationStore.getChildrenIds(editingNodeId.value)
  const filterTree = (nodes: TreeNode[]): TreeNode[] => {
    return nodes
      .filter((node) => !excludeIds.includes(node.id))
      .map((node) => ({
        ...node,
        children: node.children && node.children.length > 0 ? filterTree(node.children) : undefined,
      }))
  }
  return filterTree(treeData)
})

// --- 下拉刷新逻辑 ---
const handleTouchStart = (e: TouchEvent) => {
  // 如果不在移动端，或者正在刷新中，忽略
  if (!isMobile.value || isRefreshing.value) return
  
  // 只有当滚动条在顶部时才允许触发
  if (scrollContainerRef.value && scrollContainerRef.value.scrollTop > 0) return

  const firstTouch = e.touches?.[0]
  if (!firstTouch) return
  startY.value = firstTouch.clientY
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isMobile.value || isRefreshing.value || startY.value === 0) return
  
  const firstTouch = e.touches?.[0]
  if (!firstTouch) return
  const currentY = firstTouch.clientY
  const distance = currentY - startY.value
  
  // 滚动条不在顶部，不处理
  if (scrollContainerRef.value && scrollContainerRef.value.scrollTop > 0) return

  if (distance > 0) {
    // 阻止原生滚动，防止冲突（注意：这可能需要 touch-action: none 或 passive: false，但在 Vue 中 prevent 修饰符更简单，这里手动调用）
    if (e.cancelable) e.preventDefault()
    
    // 增加阻尼效果，拉得越长越难拉
    pullDistance.value = Math.min(distance * 0.4, MAX_PULL)
  } else {
    pullDistance.value = 0
  }
}

const handleTouchEnd = async () => {
  if (!isMobile.value || isRefreshing.value) return
  
  if (pullDistance.value >= TRIGGER_DIST) {
    // 触发刷新
    isRefreshing.value = true
    pullDistance.value = TRIGGER_DIST // 停留在加载位置
    
    try {
      await locationStore.fetchNodes()
      ElMessage.success('刷新成功')
    } catch (error) {
      ElMessage.error('刷新失败')
    } finally {
      // 延迟一下让动画自然
      setTimeout(() => {
        isRefreshing.value = false
        pullDistance.value = 0
        startY.value = 0
      }, 500)
    }
  } else {
    // 距离不够，回弹
    pullDistance.value = 0
    startY.value = 0
  }
}
// ----------------

const filterParentNodes = (query: string, node: TreeNode) => {
  if (!query) return true
  const label = node.label || ''
  const pathName = node.data?.path_name || ''
  return label.toLowerCase().includes(query.toLowerCase()) || pathName.toLowerCase().includes(query.toLowerCase())
}

const handleNodeClick = async (data: TreeNode) => {
  if (!data.data) return
  try {
    const nodeDetail = await getLocationNodeDetail(data.id)
    selectedNode.value = nodeDetail
    await loadNodeGoods(data.id, includeChildren.value)
    if (isMobile.value) mobileDrawerVisible.value = true
  } catch (err: any) {
    ElMessage.error(err.message || '获取节点详情失败')
  }
}

const loadNodeGoods = async (nodeId: number, includeChildrenFlag: boolean = false) => {
  if (!nodeId) return
  goodsLoading.value = true
  try {
    const response = await getLocationNodeGoods(nodeId, includeChildrenFlag)
    let results: GoodsListItem[] = []
    if (Array.isArray(response)) {
      results = response
    } else if (response && typeof response === 'object') {
      const responseObj = response as any
      if ('results' in responseObj && Array.isArray(responseObj.results)) {
        results = responseObj.results
      } else if (responseObj.id) {
        results = [responseObj]
      }
    }
    locationGuziList.value = results
  } catch (err: any) {
    locationGuziList.value = []
  } finally {
    goodsLoading.value = false
  }
}

const handleIncludeChildrenChange = (value: boolean) => {
  if (selectedNode.value) loadNodeGoods(selectedNode.value.id, value)
}

const handleAddNode = () => {
  isEdit.value = false
  editingNodeId.value = null
  formData.value = { name: '', parent: null, order: 0, description: '' }
  dialogVisible.value = true
}

const handleEditNode = (data: any) => {
  const rawData = data.data || data
  if (!rawData) return
  isEdit.value = true
  editingNodeId.value = data.id || rawData.id
  formData.value = {
    name: rawData.name,
    parent: rawData.parent,
    order: rawData.order,
    description: rawData.description || '',
  }
  dialogVisible.value = true
}

const handleDeleteNode = async (data: any) => {
  const nodeId = data.id || data.data?.id
  if (!nodeId) return
  const childrenIds = locationStore.getChildrenIds(nodeId)
  const hasChildren = childrenIds.length > 1
  try {
    await ElMessageBox.confirm(
      hasChildren ? `包含 ${childrenIds.length - 1} 个子节点，确认删除？` : '确定要删除这个位置吗？',
      '警告',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
    await deleteLocationNode(nodeId)
    ElMessage.success('删除成功')
    if (isMobile.value && selectedNode.value?.id === nodeId) {
      mobileDrawerVisible.value = false
      selectedNode.value = null
    }
    await locationStore.fetchNodes()
    if (!isMobile.value && selectedNode.value?.id === nodeId) {
      selectedNode.value = null
      locationGuziList.value = []
    }
  } catch (err) { /* cancel */ }
}

const handleSubmit = async () => {
  if (!formData.value.name.trim()) {
    ElMessage.warning('请输入位置名称')
    return
  }
  try {
    if (isEdit.value && editingNodeId.value) {
      const updateData: Partial<StorageNode> = {}
      if (formData.value.name) updateData.name = formData.value.name
      if (formData.value.parent !== undefined) updateData.parent = formData.value.parent
      if (formData.value.order !== undefined) updateData.order = formData.value.order
      if (formData.value.description !== undefined) updateData.description = formData.value.description
      await patchLocationNode(editingNodeId.value, updateData)
      ElMessage.success('更新成功')
      if (selectedNode.value && selectedNode.value.id === editingNodeId.value) {
         selectedNode.value = await getLocationNodeDetail(editingNodeId.value)
      }
    } else {
      await createLocationNode(formData.value)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await locationStore.fetchNodes()
  } catch (err: any) {
    ElMessage.error(err.message || '操作失败')
  }
}

const handleDialogClose = () => {
  formData.value = { name: '', parent: null, order: 0, description: '' }
}

const handleGuziClick = (goods: any) => {}

onMounted(async () => {
  window.addEventListener('resize', updateWidth)
  await locationStore.fetchNodes()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWidth)
})
</script>

<style scoped>
:root {
  --primary-gold: #cba26c;
  --text-dark: #333;
  --text-light: #666;
  --bg-gray: #f5f7fa;
}

.location-management {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  height: calc(100vh - 60px);
}

@media only screen and (max-width: 767px) {
  .location-management {
    padding: 10px;
    height: calc(100vh - 50px);
  }
  .main-layout {
    height: 100%;
    margin: 0 !important;
  }
  .tree-col {
    height: 100%;
    padding: 0 !important;
  }
}

.tree-card,
.detail-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  padding: 0 10px; /* 增加一点内边距适配移动端 */
}

/* 下拉刷新相关样式 */
.pull-refresh-wrapper {
  position: relative;
  flex: 1;
  overflow-y: auto; /* 关键：让这个容器负责滚动 */
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.pull-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  overflow: hidden;
  display: flex;
  align-items: flex-end; /* 让内容在底部 */
  justify-content: center;
  z-index: 10;
  pointer-events: none; /* 穿透点击 */
}

.indicator-content {
  height: 50px; /* 阈值高度 */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  color: #909399;
  padding-bottom: 10px;
}

.indicator-content .el-icon {
  font-size: 18px;
  transition: transform 0.3s;
}

.tree-content-inner {
  transition: transform 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28); /* 平滑回弹 */
  will-change: transform;
  min-height: 100%;
}
/* ---------------- */

.custom-tree {
  padding: 10px;
}

.tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
  padding-right: 8px;
  width: 100%;
}

.node-label {
  flex: 1;
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.el-tree-node__content) {
  height: 44px;
  border-radius: 4px;
}

:deep(.el-tree-node__content:hover) {
  background-color: var(--el-fill-color-light);
}

.node-actions { display: flex; gap: 4px; }
.node-arrow { color: #ccc; font-size: 12px; }

/* 详情样式 */
:deep(.node-detail) { padding: 16px; display: flex; flex-direction: column; gap: 20px; }
:deep(.node-image) { width: 100%; aspect-ratio: 16/9; border-radius: 8px; overflow: hidden; background-color: #f0f0f0; }
:deep(.node-info) { display: flex; flex-direction: column; gap: 12px; }
:deep(.info-item) { display: flex; gap: 12px; font-size: 14px; align-items: baseline; }
:deep(.info-item.column-layout) { flex-direction: column; gap: 6px; }
:deep(.info-label) { min-width: 70px; color: #909399; font-weight: 500; }
:deep(.info-value) { color: #303133; line-height: 1.5; }
:deep(.path-value) { font-family: monospace; background: #f4f4f5; padding: 2px 6px; border-radius: 4px; color: #666; font-size: 12px; }
:deep(.notes) { padding: 10px; background-color: #f9fafe; border-radius: 6px; width: 100%; box-sizing: border-box; font-size: 13px; color: #666; }
:deep(.section-header) { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
:deep(.section-title) { font-size: 16px; font-weight: bold; margin: 0; display: flex; align-items: center; gap: 6px; }
:deep(.count-badge) { background: #f0f2f5; color: #909399; font-size: 12px; padding: 2px 6px; border-radius: 10px; }
:deep(.custom-switch-label) { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #606266; }
:deep(.guzi-grid) { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
@media only screen and (max-width: 767px) {
  :deep(.guzi-grid) { grid-template-columns: repeat(2, 1fr); gap: 10px; }
}
:deep(.empty-guzi) { text-align: center; padding: 30px 0; color: #999; font-size: 14px; }

/* 移动端抽屉 */
.mobile-detail-drawer { border-radius: 16px 16px 0 0 !important; }
.mobile-drawer-content { height: 100%; display: flex; flex-direction: column; }
.sticky-header { position: sticky; top: 0; background: #fff; z-index: 10; padding: 16px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
.drawer-title { font-size: 18px; font-weight: bold; margin: 0; color: #333; }
.drawer-actions { display: flex; gap: 8px; }
.drawer-body { flex: 1; overflow-y: auto; padding-bottom: 20px; }

/* 弹窗 */
.responsive-dialog { max-width: 100vw; }
.dialog-form { padding: 10px 0; }
.parent-select-wrapper { width: 100%; }
.form-tip-mobile { font-size: 12px; color: #909399; margin-top: 4px; }

@media only screen and (max-width: 767px) {
  .hidden-xs-only { display: none !important; }
}
@media only screen and (min-width: 768px) {
  .hidden-sm-and-up { display: none !important; }
}
</style>