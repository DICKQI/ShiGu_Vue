<template>
  <div class="theme-management-container">
    <!-- ================= 顶部区域 ================= -->
    <div class="header-section">
      <div class="title-wrapper">
        <h2 class="page-title">主题管理</h2>
        <span class="sub-title">配置谷子的主题分类（如：夏日主题、节日主题等）</span>
      </div>
      <div class="header-actions">
        <el-button class="add-btn" type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          <span>新增主题</span>
        </el-button>
      </div>
    </div>

    <el-card class="search-card" shadow="never">
      <div class="search-flex">
        <el-input
          v-model="searchText"
          placeholder="搜索主题名称或描述..."
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
          class="custom-search"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button class="search-btn" type="primary" @click="handleSearch">搜索</el-button>
      </div>
    </el-card>
    <!-- ================= 顶部区域结束 ================= -->

    <div v-loading="loading" class="content-body">
      <!-- 下拉刷新容器 -->
      <div
        class="theme-list-wrapper pull-refresh-wrapper"
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
        <div class="theme-list-inner" :style="{ transform: `translateY(${pullDistance}px)` }">

          <!-- 【PC端视图】 -->
          <div class="hidden-xs-only desktop-view">
            <el-table
              :data="filteredThemeList"
              style="width: 100%"
              class="pc-table"
              row-key="id"
              border-radius="12"
            >
              <el-table-column prop="name" label="主题名称" min-width="200">
                <template #default="{ row }">
                  <div class="theme-item-name">
                    <el-icon class="theme-icon"><Star /></el-icon>
                    <span>{{ row.name }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="描述" min-width="300">
                <template #default="{ row }">
                  <span class="description-text">{{ row.description || '—' }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="created_at" label="创建时间" width="180">
                <template #default="{ row }">
                  <span class="time-text">{{ formatDate(row.created_at) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="180" align="right">
                <template #default="{ row }">
                  <div class="action-inline">
                    <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
                    <span class="action-divider" />
                    <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 【移动端视图】 -->
          <div class="visible-xs-only mobile-list-container">
            <div
              v-for="item in filteredThemeList"
              :key="item.id"
              class="mobile-card"
            >
              <div class="mobile-card-left" @click="handleMobileCardClick(item)">
                <div class="icon-placeholder">
                  <el-icon><Star /></el-icon>
                </div>
                <div class="card-info">
                  <div class="card-name">{{ item.name }}</div>
                  <div class="card-description">{{ item.description || '暂无描述' }}</div>
                  <div class="card-time">{{ formatDate(item.created_at) }}</div>
                </div>
              </div>
              <div class="mobile-card-right">
                <div class="mobile-more" @click.stop="openMobileActions(item)">
                  <el-icon><MoreFilled /></el-icon>
                </div>
              </div>
            </div>
          </div>

          <el-empty v-if="!loading && filteredThemeList.length === 0" description="暂无主题数据" />
        </div>
      </div>
    </div>

    <!-- 刷新按钮 - 右下角悬浮（仅PC端） -->
    <div class="refresh-fab hidden-xs-only" @click="handleRefresh" :class="{ loading: loading }">
      <el-icon v-if="!loading"><Refresh /></el-icon>
      <el-icon v-else class="is-loading"><Loading /></el-icon>
    </div>

    <!-- 弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :width="isEdit && editingId ? '560px' : '400px'"
      class="custom-dialog"
      align-center
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-position="top">
        <el-form-item label="主题名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入主题名称，如：夏日主题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="主题描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            placeholder="请输入主题描述（可选）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <!-- 主题附加图片（仅编辑模式显示） -->
        <el-form-item v-if="isEdit && editingId" label="主题附加图片">
          <div v-loading="loadingThemeDetail" class="theme-additional-photos-section">
            <!-- 已有图片 -->
              <div v-if="existingThemeImages.length > 0" class="existing-theme-photos">
                <div
                  v-for="(photo, index) in existingThemeImages"
                  :key="photo.id"
                  class="theme-photo-item"
                >
                  <el-image
                    :src="photo.image"
                    fit="cover"
                    class="theme-photo-preview"
                    :preview-src-list="existingThemeImages.map((p) => p.image)"
                    :initial-index="index"
                  >
                    <template #error>
                      <div class="theme-image-error">
                        <el-icon><Picture /></el-icon>
                      </div>
                    </template>
                  </el-image>
                  <div class="theme-photo-actions">
                    <el-input
                      v-model="photo.label"
                      placeholder="图片标签（可选）"
                      size="small"
                      class="theme-photo-label-input"
                      @blur="handleThemePhotoLabelChange(photo)"
                    />
                    <el-button
                      type="danger"
                      size="small"
                      :icon="Delete"
                      circle
                      @click="handleRemoveExistingThemePhoto(photo.id)"
                    />
                  </div>
                </div>
              </div>

              <!-- 待上传的新图片 -->
              <div v-if="newThemePhotoFiles.length > 0" class="new-theme-photos">
                <div
                  v-for="(file, index) in newThemePhotoFiles"
                  :key="index"
                  class="theme-photo-item"
                >
                  <el-image
                    :src="file.preview"
                    fit="cover"
                    class="theme-photo-preview"
                  >
                    <template #error>
                      <div class="theme-image-error">
                        <el-icon><Picture /></el-icon>
                      </div>
                    </template>
                  </el-image>
                  <div class="theme-photo-actions">
                    <el-input
                      v-model="file.label"
                      placeholder="图片标签（可选）"
                      size="small"
                      class="theme-photo-label-input"
                    />
                    <el-button
                      type="danger"
                      size="small"
                      :icon="Delete"
                      circle
                      @click="handleRemoveNewThemePhoto(index)"
                    />
                  </div>
                </div>
              </div>

              <!-- 上传按钮 -->
              <el-upload
                v-model:file-list="themeImageUploadList"
                list-type="picture-card"
                :auto-upload="false"
                :on-change="handleThemePhotoChange"
                :on-remove="handleThemePhotoUploadRemove"
                :http-request="dummyThemeUpload"
                :show-file-list="false"
                accept="image/*"
                multiple
                class="theme-photo-upload"
              >
                <template #trigger>
                  <el-icon><Plus /></el-icon>
                </template>
              </el-upload>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" class="submit-btn" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>

    <!-- 移动端底部操作面板 -->
    <el-drawer
      v-model="mobileDrawerVisible"
      direction="btt"
      :with-header="false"
      size="auto"
      class="mobile-action-drawer"
    >
      <div class="action-sheet-content">
        <div class="sheet-header">
          对 "{{ currentActionRow?.name }}" 进行操作
        </div>
        <div class="sheet-menu">
          <div class="sheet-item" @click="handleMobileEdit">
            <el-icon><Edit /></el-icon> 编辑主题
          </div>
          <div class="sheet-item danger" @click="handleMobileDelete">
            <el-icon><Delete /></el-icon> 删除主题
          </div>
        </div>
        <div class="sheet-cancel" @click="mobileDrawerVisible = false">取消</div>
      </div>
    </el-drawer>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Plus, Search, Star, Refresh, Loading, Top, MoreFilled, Edit, Delete, Picture } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useMetadataStore } from '@/stores/metadata'
import {
  getThemeList,
  getThemeDetail,
  createTheme,
  updateTheme,
  deleteTheme,
  uploadThemeImages,
  updateThemeImageLabel,
  deleteThemeImage,
} from '@/api/metadata'
import type { Theme, ThemeImage } from '@/api/types'

// 主题附加图片：已有图项（带原始标签用于判断是否修改）
interface ExistingThemeImage extends ThemeImage {
  label?: string
  originalLabel?: string
}
// 待上传的新图项
interface NewThemePhotoFile {
  file: File
  preview: string
  label?: string
}

const loading = ref(false)
const submitting = ref(false)
const searchText = ref('')
const allThemes = ref<Theme[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

// 窗口宽度响应式
const windowWidth = ref(window.innerWidth)
const isMobile = computed(() => windowWidth.value < 768)

// 移动端操作相关
const mobileDrawerVisible = ref(false)
const currentActionRow = ref<Theme | null>(null)

const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth
}

const authStore = useAuthStore()
const metadataStore = useMetadataStore()

// 下拉刷新相关状态
const scrollContainerRef = ref<HTMLElement | null>(null)
const startY = ref(0)
const pullDistance = ref(0)
const isRefreshing = ref(false)
const MAX_PULL = 80
const TRIGGER_DIST = 50

const getScrollTop = () => {
  return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
}

const handleTouchStart = (e: TouchEvent) => {
  if (!isMobile.value || isRefreshing.value) return

  if (getScrollTop() > 0) {
    startY.value = 0
    return
  }

  const firstTouch = e.touches?.[0]
  if (!firstTouch) return
  startY.value = firstTouch.clientY
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isMobile.value || isRefreshing.value || startY.value === 0) return

  if (getScrollTop() > 0) return

  const firstTouch = e.touches?.[0]
  if (!firstTouch) return
  const currentY = firstTouch.clientY
  const distance = currentY - startY.value

  if (distance > 0) {
    if (e.cancelable) e.preventDefault()
    pullDistance.value = Math.min(distance * 0.4, MAX_PULL)
  } else {
    pullDistance.value = 0
  }
}

const handleTouchEnd = async () => {
  if (!isMobile.value || isRefreshing.value) return
  if (pullDistance.value >= TRIGGER_DIST) {
    isRefreshing.value = true
    pullDistance.value = TRIGGER_DIST
    try {
      await fetchThemeList(true)
      ElMessage.success('刷新成功')
    } catch (error) {
      ElMessage.error('刷新失败')
    } finally {
      setTimeout(() => {
        isRefreshing.value = false
        pullDistance.value = 0
        startY.value = 0
      }, 500)
    }
  } else {
    pullDistance.value = 0
    startY.value = 0
  }
}

const formData = ref({
  name: '',
  description: '',
})

// 主题附加图片状态（仅编辑时使用）
const existingThemeImages = ref<ExistingThemeImage[]>([])
const newThemePhotoFiles = ref<NewThemePhotoFile[]>([])
const themeImageUploadList = ref<UploadFile[]>([])
const loadingThemeDetail = ref(false)

const dummyThemeUpload = () => {}

const formRules: FormRules = {
  name: [
    { required: true, message: '主题名称不能为空', trigger: 'blur' },
    { max: 100, message: '主题名称不能超过100个字符', trigger: 'blur' }
  ],
  description: [
    { max: 500, message: '描述不能超过500个字符', trigger: 'blur' }
  ],
}

const dialogTitle = computed(() => isEdit.value ? '✨ 修改主题' : '✨ 新增主题')

const filteredThemeList = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()
  if (!keyword) return allThemes.value

  return allThemes.value.filter(theme =>
    theme.name.toLowerCase().includes(keyword) ||
    (theme.description && theme.description.toLowerCase().includes(keyword))
  )
})

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '—'
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '—'
  }
}

