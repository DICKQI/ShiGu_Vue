<template>
  <div class="goods-form">
    <div class="goods-form-header">
      <div class="goods-form-title">
        {{ formTitle }}
      </div>
    </div>

    <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        label-position="top"
        class="goods-el-form"
      >
        <!-- 基础信息分区 -->
        <section class="form-section form-section--basic">
          <div class="form-section-header">
            <h3 class="form-section-title">基础信息</h3>
            <p class="form-section-subtitle">IP、角色与品类等核心信息</p>
          </div>
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12">
              <el-form-item label="谷子名称" prop="name" class="is-required">
                <el-input v-model="formData.name" placeholder="请输入谷子名称" />
              </el-form-item>
            </el-col>

            <el-col :xs="24" :sm="12">
              <el-form-item label="IP作品" prop="ip" class="is-required">
                <el-select
                  v-model="formData.ip"
                  placeholder="选择IP"
                  filterable
                  @change="handleIpChange"
                  style="width: 100%"
                >
                  <el-option
                    v-for="ip in ipOptions"
                    :key="ip.id"
                    :label="ip.name"
                    :value="ip.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :xs="24" :sm="12">
              <el-form-item label="角色" prop="characters" class="is-required">
                <el-select
                  v-model="formData.characters"
                  placeholder="选择角色（可多选）"
                  filterable
                  multiple
                  :disabled="!formData.ip"
                  style="width: 100%"
                >
                  <el-option
                    v-for="char in filteredCharacters"
                    :key="char.id"
                    :label="char.name"
                    :value="char.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :xs="24" :sm="12">
              <el-form-item label="品类" prop="category" class="is-required">
                <el-tree-select
                  v-model="formData.category"
                  :data="categoryTreeOptions"
                  :props="{ label: 'name', value: 'id', children: 'children' }"
                  placeholder="选择品类"
                  style="width: 100%"
                  clearable
                  filterable
                  check-strictly
                />
                <div v-if="selectedCategory" class="category-chip">
                  <span
                    class="color-dot"
                    v-if="selectedCategory.color_tag"
                    :style="{ backgroundColor: selectedCategory.color_tag || '#a3a3a3' }"
                  ></span>
                  <span class="chip-text">{{ selectedCategory.path_name || selectedCategory.name }}</span>
                </div>
              </el-form-item>
            </el-col>

            <el-col :xs="24" :sm="12">
              <el-form-item label="主题">
                <el-select
                  v-model="formData.theme"
                  placeholder="选择或创建主题"
                  filterable
                  allow-create
                  default-first-option
                  :reserve-keyword="true"
                  @change="handleThemeChange"
                  @create="handleThemeCreate"
                  style="width: 100%"
                  clearable
                >
                  <el-option
                    v-for="theme in themeOptions"
                    :key="theme.id"
                    :label="theme.name"
                    :value="theme.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :xs="24" :sm="12">
              <el-form-item label="状态" prop="status" class="is-required">
                <el-radio-group v-model="formData.status" class="status-segmented">
                  <el-radio-button label="in_cabinet">在馆</el-radio-button>
                  <el-radio-button label="outdoor">出街中</el-radio-button>
                  <el-radio-button label="sold">已售出</el-radio-button>
                </el-radio-group>
              </el-form-item>
            </el-col>

            <el-col :xs="24" :sm="12">
              <el-form-item label="位置" prop="location">
                <el-tree-select
                  v-model="formData.location"
                  :data="locationStore.treeData"
                  placeholder="选择位置"
                  clearable
                  style="width: 100%"
                  :props="{ label: 'label', value: 'id', children: 'children' }"
                  check-strictly
                />
              </el-form-item>
            </el-col>
          </el-row>
        </section>

        <!-- 数量与购入信息分区 -->
        <section class="form-section form-section--meta">
          <div class="form-section-header">
            <h3 class="form-section-title">数量与购入</h3>
            <p class="form-section-subtitle">记录数量、价格与购买时间</p>
          </div>
          <el-row :gutter="20">
            <el-col :xs="12" :sm="12">
              <el-form-item label="数量" prop="quantity" class="is-required">
                <div class="field-with-icon">
                  <span class="field-icon">📦</span>
                  <el-input-number v-model="formData.quantity" :min="1" style="width: 100%" />
                </div>
              </el-form-item>
            </el-col>

            <el-col :xs="12" :sm="12">
              <el-form-item label="购入价格">
                <div class="field-with-icon">
                  <span class="field-icon">￥</span>
                  <el-input-number
                    v-model="formData.price"
                    :precision="2"
                    :min="0"
                    placeholder="请输入价格"
                    style="width: 100%"
                  />
                </div>
              </el-form-item>
            </el-col>

            <el-col :xs="12" :sm="12">
              <el-form-item label="入手日期">
                <div class="field-with-icon">
                  <span class="field-icon">📅</span>
                  <el-date-picker
                    v-model="formData.purchase_date"
                    type="date"
                    placeholder="选择日期"
                    style="width: 100%"
                    value-format="YYYY-MM-DD"
                  />
                </div>
              </el-form-item>
            </el-col>

            <el-col :xs="12" :sm="12">
              <el-form-item label="是否官谷">
                <el-switch v-model="formData.is_official" active-text="是" inactive-text="否" inline-prompt />
              </el-form-item>
            </el-col>
          </el-row>
        </section>

        <!-- 图片分区 -->
        <section class="form-section form-section--images">
          <div class="form-section-header">
            <h3 class="form-section-title">图片</h3>
            <p class="form-section-subtitle">主图与细节图会直接影响云展柜观感</p>
          </div>
          <el-row :gutter="20">
            <el-col :xs="24" :sm="10" :md="8">
              <el-form-item label="主图">
                <div class="main-photo-card-shell">
                  <el-upload
                    v-model:file-list="mainPhotoList"
                    list-type="picture-card"
                    :auto-upload="false"
                    :limit="1"
                    :on-change="handleMainPhotoChange"
                    :on-remove="handleMainPhotoRemove"
                    :on-preview="handlePictureCardPreview"
                    :http-request="dummyUpload"
                    :show-file-list="true"
                    class="main-photo-uploader"
                    :class="{ 'hide-upload-trigger': mainPhotoList.length >= 1 }"
                    :open-file-dialog-on-click="!isMobileUploadActionSheet"
                    accept="image/*"
                  >
                    <template #trigger>
                      <!-- 移动端（APP/H5）：点击 + 弹出“拍照/相册”；桌面端保持原生文件选择 -->
                      <span
                        v-if="mainPhotoList.length < 1 && isMobileUploadActionSheet"
                        class="main-photo-trigger"
                        @click.stop.prevent="chooseMainPhotoSource"
                      >
                        <el-icon><Plus /></el-icon>
                      </span>
                      <el-icon v-else-if="mainPhotoList.length < 1"><Plus /></el-icon>
                    </template>
                  </el-upload>
                </div>

                <!-- 编辑模式：允许对原主图重新裁切/编辑 -->
                <div v-if="route.params.id && (formData.main_photo || mainPhotoList.length)" class="main-photo-actions">
                  <el-button size="small" :icon="Edit" @click="handleReEditMainPhoto">重新编辑主图</el-button>
                </div>

                <!-- H5：分别用 capture / 非 capture 触发“拍照/相册”（隐藏 input，通过 + 号触发） -->
                <input
                  v-if="isH5Mobile"
                  ref="cameraInputRef"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style="display: none"
                  @change="handleH5MainPhotoPicked"
                />
                <input
                  v-if="isH5Mobile"
                  ref="albumInputRef"
                  type="file"
                  accept="image/*"
                  style="display: none"
                  @change="handleH5MainPhotoPicked"
                />
              </el-form-item>
            </el-col>

            <el-col :xs="24" :sm="14" :md="16">
              <el-form-item label="附件图片">
                <div class="additional-photos-section">
                  <!-- 已有图片列表 -->
                  <div v-if="existingAdditionalPhotos.length > 0" class="existing-photos">
                    <div
                      v-for="(photo, index) in existingAdditionalPhotos"
                      :key="photo.id"
                      class="photo-item"
                    >
                      <el-image
                        :src="photo.image"
                        fit="cover"
                        class="photo-preview"
                        :preview-src-list="existingAdditionalPhotos.map(p => p.image)"
                        :initial-index="index"
                      >
                        <template #error>
                          <div class="image-error">
                            <el-icon><Picture /></el-icon>
                          </div>
                        </template>
                      </el-image>
                      <div class="photo-actions">
                        <el-input
                          v-model="photo.label"
                          placeholder="图片标签（可选）"
                          size="small"
                          class="photo-label-input"
                          @blur="handlePhotoLabelChange(photo)"
                        />
                        <el-button
                          type="danger"
                          size="small"
                          :icon="Delete"
                          circle
                          @click="handleRemoveExistingPhoto(photo.id)"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- 新上传的图片列表 -->
                  <div v-if="newAdditionalPhotoFiles.length > 0" class="new-photos">
                    <div
                      v-for="(file, index) in newAdditionalPhotoFiles"
                      :key="index"
                      class="photo-item"
                    >
                      <el-image
                        :src="file.preview"
                        fit="cover"
                        class="photo-preview"
                        :preview-src-list="newAdditionalPhotoFiles.map(f => f.preview)"
                        :initial-index="index"
                      >
                        <template #error>
                          <div class="image-error">
                            <el-icon><Picture /></el-icon>
                          </div>
                        </template>
                      </el-image>
                      <div class="photo-actions">
                        <el-input
                          v-model="file.label"
                          placeholder="图片标签（可选）"
                          size="small"
                          class="photo-label-input"
                        />
                        <el-button
                          type="danger"
                          size="small"
                          :icon="Delete"
                          circle
                          @click="handleRemoveNewPhoto(index)"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- 上传按钮 -->
                  <el-upload
                    v-model:file-list="additionalPhotoList"
                    list-type="picture-card"
                    :auto-upload="false"
                    :on-change="handleAdditionalPhotoChange"
                    :on-remove="handleAdditionalPhotoRemove"
                    :http-request="dummyUpload"
                    :show-file-list="false"
                    accept="image/*"
                    multiple
                    class="additional-photo-upload"
                  >
                    <template #trigger>
                      <el-icon><Plus /></el-icon>
                    </template>
                  </el-upload>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
        </section>

        <!-- 备注分区 -->
        <section class="form-section form-section--notes">
          <div class="form-section-header">
            <h3 class="form-section-title">备注</h3>
            <p class="form-section-subtitle">可以记录店铺、工艺、画师等细节</p>
          </div>
          <el-row :gutter="20">
            <el-col :xs="24">
              <el-form-item label="备注">
                <el-input
                  v-model="formData.notes"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入备注信息"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </section>

      </el-form>

    <!-- 底部吸底操作栏 -->
    <div class="sticky-action-bar">
      <div class="sticky-action-inner">
        <el-button class="sticky-btn sticky-btn--secondary" @click="handleCancel">取消</el-button>
        <el-button class="sticky-btn sticky-btn--secondary" @click="handleReset">重置</el-button>
        <el-button
          type="primary"
          class="sticky-btn sticky-btn--primary"
          @click="handleSubmit"
          :loading="submitting"
        >
          提交
        </el-button>
      </div>
    </div>

    <!-- 移动端主图选择抽屉 -->
    <el-drawer
      v-model="photoSourceDrawerVisible"
      direction="btt"
      :with-header="false"
      size="auto"
      class="photo-source-drawer"
    >
      <div class="action-sheet-content">
        <div class="sheet-header">
          选择主图
        </div>
        <div class="sheet-menu">
          <div class="sheet-item" @click="handlePhotoFromCamera">
            <el-icon><CameraIcon /></el-icon> 拍照
          </div>
          <div class="sheet-item" @click="handlePhotoFromAlbum">
            <el-icon><Picture /></el-icon> 相册选择
          </div>
        </div>
        <div class="sheet-cancel" @click="photoSourceDrawerVisible = false">取消</div>
      </div>
    </el-drawer>

    <!-- 图片裁切对话框 -->
    <el-dialog
      v-model="cropDialogVisible"
      :title="'编辑图片'"
      :width="isMobile ? '95%' : '640px'"
      :close-on-click-modal="false"
      class="crop-dialog"
      @close="handleCropDialogClose"
    >
      <div class="crop-container">
        <div class="crop-glass-panel">
          <div class="crop-header-row">
            <div class="crop-title">主图编辑</div>
            <div class="crop-subtitle">调整比例与滤镜，让画面更契合主题</div>
          </div>

          <!-- 比例选择 -->
          <div class="aspect-ratio-selector">
            <div class="ratio-label">选择比例</div>
            <div class="ratio-segmented">
              <div class="ratio-segmented-track">
                <div
                  class="ratio-segmented-thumb"
                  :style="{ '--active-index': aspectRatios.findIndex(r => r.value === selectedAspectRatio) }"
                ></div>
                <button
                  v-for="(ratio, idx) in aspectRatios"
                  :key="ratio.value"
                  type="button"
                  class="ratio-segmented-item"
                  :class="{ 'is-active': selectedAspectRatio === ratio.value }"
                  @click="selectedAspectRatio = ratio.value"
                >
                  <span class="ratio-icon" :class="`ratio-icon--${ratio.value}`"></span>
                  <span class="ratio-text">{{ ratio.label }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 图像调整 -->
          <div class="image-filters">
            <div class="filters-header-row">
              <span class="filters-title">图像微调</span>
              <el-button
                class="filter-reset-btn"
                text
                circle
                :icon="RefreshLeft"
                @click="resetFilters"
              />
            </div>
            <div class="filter-item">
              <span class="filter-label">亮度</span>
              <el-slider
                v-model="filterState.brightness"
                :min="0"
                :max="200"
                :format-tooltip="(val: number) => val + '%'"
              />
              <span class="filter-value">{{ filterState.brightness }}%</span>
            </div>
            <div class="filter-item">
              <span class="filter-label">对比度</span>
              <el-slider
                v-model="filterState.contrast"
                :min="0"
                :max="200"
                :format-tooltip="(val: number) => val + '%'"
              />
              <span class="filter-value">{{ filterState.contrast }}%</span>
            </div>
            <div class="filter-item">
              <span class="filter-label">饱和度</span>
              <el-slider
                v-model="filterState.saturation"
                :min="0"
                :max="200"
                :format-tooltip="(val: number) => val + '%'"
              />
              <span class="filter-value">{{ filterState.saturation }}%</span>
            </div>
          </div>

          <!-- 圆角矩形设置（仅自由 / 1:1 比例可用） -->
          <div v-if="showRoundedControls" class="rounded-rect-settings">
            <div class="rounded-header-row">
              <span class="rounded-title">圆角矩形</span>
              <el-switch v-model="enableRoundedRect" size="small" />
            </div>
            <div class="rounded-radius-row" :class="{ 'is-disabled': !enableRoundedRect }">
              <span class="rounded-label">圆角大小</span>
              <el-slider
                v-model="roundedRadius"
                :min="0"
                :max="50"
                :disabled="!enableRoundedRect"
                :format-tooltip="(val: number) => val + '%'"
              />
              <span class="rounded-value">{{ roundedRadius }}%</span>
            </div>
          </div>

          <!-- 裁切组件 -->
          <div
            class="cropper-wrapper"
            :class="{
              'circle-crop':
                selectedAspectRatio === 'circle' || selectedAspectRatio.endsWith('-ellipse'),
              'rounded-rect-preview': showRoundedControls && enableRoundedRect
            }"
          >
            <vue-picture-cropper
              v-if="cropImageSrc"
              ref="pictureCropperRef"
              :key="`cropper-${selectedAspectRatio}`"
              :box-style="{
                width: '100%',
                height: isMobile ? '300px' : '400px',
                backgroundColor: '#f8f8f8',
                margin: '0 auto'
              }"
              :img="cropImageSrc"
              :options="cropperOptions"
              :style="cropperStyle"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCropCancel">取消</el-button>
          <el-button type="primary" @click="handleCropConfirm" :loading="cropping">
            确认
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 新建去重：检测到可能重复的谷子时选择合并或新建 -->
    <el-dialog
      v-model="duplicateDialogVisible"
      title="检测到可能重复的谷子"
      width="min(90vw, 560px)"
      class="duplicate-dialog"
      :close-on-click-modal="false"
      @close="setDuplicateSelectedId(null)"
    >
      <p class="duplicate-dialog-desc">以下谷子与当前填写信息可能重复，请选择合并到已有条目或仍然新建一条。</p>
      <div class="duplicate-candidates-list">
        <div
          v-for="c in duplicateCandidates"
          :key="c.id"
          class="duplicate-candidate-item"
          :class="{ 'is-selected': duplicateSelectedId === c.id }"
          @click="setDuplicateSelectedId(c.id)"
        >
          <el-radio :model-value="duplicateSelectedId" :value="c.id" @update:model-value="setDuplicateSelectedId($event)">
            <span class="candidate-name">{{ c.name }}</span>
            <span class="candidate-meta">
              数量 {{ c.quantity }}
              <template v-if="c.purchase_date"> · 入手 {{ c.purchase_date }}</template>
              <template v-if="c.price"> · 单价 {{ c.price }}</template>
              · 创建于 {{ formatCandidateCreatedAt(c.created_at) }}
            </span>
          </el-radio>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="duplicateDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :disabled="!duplicateSelectedId"
            :loading="submitting"
            @click="handleDuplicateMerge"
          >
            合并到该条（数量累加）
          </el-button>
          <el-button :loading="submitting" @click="handleDuplicateNew">
            仍然新建一条
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 图片预览 (使用 el-image-viewer 以匹配附件图片预览效果) -->
    <el-image-viewer
      v-if="previewVisible"
      :url-list="[previewImage]"
      @close="previewVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type UploadFile } from 'element-plus'
