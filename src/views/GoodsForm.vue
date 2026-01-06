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
            <el-form-item label="角色" prop="character">
              <el-select
                v-model="formData.character"
                placeholder="选择角色"
                filterable
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

          <el-col :xs="24" :sm="12">
            <el-form-item label="数量" prop="quantity">
              <el-input-number v-model="formData.quantity" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="12">
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

          <el-col :xs="24" :sm="12">
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

          <el-col :xs="24" :sm="12">
            <el-form-item label="是否官谷">
              <el-switch v-model="formData.is_official" />
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
                accept="image/*"
              >
                <template #trigger>
                  <el-icon v-if="mainPhotoList.length < 1"><Plus /></el-icon>
                </template>
              </el-upload>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules, type UploadFile } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useLocationStore } from '@/stores/location'
import { createGoods, updateGoods, getGoodsDetail, uploadMainPhoto } from '@/api/goods'
import { getIPList, getCharacterList, getCategoryList } from '@/api/metadata'
import type { GoodsDetail, IP, Character, Category } from '@/api/types'

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
  character: undefined as number | undefined,
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
const formTitle = computed(() => {
  return route.params.id ? '编辑谷子' : '新增谷子'
})

const filteredCharacters = computed(() => {
  if (!formData.value.ip) return []
  return characters.value.filter((char) => char.ip.id === formData.value.ip)
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入谷子名称', trigger: 'blur' }],
  ip: [{ required: true, message: '请选择IP', trigger: 'change' }],
  character: [{ required: true, message: '请选择角色', trigger: 'change' }],
  category: [{ required: true, message: '请选择品类', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

const handleIpChange = () => {
  formData.value.character = undefined
}

const dummyUpload = () => Promise.resolve()

const handleMainPhotoChange = (uploadFile: UploadFile, uploadFiles: UploadFile[]) => {
  mainPhotoList.value = uploadFiles.slice(-1)
  mainPhotoFile.value = uploadFile.raw || null
  // 选择文件后清空旧 URL，避免表单里既有文件又有 URL
  if (mainPhotoFile.value) {
    formData.value.main_photo = ''
  }
}

const handleMainPhotoRemove = () => {
  mainPhotoFile.value = null
  mainPhotoList.value = []
  formData.value.main_photo = ''
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
        character_id: restForm.character,
        category_id: restForm.category,
      }
      // purchase_date 为空字符串时不上传该字段
      if (!restForm.purchase_date) {
        delete (submitData as any).purchase_date
      }

      if (route.params.id) {
        const id = route.params.id as string
        await updateGoods(id, submitData)
        if (mainPhotoFile.value) {
          await uploadMainPhoto(id, mainPhotoFile.value)
        }
        ElMessage.success('更新成功')
      } else {
        const result = await createGoods(submitData)
        // 上传主图（可选）
        if (result?.id && mainPhotoFile.value) {
          await uploadMainPhoto(result.id, mainPhotoFile.value)
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
        character: data.character.id,
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
    } catch (err) {
      ElMessage.error('加载数据失败')
    }
  }
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

</style>