const fetchThemeList = async (force = false) => {
  loading.value = true
  try {
    const data = await metadataStore.fetchThemes(force)
    allThemes.value = data
  } finally {
    loading.value = false
  }
}

const handleSearch = () => fetchThemeList()
const handleRefresh = () => fetchThemeList(true)

const handleAdd = () => {
  isEdit.value = false
  editingId.value = null
  formData.value = { name: '', description: '店铺：\n工艺：\n画师：\n主题：' }
  existingThemeImages.value = []
  newThemePhotoFiles.value = []
  dialogVisible.value = true
}

const handleEdit = async (row: Theme) => {
  isEdit.value = true
  editingId.value = row.id
  formData.value = {
    name: row.name,
    description: row.description || ''
  }
  existingThemeImages.value = []
  newThemePhotoFiles.value = []
  dialogVisible.value = true
  loadingThemeDetail.value = true
  try {
    const detail = await getThemeDetail(row.id)
    existingThemeImages.value = (detail.images || []).map((img) => ({
      ...img,
      label: img.label ?? '',
      originalLabel: img.label ?? '',
    }))
  } catch {
    ElMessage.error('加载主题详情失败')
  } finally {
    loadingThemeDetail.value = false
  }
}

const handleDelete = async (row: Theme) => {
  try {
    await ElMessageBox.confirm(
      `确定删除主题《${row.name}》吗？删除后，关联到该主题的谷子的主题字段将被清空。`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    await deleteTheme(row.id)
    ElMessage.success('已删除')
    fetchThemeList(true)
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const openMobileActions = (row: Theme) => {
  currentActionRow.value = row
  mobileDrawerVisible.value = true
}

const handleMobileCardClick = (row: Theme) => {
  handleEdit(row)
}

const handleMobileEdit = () => {
  if (currentActionRow.value) {
    handleEdit(currentActionRow.value)
    mobileDrawerVisible.value = false
  }
}

const handleMobileDelete = () => {
  if (currentActionRow.value) {
    mobileDrawerVisible.value = false
    handleDelete(currentActionRow.value)
  }
}

// 主题附加图片：标签失焦保存
const handleThemePhotoLabelChange = async (photo: ExistingThemeImage) => {
  if (!editingId.value || photo.originalLabel === photo.label) return
  try {
    const label = photo.label?.trim() ?? ''
    await updateThemeImageLabel(editingId.value, [photo.id], label)
    photo.originalLabel = photo.label
    ElMessage.success('标签已更新')
  } catch (err: any) {
    photo.label = photo.originalLabel
    ElMessage.error('标签更新失败：' + (err?.message || '未知错误'))
  }
}

// 主题附加图片：删除已有图
const handleRemoveExistingThemePhoto = async (photoId: number) => {
  if (!editingId.value) return
  try {
    await ElMessageBox.confirm('确定要删除这张图片吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await deleteThemeImage(editingId.value, photoId)
    existingThemeImages.value = existingThemeImages.value.filter((p) => p.id !== photoId)
    ElMessage.success('已删除')
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error('删除失败：' + (err?.message || '未知错误'))
    }
  }
}

// 主题附加图片：选择新文件
const handleThemePhotoChange = (uploadFile: UploadFile) => {
  const file = uploadFile.raw
  if (file) {
    newThemePhotoFiles.value.push({
      file,
      preview: URL.createObjectURL(file),
      label: '',
    })
  }
  themeImageUploadList.value = []
}

const handleThemePhotoUploadRemove = () => {
  themeImageUploadList.value = []
}

// 主题附加图片：移除待上传的新图
const handleRemoveNewThemePhoto = (index: number) => {
  const item = newThemePhotoFiles.value[index]
  if (item?.preview) URL.revokeObjectURL(item.preview)
  newThemePhotoFiles.value.splice(index, 1)
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const payload = {
        name: formData.value.name.trim(),
        description: formData.value.description?.trim() || null,
      }
      if (isEdit.value && editingId.value) {
        await updateTheme(editingId.value, payload)
        // 上传本次添加的新附加图片
        for (const photo of newThemePhotoFiles.value) {
          await uploadThemeImages(editingId.value!, [photo.file], {
            label: photo.label?.trim() ?? '',
          })
        }
        newThemePhotoFiles.value.forEach((p) => {
          if (p.preview) URL.revokeObjectURL(p.preview)
        })
        newThemePhotoFiles.value = []
        ElMessage.success('更新成功')
      } else {
        await createTheme(payload)
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      fetchThemeList(true)
    } catch (error: any) {
      ElMessage.error(error?.response?.data?.detail || (isEdit.value ? '更新失败' : '创建失败'))
    } finally {
      submitting.value = false
    }
  })
}

onMounted(() => {
  window.addEventListener('resize', updateWindowWidth)
  fetchThemeList()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth)
  newThemePhotoFiles.value.forEach((p) => {
    if (p.preview) URL.revokeObjectURL(p.preview)
  })
})
</script>