import { Plus, Delete, Picture, Camera as CameraIcon, Edit, RefreshLeft } from '@element-plus/icons-vue'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'
import VuePictureCropper, { cropper } from 'vue-picture-cropper'
import { useLocationStore } from '@/stores/location'
import { createGoods, updateGoods, getGoodsDetail, uploadMainPhoto, uploadAdditionalPhotos, deleteAdditionalPhoto, updateAdditionalPhotoLabel } from '@/api/goods'
import { getIPList, getCharacterList, getCategoryList, getThemeList, createTheme } from '@/api/metadata'
import type { GoodsDetail, IP, Character, Category, GuziImage, Theme, GoodsDuplicateCandidate, GoodsInput } from '@/api/types'

const router = useRouter()
const route = useRoute()
const locationStore = useLocationStore()

const formRef = ref<FormInstance>()
const submitting = ref(false)

// 新建去重：409 时弹窗状态与待重试请求体
const duplicateDialogVisible = ref(false)
const duplicateCandidates = ref<GoodsDuplicateCandidate[]>([])
const duplicateSelectedId = ref<string | null>(null)
const pendingCreatePayload = ref<GoodsInput | null>(null)

// 从API获取的数据
const ipOptions = ref<IP[]>([])
const characters = ref<Character[]>([])
const categoryOptions = ref<Category[]>([])
const themeOptions = ref<import('@/api/types').Theme[]>([])
const allThemes = ref<import('@/api/types').Theme[]>([])

