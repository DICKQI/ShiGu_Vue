<template>
  <div class="goods-form">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ formTitle }}</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        label-position="top"
      >
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12">
            <el-form-item label="谷子名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入谷子名称" />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12">
            <el-form-item label="IP作品" prop="ip">
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
            <el-form-item label="角色" prop="characters">
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
            <el-form-item label="品类" prop="category">
              <el-select
                v-model="formData.category"
                placeholder="选择品类"
                style="width: 100%"
              >
                <el-option
                  v-for="cat in categoryOptions"
                  :key="cat.id"
                  :label="cat.name"
                  :value="cat.id"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="formData.status">
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
                :props="{ label: 'label', value: 'id' }"
              />
            </el-form-item>
          </el-col>

          <el-col :xs="12" :sm="12">
            <el-form-item label="数量" prop="quantity">
              <el-input-number v-model="formData.quantity" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>

          <el-col :xs="12" :sm="12">
            <el-form-item label="购入价格">
              <el-input-number
                v-model="formData.price"
                :precision="2"
                :min="0"
                placeholder="请输入价格"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :xs="12" :sm="12">
            <el-form-item label="入手日期">
              <el-date-picker
                v-model="formData.purchase_date"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>

          <el-col :xs="12" :sm="12">
            <el-form-item label="是否官谷">
              <el-switch v-model="formData.is_official" active-text="是" inactive-text="否" inline-prompt />
            </el-form-item>
          </el-col>

          <el-col :xs="24">
            <el-form-item label="主图">
              <el-upload
                v-model:file-list="mainPhotoList"
                list-type="picture-card"
                :auto-upload="false"
                :limit="1"
                :on-change="handleMainPhotoChange"
                :on-remove="handleMainPhotoRemove"
                :http-request="dummyUpload"
                :show-file-list="true"
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

          <el-col :xs="24">
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

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            提交
          </el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button @click="handleCancel">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>

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
      :width="isMobile ? '95%' : '600px'"
      :close-on-click-modal="false"
      class="crop-dialog"
      @close="handleCropDialogClose"
    >
      <div class="crop-container">
        <!-- 比例选择 -->
        <div class="aspect-ratio-selector">
          <div class="ratio-label">选择比例：</div>
          <div class="ratio-buttons">
            <el-button
              v-for="ratio in aspectRatios"
              :key="ratio.value"
              :type="selectedAspectRatio === ratio.value ? 'primary' : 'default'"
              size="small"
              @click="selectedAspectRatio = ratio.value"
            >
              {{ ratio.label }}
            </el-button>
          </div>
        </div>

        <!-- 裁切组件 -->
        <div class="cropper-wrapper">
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
          />
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type UploadFile } from 'element-plus'
import { Plus, Delete, Picture, Camera as CameraIcon } from '@element-plus/icons-vue'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'
import VuePictureCropper, { cropper } from 'vue-picture-cropper'
import { useLocationStore } from '@/stores/location'
import { createGoods, updateGoods, getGoodsDetail, uploadMainPhoto, uploadAdditionalPhotos, deleteAdditionalPhoto, updateAdditionalPhotoLabel } from '@/api/goods'
import { getIPList, getCharacterList, getCategoryList } from '@/api/metadata'
import type { GoodsDetail, IP, Character, Category, GuziImage } from '@/api/types'

const router = useRouter()
const route = useRoute()
const locationStore = useLocationStore()

const formRef = ref<FormInstance>()
const submitting = ref(false)

// 从API获取的数据
const ipOptions = ref<IP[]>([])
const characters = ref<Character[]>([])
const categoryOptions = ref<Category[]>([])

