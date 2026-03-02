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

    <!-- 统计信息栏 -->
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">全部主题</span>
        <span class="stat-value">{{ allThemes.length }}</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-label">筛选结果</span>
        <span class="stat-value highlight">{{ filteredThemeList.length }}</span>
      </div>
    </div>

    <el-card class="search-card" shadow="never">
      <div class="search-filter-container">
        <div class="search-row">
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
        <div class="filter-row">
          <el-select
            v-model="sortBy"
            placeholder="排序方式"
            clearable
            @change="handleSortChange"
            class="sort-select"
          >
            <el-option label="创建时间正序" value="created_asc" />
            <el-option label="创建时间倒序" value="created_desc" />
            <el-option label="名称正序" value="name_asc" />
            <el-option label="名称倒序" value="name_desc" />
          </el-select>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            clearable
            @change="handleDateRangeChange"
            class="date-picker"
          />
          <el-button v-if="hasActiveFilters" text type="primary" @click="clearFilters">
            <el-icon><Close /></el-icon>
            清除筛选
          </el-button>
        </div>
      </div>
    </el-card>
    <!-- ================= 顶部区域结束 ================= -->

    <div v-loading="loading" class="content-body">
      <!-- PC端视图 -->
      <div class="hidden-xs-only desktop-view">
        <div class="table-container" ref="tableContainerRef">
          <el-table
            :data="paginatedThemeList"
            style="width: 100%"
            class="pc-table"
            row-key="id"
            border-radius="12"
            :height="tableHeight"
          >
            <el-table-column prop="name" label="主题名称" min-width="200" fixed>
              <template #default="{ row }">
                <div class="theme-item-name">
                  <el-icon class="theme-icon"><Star /></el-icon>
                  <span class="theme-name-text">{{ row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="300">
              <template #default="{ row }">
                <el-tooltip :content="row.description || '无描述'" placement="top" :show-after="500">
                  <span class="description-text">{{ row.description || '—' }}</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180" sortable>
              <template #default="{ row }">
                <span class="time-text">{{ formatDate(row.created_at) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="right" fixed="right">
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

        <!-- 分页控件 -->
        <div class="pagination-wrapper" v-if="filteredThemeList.length > 0">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="filteredThemeList.length"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>

      <!-- 移动端视图 -->
      <div class="visible-xs-only mobile-list-container">
        <!-- 移动端筛选状态栏 -->
        <div class="mobile-filter-bar" v-if="hasActiveFilters">
          <span class="filter-result">找到 {{ filteredThemeList.length }} 个结果</span>
          <el-button text size="small" @click="clearFilters">
            <el-icon><Close /></el-icon>
            清除
          </el-button>
        </div>

        <!-- 下拉刷新容器 -->
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
          <div class="theme-list-inner" :style="{ transform: `translateY(${pullDistance}px)` }">
            <!-- 移动端使用分页加载更多 -->
            <div
              v-for="item in mobileDisplayList"
              :key="item.id"
              class="mobile-card"
            >
              <div class="mobile-card-left" @click="handleEdit(item)">
                <div class="icon-placeholder">
                  <el-icon><Star /></el-icon>
                </div>
                <div class="card-info">
                  <div class="card-name">{{ item.name }}</div>
                  <div class="card-description">{{ item.description || '暂无描述' }}</div>
                  <div class="card-meta">
                    <span class="card-time">{{ formatDate(item.created_at) }}</span>
                  </div>
                </div>
              </div>
              <div class="mobile-card-right">
                <div class="mobile-more" @click.stop="openMobileActions(item)">
                  <el-icon><MoreFilled /></el-icon>
                </div>
              </div>
            </div>

            <!-- 加载更多按钮 -->
            <div class="load-more-wrapper" v-if="hasMoreMobileData">
              <el-button @click="loadMoreMobile" :loading="loadingMore">
                加载更多
              </el-button>
            </div>

            <el-empty v-if="!loading && mobileDisplayList.length === 0" description="暂无主题数据" />
          </div>
        </div>
      </div>

      <!-- 无数据时的空状态引导 -->
      <div v-if="!loading && filteredThemeList.length === 0 && hasActiveFilters" class="empty-filter-result">
        <el-empty description="没有找到匹配的主题">
          <el-button type="primary" @click="clearFilters">清除筛选条件</el-button>
        </el-empty>
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
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { Plus, Search, Star, Refresh, Loading, Top, MoreFilled, Edit, Delete, Picture, Close } from '@element-plus/icons-vue'
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

interface ExistingThemeImage extends ThemeImage {
  label?: string
  originalLabel?: string
}

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

const windowWidth = ref(window.innerWidth)
const isMobile = computed(() => windowWidth.value < 768)

const mobileDrawerVisible = ref(false)
const currentActionRow = ref<Theme | null>(null)

const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth
}

const authStore = useAuthStore()
const metadataStore = useMetadataStore()

const scrollContainerRef = ref<HTMLElement | null>(null)
const startY = ref(0)
const pullDistance = ref(0)
const isRefreshing = ref(false)
const MAX_PULL = 80
const TRIGGER_DIST = 50

const sortBy = ref<string>('')
const dateRange = ref<[string, string] | null>(null)

const currentPage = ref(1)
const pageSize = ref(20)
const tableContainerRef = ref<HTMLElement | null>(null)
const tableHeight = ref(400)

const mobilePageSize = 10
const mobileDisplayList = ref<Theme[]>([])
const loadingMore = ref(false)

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

const hasActiveFilters = computed(() => {
  return searchText.value.trim() !== '' || sortBy.value !== '' || (dateRange.value !== null && dateRange.value.length === 2)
})

const filteredThemeList = computed(() => {
  let result = [...allThemes.value]

  const keyword = searchText.value.trim().toLowerCase()
  if (keyword) {
    result = result.filter(theme =>
      theme.name.toLowerCase().includes(keyword) ||
      (theme.description && theme.description.toLowerCase().includes(keyword))
    )
  }

  if (dateRange.value && dateRange.value.length === 2) {
    const [startDate, endDate] = dateRange.value
    result = result.filter(theme => {
      if (!theme.created_at) return false
      const themeDate = theme.created_at.split('T')[0] || ''
      return themeDate >= startDate && themeDate <= endDate
    })
  }

  if (sortBy.value) {
    switch (sortBy.value) {
      case 'created_asc':
        result.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
        break
      case 'created_desc':
        result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        break
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
        break
      case 'name_desc':
        result.sort((a, b) => b.name.localeCompare(a.name, 'zh-CN'))
        break
    }
  } else {
    result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
  }

  return result
})

const paginatedThemeList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredThemeList.value.slice(start, end)
})

const hasMoreMobileData = computed(() => {
  return mobileDisplayList.value.length < filteredThemeList.value.length
})

watch(filteredThemeList, () => {
  currentPage.value = 1
  updateMobileDisplayList()
}, { immediate: false })

const updateMobileDisplayList = () => {
  mobileDisplayList.value = filteredThemeList.value.slice(0, mobilePageSize)
}

const loadMoreMobile = () => {
  loadingMore.value = true
  setTimeout(() => {
    const currentLength = mobileDisplayList.value.length
    const nextBatch = filteredThemeList.value.slice(currentLength, currentLength + mobilePageSize)
    mobileDisplayList.value = [...mobileDisplayList.value, ...nextBatch]
    loadingMore.value = false
  }, 300)
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

const handleSortChange = () => {
  currentPage.value = 1
}

const handleDateRangeChange = () => {
  currentPage.value = 1
}

const clearFilters = () => {
  searchText.value = ''
  sortBy.value = ''
  dateRange.value = null
  currentPage.value = 1
}

const updateTableHeight = () => {
  if (tableContainerRef.value && windowWidth.value >= 768) {
    const containerRect = tableContainerRef.value.getBoundingClientRect()
    const windowHeight = window.innerHeight
    const headerHeight = 64
    const searchCardHeight = 180
    const paginationHeight = 72
    const availableHeight = windowHeight - headerHeight - searchCardHeight - paginationHeight - 40
    tableHeight.value = Math.max(200, Math.min(availableHeight, 800))
  }
}

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
    allThemes.value = data || []
    updateMobileDisplayList()
    updateTableHeight()
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
  window.addEventListener('resize', updateTableHeight)
  fetchThemeList()
  nextTick(() => {
    updateTableHeight()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth)
  window.removeEventListener('resize', updateTableHeight)
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

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.sub-title {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
  display: block;
}

/* 统计信息栏 */
.stats-bar {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #f6f4ff 0%, #ebe7ff 100%);
  border-radius: 12px;
  padding: 14px 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(142, 125, 255, 0.1);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  font-size: 13px;
  color: #606266;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.stat-value.highlight {
  color: #8e7dff;
}

.stat-divider {
  width: 1px;
  height: 24px;
  background: #dcdfe6;
  margin: 0 20px;
}

/* 搜索卡片 */
.search-card {
  border-radius: 12px;
  border: none;
  margin-bottom: 20px;
}

.search-filter-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-row {
  display: flex;
  gap: 8px;
}

.filter-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.custom-search {
  flex: 1;
}

.sort-select {
  width: 140px;
}

.date-picker {
  width: 280px;
}

.add-btn, .search-btn, .submit-btn {
  background: linear-gradient(135deg, #a396ff 0%, #8e7dff 100%);
  border: none;
  border-radius: 8px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* PC端表格容器 */
.desktop-view {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.table-container {
  overflow: hidden;
}

.pc-table {
  border-radius: 12px;
}

/* 分页控件 */
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
  background: #fff;
  border-top: 1px solid #f0f2f5;
}

.pagination-wrapper :deep(.el-pagination) {
  --el-pagination-bg-color: #f5f7fa;
  --el-pagination-hover-color: #8e7dff;
}

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

/* PC 表格样式 */
.theme-item-name {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
  color: #444;
}

.theme-icon {
  color: #8e7dff;
  font-size: 18px;
}

.theme-name-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.description-text {
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  max-width: 280px;
}

.no-images {
  color: #c0c4cc;
  font-style: italic;
}

.time-text {
  color: #909399;
  font-size: 13px;
}

.image-count-tag {
  background: linear-gradient(135deg, #f6f4ff 0%, #ebe7ff 100%);
  border-color: #d9d4ff;
  color: #8e7dff;
}

.action-inline {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.action-divider {
  display: inline-block;
  width: 1px;
  height: 16px;
  background: #e4e7ed;
}

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

.mobile-filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: linear-gradient(135deg, #f6f4ff 0%, #ebe7ff 100%);
  border-radius: 10px;
  margin-bottom: 12px;
}

.filter-result {
  font-size: 14px;
  color: #606266;
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
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-word;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
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

/* 加载更多 */
.load-more-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.load-more-wrapper .el-button {
  background: linear-gradient(135deg, #f6f4ff 0%, #ebe7ff 100%);
  border-color: #d9d4ff;
  color: #8e7dff;
}

.load-more-wrapper .el-button:hover {
  background: linear-gradient(135deg, #a396ff 0%, #8e7dff 100%);
  color: #fff;
}

/* 空结果筛选 */
.empty-filter-result {
  padding: 40px 20px;
  background: #fff;
  border-radius: 12px;
  margin-top: 16px;
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

  .stats-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 12px 16px;
  }

  .stat-divider {
    display: none;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .sort-select,
  .date-picker {
    width: 100%;
  }

  .hidden-xs-only { display: none !important; }

  .theme-list-wrapper {
    box-shadow: none !important;
    background: transparent !important;
    padding: 0;
    min-height: auto;
  }

  .desktop-view {
    display: none;
  }

  .mobile-list-container {
    display: block;
  }
}

@media (min-width: 769px) {
  .visible-xs-only { display: none !important; }
  .desktop-view { display: block; }
}
</style>