const formData = ref({
  name: '',
  ip: undefined as number | undefined,
  characters: [] as number[],
  category: undefined as number | undefined,
  theme: undefined as number | string | undefined | null, // 允许字符串，用于新创建的主题名
  status: 'in_cabinet' as 'in_cabinet' | 'outdoor' | 'sold',
  location: undefined as number | undefined,
  quantity: 1,
  price: undefined as number | undefined,
  purchase_date: '',
  is_official: false,
  notes: '',
  main_photo: '',
})

const mainPhotoFile = ref<File | null>(null)
const mainPhotoList = ref<UploadFile[]>([])
const previewVisible = ref(false)
const previewImage = ref('')

const handlePictureCardPreview = (uploadFile: UploadFile) => {
  previewImage.value = uploadFile.url!
  previewVisible.value = true
}

// 图片裁切相关状态
const cropDialogVisible = ref(false)
const cropImageSrc = ref<string>('')
const cropImageFile = ref<File | null>(null)
const pictureCropperRef = ref<any>(null)
const cropping = ref(false)
const selectedAspectRatio = ref<string>('free')
const aspectRatios = [
  { label: '自由', value: 'free' },
  { label: '1:1', value: '1:1' },
  { label: '圆形', value: 'circle' },
  { label: '47:65 (椭圆)', value: '47:65-ellipse' },
  { label: '63:93 (椭圆)', value: '63:93-ellipse' },
]

// 圆角矩形相关状态（仅用于自由/1:1 比例）
const enableRoundedRect = ref(false)
// 使用百分比控制圆角半径（相对于最短边的一半），0-50%
const roundedRadius = ref(20)
const showRoundedControls = computed(() => {
  return selectedAspectRatio.value === 'free' || selectedAspectRatio.value === '1:1'
})

// 图像滤镜状态
const filterState = ref({
  brightness: 100,
  contrast: 100,
  saturation: 100
})

const resetFilters = () => {
  filterState.value = {
    brightness: 100,
    contrast: 100,
    saturation: 100
  }
}

// 动态计算滤镜样式，用于预览
const cropperStyle = computed(() => {
  return {
    filter: `brightness(${filterState.value.brightness}%) contrast(${filterState.value.contrast}%) saturate(${filterState.value.saturation}%)`
  }
})

// 计算是否为移动端
const isMobile = computed(() => {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
})

// 裁切器配置
const cropperOptions = computed(() => {
  const baseOptions: any = {
    img: cropImageSrc.value,
    outputSize: 1,
    outputType: 'png',
    canScale: true,
    autoCrop: true,
    centerBox: true,
    high: true,
    cropData: {},
    enlarge: 1,
    mode: 'contain',
    maxImgSize: 2000,
    limitMinSize: [100, 100],
    // 限制裁切框不能超出图片边界
    viewMode: 1, // 1: 限制裁切框不能超出画布（图片）范围
    dragMode: 'crop', // 'crop': 创建新的裁切框, 'move': 移动画布, 'none': 无操作
    cropBoxMovable: true, // 允许移动裁切框
    cropBoxResizable: true, // 允许调整裁切框大小（但仍受 viewMode 限制）
    // 确保裁切框始终在图片范围内
    strict: true, // 严格模式，确保裁切框不超出图片
  }

  // 根据选择的比例设置 aspectRatio
  if (selectedAspectRatio.value === 'circle') {
    // 圆形裁切：本质上是 1:1 的固定比例 + CSS 把裁切框渲染成圆形
    baseOptions.aspectRatio = 1
    baseOptions.fixed = true
    baseOptions.fixedNumber = [1, 1]
  } else if (selectedAspectRatio.value.endsWith('-ellipse')) {
    // 椭圆裁切：解析比例 + CSS 把裁切框渲染成圆形（会被拉伸成椭圆）
    const ratioStr = selectedAspectRatio.value.replace('-ellipse', '')
    const parts = ratioStr.split(':').map(Number)
    const w = parts[0]
    const h = parts[1]
    if (w && h) {
      baseOptions.aspectRatio = w / h
      baseOptions.fixed = true
      baseOptions.fixedNumber = [w, h]
    }
  } else if (selectedAspectRatio.value !== 'free') {
    const parts = selectedAspectRatio.value.split(':').map(Number)
    const w = parts[0]
    const h = parts[1]
    if (w && h) {
      baseOptions.aspectRatio = w / h
      baseOptions.fixed = true
      baseOptions.fixedNumber = [w, h]
    } else {
      baseOptions.aspectRatio = NaN
      baseOptions.fixed = false
    }
  } else {
    baseOptions.aspectRatio = NaN
    baseOptions.fixed = false
  }

  return baseOptions
})

// 附件图片相关状态
interface NewPhotoFile {
  file: File
  preview: string
  label?: string
}
interface ExistingPhoto extends GuziImage {
  label?: string
  originalLabel?: string // 记录原始标签，用于判断是否修改
}
const existingAdditionalPhotos = ref<ExistingPhoto[]>([])
const newAdditionalPhotoFiles = ref<NewPhotoFile[]>([])
const additionalPhotoList = ref<UploadFile[]>([])

const formTitle = computed(() => {
  return route.params.id ? '编辑谷子' : '新增谷子'
})

// H5 移动端：用 input[file] + capture 实现“拍照/相册”（不同浏览器表现可能不同）
const isH5Mobile = computed(() => {
  if (typeof window === 'undefined') return false
  return !Capacitor.isNativePlatform() && window.innerWidth < 768
})

// 原生移动端（Capacitor）环境：支持调用相机/相册
const isNativeMobile = computed(() => {
  if (typeof window === 'undefined') return false
  return Capacitor.isNativePlatform() && window.innerWidth < 768
})

// 移动端上传：使用“拍照/相册”动作面板替代默认文件选择
const isMobileUploadActionSheet = computed(() => isNativeMobile.value || isH5Mobile.value)

const filteredCharacters = computed(() => {
  if (!formData.value.ip) return []
  return characters.value.filter((char) => char.ip.id === formData.value.ip)
})

const buildCategoryTree = (list: Category[]) => {
  const map = new Map<number, Category & { children: Category[] }>()
  list.forEach((item) => map.set(item.id, { ...item, children: [] }))
  const roots: Category[] = []
  map.forEach((node) => {
    if (node.parent !== null && map.has(node.parent)) {
      map.get(node.parent)!.children!.push(node)
    } else {
      roots.push(node)
    }
  })
  const sortTree = (nodes: Category[]) => {
    nodes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name))
    nodes.forEach((n) => n.children && sortTree(n.children))
  }
  sortTree(roots)
  return roots
}

const categoryTreeOptions = computed(() => buildCategoryTree(categoryOptions.value))
const selectedCategory = computed(() => categoryOptions.value.find((c) => c.id === formData.value.category))