const formData = ref({
  name: '',
  ip: undefined as number | undefined,
  characters: [] as number[],
  category: undefined as number | undefined,
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
  { label: '16:9', value: '16:9' },
  { label: '4:3', value: '4:3' },
  { label: '3:4', value: '3:4' },
  { label: '9:16', value: '9:16' },
]

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
  if (selectedAspectRatio.value !== 'free') {
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
          mimeType: cropImageFile.value.type || 'image/png',
          quality: 0.9,
        })
        if (blob) {
          const mime = cropImageFile.value?.type || 'image/png'
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
          mimeType: cropImageFile.value.type || 'image/png',
          quality: 0.9,
        })
        if (dataURL) {
          // 将 dataURL 转换为 Blob
          const response = await fetch(dataURL)
          const blob = await response.blob()
          const mime = cropImageFile.value?.type || 'image/png'
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
            const mime = cropImageFile.value?.type || 'image/png'
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

    // 设置主图
    setMainPhotoFromFile(croppedFile, previewUrl)

    // 关闭对话框
    cropDialogVisible.value = false
    cropping.value = false

    ElMessage.success('图片裁切完成')
  } catch (err: any) {
    ElMessage.error('裁切失败：' + (err?.message || '未知错误'))
    cropping.value = false
  }
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

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      const { main_photo, ...restForm } = formData.value
      const submitData: import('@/api/types').GoodsInput = {
        ...restForm,
        price: restForm.price?.toString(),
        ip_id: restForm.ip,
        character_ids: restForm.characters,
        category_id: restForm.category,
      }
      // purchase_date 为空字符串时不上传该字段
      if (!restForm.purchase_date) {
        delete (submitData as any).purchase_date
      }

      if (route.params.id) {
        const id = route.params.id as string
        await updateGoods(id, submitData)
        
        // 上传主图（如果有新文件）
        if (mainPhotoFile.value) {
          await uploadMainPhoto(id, mainPhotoFile.value)
        }
        
        // 处理附件图片
        await handleAdditionalPhotosUpload(id)
        
        ElMessage.success('更新成功')
      } else {
        const result = await createGoods(submitData)
        const id = result.id
        
        // 上传主图（可选）
        if (mainPhotoFile.value) {
          await uploadMainPhoto(id, mainPhotoFile.value)
        }
        
        // 上传附件图片（如果有）
        if (newAdditionalPhotoFiles.value.length > 0) {
          await handleAdditionalPhotosUpload(id)
        }
        
        ElMessage.success('创建成功')
      }

      router.push({ name: 'CloudShowcase' })
    } catch (err: any) {
      // 幂等性处理
      if (err.response?.status === 409 || err.message?.includes('已存在')) {
        ElMessage.warning('检测到相同资产已存在，已为您跳转至编辑页面')
        // 这里可以跳转到编辑页面
      } else {
        ElMessage.error(err.message || '提交失败')
      }
    } finally {
      submitting.value = false
    }
  })
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
    const [ipList, characterList, categoryList] = await Promise.all([
      getIPList(),
      getCharacterList(),
      getCategoryList(),
    ])
    ipOptions.value = ipList
    characters.value = characterList
    categoryOptions.value = categoryList
  } catch (err) {
    ElMessage.error('加载基础数据失败')
  }

  await locationStore.fetchNodes()

  // 如果是编辑模式，加载数据
  if (route.params.id) {
    try {
      const data = await getGoodsDetail(route.params.id as string)
      formData.value = {
        name: data.name,
        ip: data.ip.id,
        characters: data.characters.map(c => c.id),
        category: data.category.id,
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
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  font-weight: bold;
  color: var(--primary-gold);
  font-size: 18px;
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

.main-photo-preview .el-image {
  width: 100%;
  height: 100%;
  border: 1px solid var(--border-color);
  border-radius: 4px;
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
  border-radius: 4px;
  border: 1px solid var(--border-color);
  overflow: hidden;
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
}

.aspect-ratio-selector {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f8f8;
  border-radius: 4px;
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

@media (max-width: 768px) {
  .ratio-buttons {
    gap: 6px;
  }
  
  .ratio-buttons .el-button {
    font-size: 12px;
    padding: 8px 12px;
  }
}

.cropper-wrapper {
  width: 100%;
  margin: 0 auto;
  overflow: hidden;
}

@media (max-width: 768px) {
  .crop-dialog :deep(.el-dialog) {
    margin: 5vh auto 0;
    max-height: 90vh;
  }
  
  .crop-dialog :deep(.el-dialog__body) {
    padding: 15px;
    max-height: calc(90vh - 120px);
    overflow-y: auto;
  }
  
  .aspect-ratio-selector {
    padding: 12px;
    margin-bottom: 15px;
  }
  
  .ratio-label {
    font-size: 13px;
    margin-bottom: 10px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .dialog-footer {
    gap: 8px;
  }
  
  .dialog-footer .el-button {
    flex: 1;
  }
}

</style>