<style scoped>
/* =========== PC/通用基础样式 =========== */
.theme-management-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: calc(100vh - 64px);
}
.header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-title { font-size: 22px; font-weight: 600; color: #303133; margin: 0; }
.sub-title { font-size: 13px; color: #909399; margin-top: 4px; display: block; }

.search-card { border-radius: 12px; border: none; margin-bottom: 20px; }
.search-flex { display: flex; gap: 8px; }
.custom-search { flex: 1; }

.add-btn, .search-btn, .submit-btn {
  background: linear-gradient(135deg, #a396ff 0%, #8e7dff 100%);
  border: none; border-radius: 8px;
}

.header-actions { display: flex; align-items: center; gap: 8px; }

/* PC端列表外壳 */
.theme-list-wrapper {
  background: transparent;
  position: relative;
  min-height: 200px;
}

.theme-list-inner {
  transition: transform 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28);
  will-change: transform;
}

/* 下拉刷新样式 */
.pull-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 10;
  pointer-events: none;
}

.indicator-content {
  height: 50px;
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

/* PC端表格容器样式 */
.desktop-view {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

/* PC 表格样式 */
.theme-item-name { display: flex; align-items: center; gap: 10px; font-weight: 500; color: #444; }
.theme-icon { color: #8e7dff; font-size: 18px; }
.description-text { color: #606266; }
.time-text { color: #909399; font-size: 13px; }
.action-inline { display: flex; align-items: center; justify-content: flex-end; gap: 10px; }
.action-divider { display: inline-block; width: 1px; height: 16px; background: #e4e7ed; }
.action-inline :deep(.el-button.is-link:focus-visible),
.action-inline :deep(.el-button.is-link:focus),
.action-inline :deep(.el-button.is-link:active) {
  box-shadow: none !important;
  outline: none !important;
  background-color: transparent !important;
}

/* PC 刷新按钮 */
.refresh-fab {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #a396ff 0%, #8e7dff 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 30px;
  box-shadow: 0 4px 16px rgba(163, 150, 255, 0.4);
  cursor: pointer;
  transition: all 0.3s;
  z-index: 999;
}
.refresh-fab:hover { transform: scale(1.1) rotate(180deg); }
.refresh-fab .is-loading { animation: rotate 1s linear infinite; }

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* =========== 移动端适配样式 =========== */

.mobile-list-container {
  padding: 0;
  background-color: transparent;
  border-radius: 0;
}

.mobile-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: all 0.2s;
  cursor: pointer;
  border: 1px solid #f2f3f5;
}

.mobile-card:active {
  background-color: #fafafa;
  transform: scale(0.98);
}

.mobile-card:last-child {
  margin-bottom: 0;
}

.mobile-card-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.icon-placeholder {
  width: 40px;
  height: 40px;
  background: #f0f2f5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8e7dff;
  font-size: 20px;
  flex-shrink: 0;
}

.card-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.card-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.card-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
  overflow: hidden;
  /* 移动端长描述多行截断，最多显示两行 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
}

.card-time {
  font-size: 12px;
  color: #999;
}

.mobile-card-right {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ccc;
  font-size: 18px;
  flex-shrink: 0;
}

.mobile-more {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 底部动作面板样式 */
.action-sheet-content {
  background: #f8f8f8;
  padding-bottom: env(safe-area-inset-bottom);
}

.sheet-header {
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: #909399;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.sheet-menu {
  background: #fff;
}

.sheet-item {
  padding: 16px;
  text-align: center;
  font-size: 16px;
  border-bottom: 1px solid #f5f5f5;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.sheet-item:active {
  background: #f5f5f5;
}

.sheet-item.danger {
  color: #f56c6c;
}

.sheet-cancel {
  margin-top: 8px;
  background: #fff;
  padding: 16px;
  text-align: center;
  font-size: 16px;
  color: #333;
}

.sheet-cancel:active {
  background: #f5f5f5;
}

/* 主题附加图片区块 */
.theme-additional-photos-section {
  width: 100%;
}

.existing-theme-photos,
.new-theme-photos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.theme-photo-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.theme-photo-preview {
  width: 100%;
  height: 120px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color);
  overflow: hidden;
}

.theme-image-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #c0c4cc;
  font-size: 24px;
}

.theme-photo-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.theme-photo-label-input {
  flex: 1;
  min-width: 0;
}

.theme-photo-upload :deep(.el-upload--picture-card) {
  width: 120px;
  height: 120px;
  border-radius: 4px;
  border: 1px dashed var(--el-border-color);
}

.theme-photo-upload :deep(.el-upload--picture-card:hover) {
  border-color: #8e7dff;
}

@media (max-width: 768px) {
  .existing-theme-photos,
  .new-theme-photos {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
  }

  .theme-photo-preview {
    height: 100px;
  }

  .theme-photo-upload :deep(.el-upload--picture-card) {
    width: 100px;
    height: 100px;
  }
}

/* 响应式断点控制 */
@media (max-width: 768px) {
  .theme-management-container { padding: 16px; }
  .add-btn span { display: none; }
  .add-btn { width: 40px; height: 40px; border-radius: 50%; padding: 0; justify-content: center; }

  .sub-title {
    font-size: 12px;
    display: block;
    margin-top: 4px;
    line-height: 1.4;
    color: #909399;
    max-width: 260px;
  }

  .hidden-xs-only { display: none !important; }

  .theme-list-wrapper {
    box-shadow: none !important;
    background: transparent !important;
    padding: 0;
    min-height: auto;
  }
}

@media (min-width: 769px) {
  .visible-xs-only { display: none !important; }
}
</style>