const rules: FormRules = {
  name: [{ required: true, message: '请输入谷子名称', trigger: 'blur' }],
  ip: [{ required: true, message: '请选择IP', trigger: 'change' }],
  characters: [
    { required: true, message: '请至少选择一个角色', trigger: 'change' },
    { type: 'array', min: 1, message: '请至少选择一个角色', trigger: 'change' },
  ],
  category: [{ required: true, message: '请选择品类', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

const handleIpChange = () => {
  formData.value.characters = []
}

// 待创建的主题名（当用户输入新主题名但还未创建时）
const pendingThemeName = ref<string | null>(null)

// 主题变更处理
const handleThemeChange = (value: number | string | null) => {
  // value可能是数字（已有主题ID）、字符串（新创建的主题名）或null（清空）
  if (value === null) {
    formData.value.theme = null
    pendingThemeName.value = null
    return
  }
  if (typeof value === 'string') {
    // 这是新创建的主题名，先保存到pendingThemeName
    // 注意：这里不立即设置为null，让el-select显示用户输入的内容
    // 等待handleThemeCreate处理（用户按回车或选择创建选项时触发）
    pendingThemeName.value = value.trim()
    // 保持字符串值，让用户看到输入的内容
    // handleThemeCreate 会在创建成功后更新为ID
    return
  }
  // 数字ID，直接使用
  formData.value.theme = value
  pendingThemeName.value = null

  // 当选择已有主题时，自动将主题的description信息填入备注栏
  const selectedTheme = allThemes.value.find(theme => theme.id === value)
  if (selectedTheme && selectedTheme.description) {
    formData.value.notes = selectedTheme.description
  }
}

// 创建新主题（由el-select的@create事件触发，用户输入新名称后按回车或选择创建选项时触发）
const handleThemeCreate = async (themeName: string) => {
  if (!themeName || !themeName.trim()) {
    ElMessage.warning('主题名称不能为空')
    formData.value.theme = null
    pendingThemeName.value = null
    return
  }

  const trimmedName = themeName.trim()

  try {
    // 检查是否已存在同名主题
    const existingTheme = allThemes.value.find(t => t.name === trimmedName)
    if (existingTheme) {
      formData.value.theme = existingTheme.id
      pendingThemeName.value = null
      ElMessage.info('该主题已存在，已自动选择')
      return
    }

    // 创建新主题
    const newTheme = await createTheme({ name: trimmedName })
    allThemes.value.push(newTheme)
    themeOptions.value = allThemes.value
    // 更新为创建后的主题ID
    formData.value.theme = newTheme.id
    pendingThemeName.value = null
    ElMessage.success('主题创建成功')
  } catch (err: any) {
    ElMessage.error('创建主题失败：' + (err.message || '未知错误'))
    // 创建失败时，保持字符串值，让用户可以重新尝试
    // 不清空，这样用户可以看到输入的内容
    console.error('创建主题失败:', err)
  }
}

// 确保主题已创建（在提交前调用）
const ensureThemeCreated = async (): Promise<number | null> => {
  // 如果已经有theme_id（数字），直接返回
  if (typeof formData.value.theme === 'number') {
    return formData.value.theme
  }

  // 如果 theme 是字符串（新创建的主题名），或者 pendingThemeName 有值
  const themeNameToCreate = typeof formData.value.theme === 'string'
    ? formData.value.theme.trim()
    : (pendingThemeName.value ? pendingThemeName.value.trim() : null)

  if (themeNameToCreate) {
    try {
      // 再次检查是否已存在同名主题（可能在其他地方创建了）
      const existingTheme = allThemes.value.find(t => t.name === themeNameToCreate)
      if (existingTheme) {
        formData.value.theme = existingTheme.id
        pendingThemeName.value = null
        return existingTheme.id
      }

      // 创建新主题
      const newTheme = await createTheme({ name: themeNameToCreate })
      allThemes.value.push(newTheme)
      themeOptions.value = allThemes.value
      formData.value.theme = newTheme.id
      pendingThemeName.value = null
      return newTheme.id
    } catch (err: any) {
      ElMessage.error('创建主题失败：' + (err.message || '未知错误'))
      throw err
    }
  }

  // 如果没有主题，返回null
  return null
}

const dummyUpload = () => Promise.resolve()

const handleMainPhotoChange = (uploadFile: UploadFile, uploadFiles: UploadFile[]) => {
  const file = uploadFile.raw
  if (file) {
    // 打开裁切对话框
    openCropDialog(file)
    // 清空上传列表，等待裁切完成后再设置
    mainPhotoList.value = []
  }
}

const handleMainPhotoRemove = () => {
  mainPhotoFile.value = null
  mainPhotoList.value = []
  formData.value.main_photo = ''
}

const setMainPhotoFromFile = (file: File, previewUrl?: string) => {
  // 清理旧的预览URL（如果存在）
  const oldFile = mainPhotoList.value[0]
  if (oldFile && oldFile.url && oldFile.url.startsWith('blob:')) {
    URL.revokeObjectURL(oldFile.url)
  }

  mainPhotoFile.value = file
  formData.value.main_photo = ''
  mainPhotoList.value = [
    {
      name: file.name || 'main_photo',
      url: previewUrl,
      status: 'success',
    } as UploadFile,
  ]
}

const cameraInputRef = ref<HTMLInputElement | null>(null)
const albumInputRef = ref<HTMLInputElement | null>(null)

// 主图选择抽屉状态
const photoSourceDrawerVisible = ref(false)

const handleH5MainPhotoPicked = (e: Event) => {
  const input = e.target as HTMLInputElement | null
  const file = input?.files?.[0]
  if (!file) return
  // 打开裁切对话框
  openCropDialog(file)
  // 允许重复选择同一张图
  if (input) input.value = ''
}

const pickMainPhotoFromNative = async (source: CameraSource) => {
  try {
    const photo = await Camera.getPhoto({
      quality: 85,
      resultType: CameraResultType.Uri,
      source,
      correctOrientation: true,
    })

    if (!photo.webPath) {
      throw new Error('未获取到图片路径')
    }

    const resp = await fetch(photo.webPath)
    const blob = await resp.blob()
    const mime = blob.type || 'image/jpeg'
    const ext = mime.includes('/') ? mime.split('/')[1] : 'jpg'
    const file = new File([blob], `main_photo_${Date.now()}.${ext}`, { type: mime })

    // 打开裁切对话框
    openCropDialog(file, photo.webPath)
  } catch (err: any) {
    // 用户取消不提示错误
    const msg = err?.message || ''
    if (msg.includes('User cancelled') || msg.includes('canceled') || msg.includes('cancel')) return
    ElMessage.error('获取图片失败：' + (err?.message || '未知错误'))
  }
}

const chooseMainPhotoSource = () => {
  photoSourceDrawerVisible.value = true
}

const handlePhotoFromCamera = async () => {
  photoSourceDrawerVisible.value = false
  if (isNativeMobile.value) {
    await pickMainPhotoFromNative(CameraSource.Camera)
  } else if (isH5Mobile.value) {
    cameraInputRef.value?.click()
  }
}

const handlePhotoFromAlbum = async () => {
  photoSourceDrawerVisible.value = false
  if (isNativeMobile.value) {
    await pickMainPhotoFromNative(CameraSource.Photos)
  } else if (isH5Mobile.value) {
    albumInputRef.value?.click()
  }
}

// 打开裁切对话框
const openCropDialog = (file: File, previewUrl?: string) => {
  cropImageFile.value = file
  // 创建预览URL
  if (previewUrl) {
    cropImageSrc.value = previewUrl
  } else {
    cropImageSrc.value = URL.createObjectURL(file)
  }
  cropDialogVisible.value = true
  selectedAspectRatio.value = 'free' // 重置为自由比例
  resetFilters() // 重置滤镜
  // 重置圆角矩形设置
  enableRoundedRect.value = false
  roundedRadius.value = 20
}

// 编辑模式：把原主图拉进裁切器重新编辑
const handleReEditMainPhoto = async () => {
  try {
    // 优先取当前 UI/表单里的主图 URL（编辑模式下来自详情接口）
    const url = (formData.value.main_photo || mainPhotoList.value?.[0]?.url || '').toString()
    if (!url) {
      ElMessage.warning('当前没有可编辑的主图')
      return
    }

    const resp = await fetch(url)
    if (!resp.ok) {
      throw new Error(`拉取图片失败（HTTP ${resp.status}）`)
    }
    const blob = await resp.blob()
    const mime = blob.type || 'image/jpeg'
    const ext = mime.includes('/') ? mime.split('/')[1] : 'jpg'
    const file = new File([blob], `main_photo_${Date.now()}.${ext}`, { type: mime })

    openCropDialog(file, url)
  } catch (err: any) {
    ElMessage.error('重新编辑主图失败：' + (err?.message || '未知错误'))
  }
}

// 获取裁切器实例
// vue-picture-cropper 通过导入的 cropper 工具实例来调用方法
const getCropperInstance = () => {
  // 优先使用导入的 cropper 工具实例（这是推荐的方式）
  if (cropper && (typeof cropper.getDataURL === 'function' || typeof cropper.getBlob === 'function' || typeof cropper.getFile === 'function')) {
    return cropper
  }

  // 如果工具实例不可用，尝试从组件获取
  if (pictureCropperRef.value) {
    const component = pictureCropperRef.value

    // 尝试多种方式获取实例
    if (component.$refs && component.$refs.cropper) {
      return component.$refs.cropper
    }
    if (component.cropper) {
      return component.cropper
    }
    if ((component as any).setupState && (component as any).setupState.cropper) {
      return (component as any).setupState.cropper
    }
    if ((component as any).__cropper) {
      return (component as any).__cropper
    }
  }

  return null
}

const blobToImageBitmap = async (blob: Blob) => {
  // createImageBitmap 在大多数现代浏览器可用；不行则回退到 HTMLImageElement
  if (typeof createImageBitmap === 'function') {
    return await createImageBitmap(blob)
  }
  const url = URL.createObjectURL(blob)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('图片解码失败'))
      el.src = url
    })
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

const applyCircleMaskToBlob = async (input: Blob) => {
  const bitmapOrImg = await blobToImageBitmap(input)
  const width = (bitmapOrImg as any).width
  const height = (bitmapOrImg as any).height
  const size = Math.min(width, height)

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 不可用')

  // 圆形裁切：圆外透明
  ctx.clearRect(0, 0, size, size)
  ctx.save()
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  // 如果不是正方形，居中裁成正方形
  const sx = Math.max(0, Math.floor((width - size) / 2))
  const sy = Math.max(0, Math.floor((height - size) / 2))
  ctx.drawImage(bitmapOrImg as any, sx, sy, size, size, 0, 0, size, size)
  ctx.restore()

  const outBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('导出圆形图片失败'))), 'image/png', 0.92)
  })
  return outBlob
}

const applyEllipseMaskToBlob = async (input: Blob) => {
  const bitmapOrImg = await blobToImageBitmap(input)
  const width = (bitmapOrImg as any).width
  const height = (bitmapOrImg as any).height

  // 创建一个正方形画布，边长为椭圆长轴的长度
  const size = Math.max(width, height)

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 不可用')

  // 清除背景 (透明)
  ctx.clearRect(0, 0, size, size)

  // 计算居中偏移量
  const offsetX = (size - width) / 2
  const offsetY = (size - height) / 2

  // 椭圆裁切：圆外透明
  ctx.save()
  ctx.beginPath()

  // 绘制椭圆：中心点 (size/2, size/2)，半径 (width/2, height/2)
  if (typeof ctx.ellipse === 'function') {
      ctx.ellipse(size / 2, size / 2, width / 2, height / 2, 0, 0, Math.PI * 2)
  } else {
       // 兼容性处理
       ctx.translate(size/2, size/2)
       ctx.scale(width/2, height/2)
       ctx.arc(0, 0, 1, 0, Math.PI * 2)
  }
  ctx.closePath()
  ctx.clip()

  // 绘制图片，居中放置
  // 注意：如果使用了 translate/scale，需要先 restore 再 drawImage，或者在 transform 状态下正确绘制
  // 为了简单起见，如果走了兼容分支，translate/scale 会影响后续绘制
  // 所以这里建议：如果走了兼容分支，必须 restore 吗？
  // clip() 会受到当前 transform 的影响。clip 路径创建后，transform 可以 restore。
  // 但是 clip 区域是固定的。

  if (typeof ctx.ellipse !== 'function') {
      // 如果走了兼容分支，此时坐标系被变换了。
      // 我们需要恢复坐标系来绘制图片，但是 clip 效果要保留。
      // Canvas 的 clip() 是基于当前路径创建剪切区域。路径创建时的 transform 会被应用到路径上。
      // 一旦 clip() 被调用，剪切区域就固定了。
      // 所以我们可以 restore() 然后绘制图片。
      ctx.restore()
      ctx.save() // 重新 save 为了保持结构一致，虽然下面直接 drawImage 也可以
  }

  ctx.drawImage(bitmapOrImg as any, offsetX, offsetY, width, height)
  ctx.restore()

  const outBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('导出椭圆图片失败'))), 'image/png', 0.92)
  })
  return outBlob
}

// 圆角矩形遮罩：用于自由 / 1:1 比例下的圆角矩形导出
const applyRoundedRectMaskToBlob = async (input: File, radiusPercent: number): Promise<File> => {
  const bitmapOrImg = await blobToImageBitmap(input)
  const width = (bitmapOrImg as any).width
  const height = (bitmapOrImg as any).height

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 不可用')

  ctx.clearRect(0, 0, width, height)

  // 将 0-50% 的 UI 数值转换为像素半径（最大为最短边的一半）
  const clampedPercent = Math.max(0, Math.min(radiusPercent, 50))
  const maxRadius = Math.min(width, height) / 2
  const radius = (clampedPercent / 100) * maxRadius

  const drawRoundedRect = (context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    const rr = Math.min(r, w / 2, h / 2)
    context.beginPath()
    context.moveTo(x + rr, y)
    context.lineTo(x + w - rr, y)
    context.arcTo(x + w, y, x + w, y + rr, rr)
    context.lineTo(x + w, y + h - rr)
    context.arcTo(x + w, y + h, x + w - rr, y + h, rr)
    context.lineTo(x + rr, y + h)
    context.arcTo(x, y + h, x, y + h - rr, rr)
    context.lineTo(x, y + rr)
    context.arcTo(x, y, x + rr, y, rr)
    context.closePath()
  }

  // 应用圆角矩形剪裁
  drawRoundedRect(ctx, 0, 0, width, height, radius)
  ctx.clip()

  ctx.drawImage(bitmapOrImg as any, 0, 0, width, height)

  const outBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('导出圆角矩形图片失败'))), 'image/png', 0.92)
  })

  return new File([outBlob], `main_photo_${Date.now()}.png`, { type: 'image/png' })
}

const applyFreeCropSquareBlob = async (input: Blob) => {
  const bitmapOrImg = await blobToImageBitmap(input)
  const width = (bitmapOrImg as any).width
  const height = (bitmapOrImg as any).height

  const size = Math.max(width, height)

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 不可用')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)

  const offsetX = (size - width) / 2
  const offsetY = (size - height) / 2
  ctx.drawImage(bitmapOrImg as any, offsetX, offsetY, width, height)

  const outBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('导出正方形图片失败'))), 'image/png', 0.92)
  })
  return outBlob
}

// 确认裁切
const handleCropConfirm = async () => {
  if (!pictureCropperRef.value || !cropImageFile.value) {
    ElMessage.warning('裁切器未就绪')
    return
  }

  cropping.value = true
  try {
    // 获取裁切器实例
    const cropperInstance = getCropperInstance()
    if (!cropperInstance) {
      ElMessage.error('无法获取裁切器实例')
      cropping.value = false
      return
    }

    let croppedFile: File | null = null
    let previewUrl: string = ''

    // 方法1: 尝试使用 getFile (推荐，直接返回 File 对象)
    if (typeof cropperInstance.getFile === 'function') {
      try {
        croppedFile = await cropperInstance.getFile({
          width: 2000,
          height: 2000,
          mimeType: cropImageFile.value.type || 'image/png',
          quality: 0.9,
        })
        if (croppedFile) {
          previewUrl = URL.createObjectURL(croppedFile)
        }
      } catch (err) {
        // getFile 失败，继续尝试其他方法
      }
    }

    // 方法2: 尝试使用 getBlob
    if (!croppedFile && typeof cropperInstance.getBlob === 'function') {
      try {
        const blob = await cropperInstance.getBlob({
          width: 2000,
          height: 2000,
          // 圆形/椭圆裁切需要透明背景，强制 PNG
          mimeType: (selectedAspectRatio.value === 'circle' || selectedAspectRatio.value.endsWith('-ellipse')) ? 'image/png' : (cropImageFile.value.type || 'image/png'),
          quality: 0.9,
        })
        if (blob) {
          const mime = (selectedAspectRatio.value === 'circle' || selectedAspectRatio.value.endsWith('-ellipse')) ? 'image/png' : (cropImageFile.value?.type || 'image/png')
          const ext = mime.includes('/') ? mime.split('/')[1] : 'png'
          croppedFile = new File([blob], `main_photo_${Date.now()}.${ext}`, { type: mime })
          previewUrl = URL.createObjectURL(blob)
        }
      } catch (err) {
        // getBlob 失败，继续尝试其他方法
      }
    }

    // 方法3: 使用 getDataURL 然后转换为 Blob
    if (!croppedFile && typeof cropperInstance.getDataURL === 'function') {
      try {
        const dataURL = cropperInstance.getDataURL({
          width: 2000,
          height: 2000,
          // 圆形/椭圆裁切需要透明背景，强制 PNG
          mimeType: (selectedAspectRatio.value === 'circle' || selectedAspectRatio.value.endsWith('-ellipse')) ? 'image/png' : (cropImageFile.value.type || 'image/png'),
          quality: 0.9,
        })
        if (dataURL) {
          // 将 dataURL 转换为 Blob
          const response = await fetch(dataURL)
          const blob = await response.blob()
          const mime = (selectedAspectRatio.value === 'circle' || selectedAspectRatio.value.endsWith('-ellipse')) ? 'image/png' : (cropImageFile.value?.type || 'image/png')
          const ext = mime.includes('/') ? mime.split('/')[1] : 'png'
          croppedFile = new File([blob], `main_photo_${Date.now()}.${ext}`, { type: mime })
          previewUrl = dataURL
        }
      } catch (err) {
        // getDataURL 失败，继续尝试其他方法
      }
    }

    // 方法4: 尝试访问底层 cropper 实例的 getCroppedCanvas
    if (!croppedFile) {
      // 尝试从组件实例中获取底层 cropper
      const nativeCropper = pictureCropperRef.value.cropper ||
                           pictureCropperRef.value.$cropper ||
                           (cropperInstance.cropper ? cropperInstance.cropper : null)

      if (nativeCropper && typeof nativeCropper.getCroppedCanvas === 'function') {
        try {
          const canvas = nativeCropper.getCroppedCanvas({
            width: 2000,
            height: 2000,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
          })
          if (canvas) {
            const mime = (selectedAspectRatio.value === 'circle' || selectedAspectRatio.value.endsWith('-ellipse')) ? 'image/png' : (cropImageFile.value?.type || 'image/png')
            const blob = await new Promise<Blob>((resolve, reject) => {
              canvas.toBlob((blob: Blob | null) => {
                if (blob) {
                  resolve(blob)
                } else {
                  reject(new Error('Canvas toBlob failed'))
                }
              }, mime, 0.9)
            })
            const ext = mime.includes('/') ? mime.split('/')[1] : 'png'
            croppedFile = new File([blob], `main_photo_${Date.now()}.${ext}`, { type: mime })
            previewUrl = URL.createObjectURL(blob)
          }
        } catch (err) {
          // 底层 cropper 实例方法失败
        }
      }
    }

    if (!croppedFile) {
      ElMessage.error('无法获取裁切结果，请重试')
      cropping.value = false
      return
    }

    // 圆形裁切：真正输出圆形区域（圆外透明 PNG）
    if (selectedAspectRatio.value === 'circle') {
      try {
        const maskedBlob = await applyCircleMaskToBlob(croppedFile)
        const maskedFile = new File([maskedBlob], `main_photo_${Date.now()}.png`, { type: 'image/png' })
        // 预览 URL：释放旧的预览，避免泄漏
        if (previewUrl && previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl)
        }
        croppedFile = maskedFile
        previewUrl = URL.createObjectURL(maskedBlob)
      } catch (e: any) {
        ElMessage.error('圆形裁切处理失败：' + (e?.message || '未知错误'))
        cropping.value = false
        return
      }
    } else if (selectedAspectRatio.value.endsWith('-ellipse')) {
      try {
        const maskedBlob = await applyEllipseMaskToBlob(croppedFile)
        const maskedFile = new File([maskedBlob], `main_photo_${Date.now()}.png`, { type: 'image/png' })
        // 预览 URL：释放旧的预览，避免泄漏
        if (previewUrl && previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl)
        }
        croppedFile = maskedFile
        previewUrl = URL.createObjectURL(maskedBlob)
      } catch (e: any) {
        ElMessage.error('椭圆裁切处理失败：' + (e?.message || '未知错误'))
        cropping.value = false
        return
      }
    } else if (selectedAspectRatio.value === 'free') {
      try {
        const squareBlob = await applyFreeCropSquareBlob(croppedFile)
        const squareFile = new File([squareBlob], `main_photo_${Date.now()}.png`, { type: 'image/png' })
        if (previewUrl && previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl)
        }
        croppedFile = squareFile
        previewUrl = URL.createObjectURL(squareBlob)
      } catch (e: any) {
        ElMessage.error('自由裁切处理失败：' + (e?.message || '未知错误'))
        cropping.value = false
        return
      }
    }

    // 自由 / 1:1 比例下，按需应用圆角矩形遮罩（失败时回退为普通矩形，不中断流程）
    if (
      (selectedAspectRatio.value === 'free' || selectedAspectRatio.value === '1:1') &&
      enableRoundedRect.value &&
      roundedRadius.value > 0
    ) {
      try {
        const roundedFile = await applyRoundedRectMaskToBlob(croppedFile, roundedRadius.value)
        if (previewUrl && previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl)
        }
        croppedFile = roundedFile
        previewUrl = URL.createObjectURL(roundedFile)
      } catch (e: any) {
        ElMessage.error('圆角处理失败：' + (e?.message || '未知错误'))
        // 不中断，继续使用未圆角的矩形结果
      }
    }

    // 应用滤镜到最终图片
    const filteredFile = await applyFiltersToImage(croppedFile)

    // 设置主图
    const finalPreviewUrl = URL.createObjectURL(filteredFile)
    setMainPhotoFromFile(filteredFile, finalPreviewUrl)

    // 释放旧的 cropFile 预览（如果有）
    if (previewUrl && previewUrl !== finalPreviewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }

    // 关闭对话框
    cropDialogVisible.value = false
    cropping.value = false

    ElMessage.success('图片裁切完成')
  } catch (err: any) {
    ElMessage.error('裁切失败：' + (err?.message || '未知错误'))
    cropping.value = false
  }

}

// 将滤镜应用到图片文件
const applyFiltersToImage = async (file: File): Promise<File> => {
  // 如果没有做任何修改，直接返回原文件
  if (
    filterState.value.brightness === 100 &&
    filterState.value.contrast === 100 &&
    filterState.value.saturation === 100
  ) {
    return file
  }

  const bitmapOrImg = await blobToImageBitmap(file)
  const width = (bitmapOrImg as any).width
  const height = (bitmapOrImg as any).height

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 不可用')

  // 应用滤镜
  ctx.filter = `brightness(${filterState.value.brightness}%) contrast(${filterState.value.contrast}%) saturate(${filterState.value.saturation}%)`

  ctx.drawImage(bitmapOrImg as any, 0, 0, width, height)

  // 重置 filter 以免影响后续操作（虽然这里是一次性的）
  ctx.filter = 'none'

  const mime = file.type || 'image/png'
  const outBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('应用滤镜失败'))), mime, 0.92)
  })

  return new File([outBlob], file.name, { type: mime })
}

// 取消裁切
const handleCropCancel = () => {
  cropDialogVisible.value = false
}

// 关闭裁切对话框时清理
const handleCropDialogClose = () => {
  // 清理预览URL
  if (cropImageSrc.value && cropImageSrc.value.startsWith('blob:')) {
    URL.revokeObjectURL(cropImageSrc.value)
  }
  cropImageSrc.value = ''
  cropImageFile.value = null
}

// 附件图片处理函数
const handleAdditionalPhotoChange = (uploadFile: UploadFile, uploadFiles: UploadFile[]) => {
  const file = uploadFile.raw
  if (file) {
    const preview = URL.createObjectURL(file)
    newAdditionalPhotoFiles.value.push({
      file,
      preview,
      label: '',
    })
  }
  additionalPhotoList.value = []
}

const handleAdditionalPhotoRemove = () => {
  additionalPhotoList.value = []
}

const handleRemoveNewPhoto = (index: number) => {
  const removed = newAdditionalPhotoFiles.value[index]
  if (removed && removed.preview) {
    URL.revokeObjectURL(removed.preview)
  }
  newAdditionalPhotoFiles.value.splice(index, 1)
}

const handleRemoveExistingPhoto = async (photoId: number) => {
  // 如果是编辑模式，需要调用删除接口
  if (route.params.id) {
    try {
      await ElMessageBox.confirm('确定要删除这张图片吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })

      const goodsId = route.params.id as string
      await deleteAdditionalPhoto(goodsId, photoId)
      existingAdditionalPhotos.value = existingAdditionalPhotos.value.filter((p) => p.id !== photoId)
      ElMessage.success('删除成功')
    } catch (err: any) {
      // 用户取消删除或删除失败
      if (err !== 'cancel') {
        ElMessage.error('删除失败：' + (err.message || '未知错误'))
      }
    }
  } else {
    // 新建模式，只从UI中移除（因为还没有创建谷子，无法删除）
    // 理论上新建模式下不应该有已有图片，但为了代码健壮性保留此逻辑
    existingAdditionalPhotos.value = existingAdditionalPhotos.value.filter((p) => p.id !== photoId)
  }
}

// 处理已有图片标签修改
const handlePhotoLabelChange = async (photo: ExistingPhoto) => {
  // 如果是编辑模式，且标签确实发生了变化，调用更新接口
  if (route.params.id && photo.originalLabel !== photo.label) {
    try {
      const goodsId = route.params.id as string
      const label = photo.label?.trim() || ''
      await updateAdditionalPhotoLabel(goodsId, [photo.id], label)
      // 更新原始标签值
      photo.originalLabel = photo.label
      ElMessage.success('标签更新成功')
    } catch (err: any) {
      // 更新失败，恢复原始标签
      photo.label = photo.originalLabel
      ElMessage.error('标签更新失败：' + (err.message || '未知错误'))
    }
  }
}

/** 新建或合并成功后的统一处理：上传主图/附件、提示、跳转 */
const onCreateOrMergeSuccess = async (result: GoodsDetail & { merged?: boolean }) => {
  const id = result.id
  if (mainPhotoFile.value) {
    await uploadMainPhoto(id, mainPhotoFile.value)
  }
  if (newAdditionalPhotoFiles.value.length > 0) {
    await handleAdditionalPhotosUpload(id)
  }
  ElMessage.success(result.merged ? '已合并到已有谷子' : '创建成功')
  router.push({ name: 'CloudShowcase' })
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    let submitData: GoodsInput | null = null
    try {
      // 确保主题已创建（如果是新主题，先创建获取ID）
      const themeId = await ensureThemeCreated()

      const { main_photo, theme, ...restForm } = formData.value
      submitData = {
        ...restForm,
        price: restForm.price?.toString(),
        ip_id: restForm.ip,
        character_ids: restForm.characters,
        category_id: restForm.category,
        theme_id: themeId, // 使用确保创建后的theme_id（不包含theme字段）
      }
      // purchase_date 为空字符串时不上传该字段
      if (!restForm.purchase_date && submitData) {
        delete (submitData as any).purchase_date
      }

      if (route.params.id) {
        const id = route.params.id as string
        await updateGoods(id, submitData!)

        // 上传主图（如果有新文件）
        if (mainPhotoFile.value) {
          await uploadMainPhoto(id, mainPhotoFile.value)
        }

        // 处理附件图片
        await handleAdditionalPhotosUpload(id)

        ElMessage.success('更新成功')
        router.push({ name: 'CloudShowcase' })
      } else {
        // 新建：默认 auto，检测到重复时后端返回 409
        const result = await createGoods({ ...submitData!, merge_strategy: 'auto' })
        await onCreateOrMergeSuccess(result)
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        const data = err.response?.data
        if (data?.code === 'goods_duplicate' && Array.isArray(data?.candidates) && submitData) {
          pendingCreatePayload.value = { ...submitData }
          duplicateCandidates.value = data.candidates
          duplicateSelectedId.value = null
          duplicateDialogVisible.value = true
        } else {
          ElMessage.error(data?.detail || err.message || '提交失败')
        }
      } else if (err.response?.status === 400) {
        const detail = err.response?.data?.detail
        ElMessage.warning(detail || err.message || '请求参数错误')
      } else {
        ElMessage.error(err.message || '提交失败')
      }
    } finally {
      submitting.value = false
    }
  })
}

const setDuplicateSelectedId = (id: string | null) => {
  duplicateSelectedId.value = id
}

const formatCandidateCreatedAt = (createdAt: string) => {
  if (!createdAt) return '-'
  try {
    const d = new Date(createdAt)
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return createdAt
  }
}

/** 重复弹窗：合并到所选候选 */
const handleDuplicateMerge = async () => {
  const targetId = duplicateSelectedId.value
  const payload = pendingCreatePayload.value
  if (!targetId || !payload) {
    ElMessage.warning('请先选择要合并到的谷子')
    return
  }
  submitting.value = true
  try {
    const result = await createGoods({
      ...payload,
      merge_strategy: 'merge',
      merge_target_id: targetId,
    })
    duplicateDialogVisible.value = false
    duplicateCandidates.value = []
    duplicateSelectedId.value = null
    pendingCreatePayload.value = null
    await onCreateOrMergeSuccess(result)
  } catch (err: any) {
    if (err.response?.status === 400) {
      const detail = err.response?.data?.detail
      ElMessage.warning(detail || err.message || '请求参数错误')
    } else {
      ElMessage.error(err.message || '操作失败')
    }
  } finally {
    submitting.value = false
  }
}

/** 重复弹窗：仍然新建一条 */
const handleDuplicateNew = async () => {
  const payload = pendingCreatePayload.value
  if (!payload) return
  submitting.value = true
  try {
    const result = await createGoods({ ...payload, merge_strategy: 'new' })
    duplicateDialogVisible.value = false
    duplicateCandidates.value = []
    duplicateSelectedId.value = null
    pendingCreatePayload.value = null
    await onCreateOrMergeSuccess(result)
  } catch (err: any) {
    ElMessage.error(err.message || '创建失败')
  } finally {
    submitting.value = false
  }
}

const handleReset = () => {
  formRef.value?.resetFields()
}

const handleCancel = () => {
  router.back()
}

// 处理附件图片上传
const handleAdditionalPhotosUpload = async (goodsId: string) => {
  // 如果没有新上传的图片，直接返回
  if (newAdditionalPhotoFiles.value.length === 0) {
    return
  }

  try {
    // 每张图片单独上传，以支持独立的标签
    for (const photo of newAdditionalPhotoFiles.value) {
      const label = photo.label?.trim() || ''
      await uploadAdditionalPhotos(goodsId, [photo.file], { label })
    }
  } catch (err: any) {
    ElMessage.error('上传附件图片失败：' + (err.message || '未知错误'))
    throw err
  }
}

onMounted(async () => {
  // 加载基础数据
  try {
    const [ipList, characterList, categoryList, themeList] = await Promise.all([
      getIPList(),
      getCharacterList(),
      getCategoryList(),
      getThemeList(),
    ])
    ipOptions.value = ipList
    characters.value = characterList
    categoryOptions.value = categoryList
    allThemes.value = themeList
    themeOptions.value = themeList
  } catch (err) {
    ElMessage.error('加载基础数据失败')
  }

  await locationStore.fetchNodes()

  // 如果是新增模式，预设备注模板
  if (!route.params.id) {
    formData.value.notes = '店铺：\n工艺：\n画师：\n主题：'
  }

  // 如果是编辑模式，加载数据
  if (route.params.id) {
    try {
      const data = await getGoodsDetail(route.params.id as string)
      formData.value = {
        name: data.name,
        ip: data.ip.id,
        characters: data.characters.map(c => c.id),
        category: data.category.id,
        theme: data.theme?.id || null,
        status: data.status as 'in_cabinet' | 'outdoor' | 'sold',
        location: data.location || undefined,
        quantity: data.quantity,
        price: data.price ? parseFloat(data.price) : undefined,
        purchase_date: data.purchase_date || '',
        is_official: data.is_official,
        notes: data.notes || '',
        main_photo: data.main_photo || '',
      }
      if (data.main_photo) {
        mainPhotoList.value = [{ url: data.main_photo, name: 'main_photo' } as UploadFile]
      }

      // 加载附件图片
      if (data.additional_photos && data.additional_photos.length > 0) {
        existingAdditionalPhotos.value = data.additional_photos.map((photo) => ({
          ...photo,
          label: photo.label || '',
          originalLabel: photo.label || '', // 记录原始标签
        }))
      }
    } catch (err) {
      ElMessage.error('加载数据失败')
    }
  }
})

// 组件卸载时清理预览URL
onUnmounted(() => {
  newAdditionalPhotoFiles.value.forEach((photo) => {
    if (photo.preview) {
      URL.revokeObjectURL(photo.preview)
    }
  })
  // 清理裁切预览URL
  if (cropImageSrc.value && cropImageSrc.value.startsWith('blob:')) {
    URL.revokeObjectURL(cropImageSrc.value)
  }
  // 清理主图预览URL
  mainPhotoList.value.forEach((file) => {
    if (file.url && file.url.startsWith('blob:')) {
      URL.revokeObjectURL(file.url)
    }
  })
})
</script>

<style scoped>
.goods-form {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.goods-form-header {
  margin-bottom: 16px;
}

.goods-form-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--primary-gold);
}

.goods-el-form {
  margin-top: 4px;
}

/* 分区卡片布局 */
.form-section {
  margin-bottom: 20px;
  padding: 16px 18px 18px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(17, 24, 39, 0.04);
}

.form-section--images {
  background: radial-gradient(circle at top left, #ffffff, #fafbff);
}

.form-section-header {
  margin-bottom: 12px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.form-section-title {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.form-section-subtitle {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.form-section-header::before {
  content: '';
  width: 3px;
  height: 20px;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--primary-gold), #d9c18a);
  align-self: center;
}

.form-actions-inline {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-actions-inline :deep(.el-button) {
  border-radius: 999px;
}

/* 统一表单控件风格 */
.goods-form :deep(.el-form-item) {
  margin-bottom: 26px;
}

.goods-form :deep(.el-input__wrapper),
.goods-form :deep(.el-textarea__inner),
.goods-form :deep(.el-select .el-input__wrapper),
.goods-form :deep(.el-input-number__decrease),
.goods-form :deep(.el-input-number__increase),
.goods-form :deep(.el-date-editor.el-input__wrapper),
.goods-form :deep(.el-date-editor.el-input) {
  border-radius: 10px;
  border-color: #e5e5e5;
  background-color: #ffffff;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    background-color 0.16s ease;
}

.goods-form :deep(.el-input__wrapper:hover),
.goods-form :deep(.el-textarea__inner:hover),
.goods-form :deep(.el-select .el-input__wrapper:hover),
.goods-form :deep(.el-date-editor.el-input__wrapper:hover) {
  border-color: #d0d0d7;
  box-shadow: 0 0 0 1px rgba(208, 208, 215, 0.3);
}

.goods-form :deep(.el-input.is-focus .el-input__wrapper),
.goods-form :deep(.el-select .el-input.is-focus .el-input__wrapper),
.goods-form :deep(.el-textarea__inner:focus),
.goods-form :deep(.el-date-editor.el-input__wrapper.is-active) {
  border-color: var(--primary-gold);
  box-shadow:
    0 0 0 1px rgba(195, 160, 80, 0.35),
    0 10px 18px rgba(0, 0, 0, 0.06);
}

.goods-form :deep(.el-button) {
  border-radius: 10px;
}

/* Label 与必填星号弱化 */
.goods-form :deep(.el-form-item__label) {
  color: #606266;
  font-weight: 500;
  font-size: 13px;
}

.goods-form :deep(.el-form-item__label .el-form-item__required-star) {
  color: #f56c6c;
  font-size: 12px;
  margin-left: 2px;
}

.goods-form :deep(.el-form-item.is-required .el-form-item__label) {
  position: relative;
}

/* 图标化表单项 */
.field-with-icon {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-icon {
  flex-shrink: 0;
  font-size: 16px;
  color: #909399;
}

.category-chip {
  margin-top: 6px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  background: #f7f7fb;
  border: 1px solid #ebeef5;
  font-size: 12px;
  color: #606266;
}

.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 0 0 1px #e0e0e0;
}

.chip-text {
  white-space: nowrap;
}

.main-photo-preview {
  margin-top: 12px;
  width: 160px;
  height: 160px;
}

.main-photo-preview .el-image {
  width: 100%;
  height: 100%;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.main-photo-card-shell {
  display: inline-block;
}

.hide-upload-trigger :deep(.el-upload--picture-card) {
  display: none;
}

.main-photo-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.main-photo-actions {
  margin-top: 10px;
}

.main-photo-preview .el-image {
  width: 100%;
  height: 100%;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.main-photo-uploader :deep(.el-upload--picture-card) {
  width: 220px;
  height: 220px;
  border-radius: 16px;
  border: 1px dashed #e0e3f0;
  border-color: #e0e3f0;
  background: #fafbff;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    background-color 0.16s ease,
    transform 0.16s ease;
}

.main-photo-uploader :deep(.el-upload--picture-card:hover) {
  border-color: var(--primary-gold);
  background: #fdfaf3;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.main-photo-uploader :deep(.el-upload--picture-card .el-icon) {
  font-size: 26px;
  color: #b1b5c6;
}

/* 统一附件加号卡片的虚线更轻、更稀疏 */
.additional-photo-upload :deep(.el-upload--picture-card) {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  border-style: dashed;
  border-width: 1px;
  border-color: #e7e9f4;
  background-color: #fbfbff;
}

:deep(.el-upload--picture-card) {
  border-color: var(--border-color);
}

:deep(.el-upload--picture-card:hover) {
  border-color: var(--primary-gold);
}

/* 附件图片样式 */
.additional-photos-section {
  width: 100%;
}

.existing-photos,
.new-photos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .existing-photos,
  .new-photos {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 12px;
  }
}

.photo-item {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.photo-preview {
  width: 100%;
  height: 120px;
  border-radius: 10px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease;
}

@media (max-width: 768px) {
  .photo-preview {
    height: 100px;
  }
}

.photo-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.photo-label-input {
  flex: 1;
}

.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #f5f7fa;
  color: #909399;
}

.additional-photo-upload {
  display: inline-block;
}

.additional-photo-upload :deep(.el-upload--picture-card) {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  border-style: dashed;
}

/* 状态分段选择器视觉（基于 el-radio-button） */
.status-segmented {
  display: inline-flex;
  gap: 8px;
}

.status-segmented :deep(.el-radio-button__inner) {
  border-radius: 999px !important;
  border: none;
  background-color: transparent;
  box-shadow: none;
  padding: 8px 14px;
  font-size: 13px;
  color: #606266;
}

.status-segmented :deep(.el-radio-button:first-child .el-radio-button__inner),
.status-segmented :deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-radius: 999px !important;
}

.status-segmented :deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
  background: linear-gradient(135deg, #a396ff 0%, var(--primary-gold) 100%);
  color: #ffffff;
  box-shadow: 0 8px 18px rgba(163, 150, 255, 0.35);
}

.status-segmented :deep(.el-radio-button__inner:hover) {
  background-color: rgba(0, 0, 0, 0.03);
}

@media (max-width: 768px) {
  .additional-photo-upload :deep(.el-upload--picture-card) {
    width: 100px;
    height: 100px;
  }
}

/* 主图选择抽屉样式（参考品类管理页面） */
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
  cursor: pointer;
}

.sheet-item:active {
  background: #f5f5f5;
}

.sheet-cancel {
  margin-top: 8px;
  background: #fff;
  padding: 16px;
  text-align: center;
  font-size: 16px;
  color: #333;
  cursor: pointer;
}

.sheet-cancel:active {
  background: #f5f5f5;
}

/* 图片裁切对话框样式 */
.crop-dialog {
  z-index: 3000;
}

.crop-container {
  width: 100%;
  padding-top: 4px;
}

.crop-glass-panel {
  position: relative;
  padding: 18px 20px 20px;
  border-radius: 18px;
  background: radial-gradient(circle at top left, rgba(255, 255, 255, 0.32), rgba(255, 255, 255, 0.08));
  border: 1px solid rgba(255, 255, 255, 0.22);
  box-shadow:
    0 18px 45px rgba(15, 23, 42, 0.22),
    0 0 0 1px rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.crop-header-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
}

.crop-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.crop-subtitle {
  font-size: 12px;
  color: #909399;
}

.aspect-ratio-selector {
  margin-bottom: 20px;
  padding: 14px 14px 12px;
  background: rgba(255, 255, 255, 0.16);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.22);
}

.ratio-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
  font-weight: 500;
}

.ratio-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ratio-buttons :deep(.el-button) {
  border-radius: 999px;
  border-color: transparent;
  background-color: rgba(255, 255, 255, 0.12);
  color: #606266;
  box-shadow: none;
}

.ratio-buttons :deep(.el-button.el-button--primary) {
  color: #fff;
  background-image: linear-gradient(135deg, var(--primary-gold), rgba(255, 255, 255, 0.9));
  border-color: var(--primary-gold);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
}

.ratio-buttons :deep(.el-button:hover) {
  background-color: rgba(255, 255, 255, 0.24);
}

.image-filters {
  margin-bottom: 20px;
  padding: 14px 14px 10px;
  background: rgba(255, 255, 255, 0.16);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.22);
}

.filter-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.filter-label {
  width: 60px;
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.filter-item .el-slider {
  flex: 1;
  margin-left: 12px;
  margin-right: 12px;
}

.filter-reset {
  text-align: right;
  margin-top: -5px;
}

/* 图像微调滑块：金色前景 + 灰色后段轨道 */
.image-filters :deep(.el-slider__runway) {
  background-color: #e4e7ed; /* 灰色基准轨道，形成“后面一段灰色” */
}

.image-filters :deep(.el-slider__bar) {
  background-color: var(--primary-gold); /* 已调节部分为金色 */
}

.image-filters :deep(.el-slider__button) {
  border-color: transparent;
  background-color: #ffffff;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.22);
}

/* 追加：比例分段选择器的胶囊容器与几何图标 */
.aspect-ratio-selector {
  margin-bottom: 14px;
  padding: 10px 10px 8px;
  background: transparent;
  border-radius: 14px;
}

.ratio-segmented {
  width: 100%;
}

.ratio-segmented-track {
  position: relative;
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  background-color: rgba(0, 0, 0, 0.04);
  border-radius: 999px;
  padding: 2px;
}

.ratio-segmented-thumb {
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 2px;
  width: calc((100% - 4px) / 5);
  border-radius: 999px;
  background-color: var(--primary-gold);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
  transform: translateX(calc(var(--active-index, 0) * 100%));
  transition: transform 0.18s ease-out;
  pointer-events: none;
}

.ratio-segmented-item {
  position: relative;
  z-index: 1;
  border: none;
  background: transparent;
  color: #606266;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 4px;
  font-size: 12px;
  cursor: pointer;
}

.ratio-segmented-item.is-active {
  color: #fff;
}

.ratio-icon {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid currentColor;
}

.ratio-icon--free {
  border-style: dashed;
}

.ratio-icon--1\:1 {
  border-radius: 2px;
}

.ratio-icon--circle {
  border-radius: 999px;
}

.ratio-icon--47\:65-ellipse,
.ratio-icon--63\:93-ellipse {
  border-radius: 999px;
  transform: scaleX(1.3);
}

/* 追加：滤镜区域标题、右上角重置图标与数值常显 */
.image-filters {
  margin-bottom: 12px;
  padding: 10px 10px 8px;
}

.filters-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.filters-title {
  font-size: 13px;
  color: #606266;
}

.filter-reset-btn {
  color: var(--primary-gold);
}

.filter-item {
  margin-bottom: 6px;
}

.filter-item .el-slider {
  margin-right: 8px;
}

.filter-value {
  width: 40px;
  text-align: right;
  font-size: 12px;
  color: #909399;
}

.image-filters :deep(.el-slider__runway) {
  position: relative;
}

.image-filters :deep(.el-slider__runway::before) {
  content: '';
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 50%;
  width: 1px;
  background-color: rgba(0, 0, 0, 0.08);
  transform: translateX(-0.5px);
}

/* 让圆角大小滑块与图像微调滑块风格保持一致 */
.rounded-rect-settings :deep(.el-slider__runway) {
  position: relative;
}

.rounded-rect-settings :deep(.el-slider__runway::before) {
  content: '';
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 50%;
  width: 1px;
  background-color: rgba(0, 0, 0, 0.08);
  transform: translateX(-0.5px);
}

.rounded-rect-settings :deep(.el-slider__bar) {
  background-color: var(--primary-gold);
}

.rounded-rect-settings :deep(.el-slider__button) {
  border-color: transparent;
  background-color: #ffffff;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.22);
}

/* 圆角矩形设置区域 */
.rounded-rect-settings {
  margin-bottom: 12px;
  padding: 10px 10px 8px;
  background: rgba(255, 255, 255, 0.16);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.22);
}

.rounded-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.rounded-title {
  font-size: 13px;
  color: #606266;
}

.rounded-radius-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rounded-label {
  width: 60px;
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.rounded-radius-row .el-slider {
  flex: 1;
}

.rounded-value {
  width: 40px;
  text-align: right;
  font-size: 12px;
  color: #909399;
}

.rounded-radius-row.is-disabled {
  opacity: 0.5;
}

/* 强制应用 CSS filter 到 cropper 的预览图 */
/* 注意：vue-picture-cropper 内部结构可能比较复杂，通常需要作用于 img 元素 */
:deep(.vue-picture-cropper-wrap img),
:deep(.cropper-view-box img),
:deep(.cropper-canvas img) {
  transition: filter 0.2s;
  /* 这里使用 v-bind 绑定 CSS 变量或者直接通过 js 动态修改 style，
     上面的 :style="cropperStyle" 其实只能加到最外层容器，
     往往不能直接继承到内部 img。
     所以我们需要一个更强力的方法：使用 CSS 变量或者通过父级 class 渗透。
  */
  /* 由于 CSS 变量在 scoped 样式中绑定到 :style 可能有作用域问题，
     这里我们采用直接在 template 中给 vue-picture-cropper 绑 style 的方式，
     但是 vue-picture-cropper 根元素可能不是 img。

     修正方案：
     Vue Picture Cropper 接受 style 属性，会应用到根 div。
     我们需要利用 CSS 继承或者选中内部 img。
     Cropper.js 的 img 不会自动继承父级 filter。

     更好的做法是利用 CSS 变量。
  */
}

/* 尝试利用 CSS 变量穿透 */
.cropper-wrapper {
  --brightness: v-bind('filterState.brightness + "%"');
  --contrast: v-bind('filterState.contrast + "%"');
  --saturate: v-bind('filterState.saturation + "%"');
  --rounded-radius: v-bind('roundedRadius + "%"');
  width: 100%;
  margin: 12px auto 0;
  padding: 8px;
  border-radius: 18px;
  background: radial-gradient(circle at top, rgba(255, 255, 255, 0.26), rgba(255, 255, 255, 0.06));
  border: 1px solid rgba(255, 255, 255, 0.24);
  box-shadow:
    0 20px 48px rgba(15, 23, 42, 0.28),
    0 0 0 1px rgba(255, 255, 255, 0.16);
}

:deep(.cropper-canvas img),
:deep(.cropper-view-box img) {
  filter: brightness(var(--brightness)) contrast(var(--contrast)) saturate(var(--saturate)) !important;
}

@media (max-width: 768px) {
  .ratio-buttons {
    gap: 6px;
  }

  .ratio-buttons .el-button {
    font-size: 12px;
    padding: 6px 12px;
  }
}

/* 圆形裁切：仅改变裁切框的视觉形状（导出仍为方图，圆外透明） */
.cropper-wrapper.circle-crop :deep(.cropper-view-box),
.cropper-wrapper.circle-crop :deep(.cropper-face) {
  border-radius: 50%;
}

/* 自由 / 1:1 圆角矩形预览，仅改变裁切框视觉效果，不影响最终像素裁剪顺序 */
.cropper-wrapper.rounded-rect-preview :deep(.cropper-view-box),
.cropper-wrapper.rounded-rect-preview :deep(.cropper-face) {
  border-radius: var(--rounded-radius);
}

@media (max-width: 768px) {
  .crop-dialog :deep(.el-dialog) {
    margin: 5vh auto 0;
    max-height: 90vh;
  }

  .crop-dialog :deep(.el-dialog__body) {
    padding: 14px 14px 18px;
    max-height: calc(90vh - 120px);
    overflow-y: auto;
  }

  .ratio-label {
    font-size: 13px;
    margin-bottom: 10px;
  }

  .crop-glass-panel {
    padding: 14px 14px 16px;
    border-radius: 16px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.26);
}

.dialog-footer :deep(.el-button) {
  border-radius: 999px;
}

.dialog-footer :deep(.el-button--primary) {
  background-color: var(--primary-gold);
  border-color: var(--primary-gold);
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.25);
}

.dialog-footer :deep(.el-button:hover) {
  opacity: 0.96;
}

@media (max-width: 768px) {
  .dialog-footer {
    gap: 8px;
  }

  .dialog-footer .el-button {
    flex: 1;
  }
}

/* 新建去重弹窗 */
.duplicate-dialog :deep(.el-dialog__body) {
  padding-top: 8px;
}

.duplicate-dialog-desc {
  margin: 0 0 12px;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

.duplicate-candidates-list {
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 4px 0;
}

.duplicate-candidate-item {
  padding: 10px 12px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.duplicate-candidate-item:hover,
.duplicate-candidate-item.is-selected {
  background-color: var(--el-fill-color-light);
}

.duplicate-candidate-item :deep(.el-radio) {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  margin-right: 0;
  height: auto;
}

.duplicate-candidate-item :deep(.el-radio__label) {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.duplicate-candidate-item .candidate-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.duplicate-candidate-item .candidate-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

</style>

