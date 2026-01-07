<template>
  <div class="ip-management">
    <el-card class="management-card">
      <template #header>
        <div class="card-header">
          <span>IP作品管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增IP
          </el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchText"
          placeholder="搜索IP作品名称"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
          style="width: 300px"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>

      <!-- PC端表格 -->
      <div v-loading="loading" class="table-container">
        <el-table :data="ipList" stripe style="width: 100%" class="desktop-table">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="作品名称" min-width="200" />
          <el-table-column label="关键词" min-width="250">
            <template #default="{ row }">
              <div class="keywords-display">
                <el-tag
                  v-for="keyword in row.keywords || []"
                  :key="keyword.id"
                  size="small"
                  class="keyword-tag"
                >
                  {{ keyword.value }}
                </el-tag>
                <span v-if="!row.keywords || row.keywords.length === 0" class="text-gray">暂无</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button text type="primary" @click="handleEdit(row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button text type="danger" @click="handleDelete(row)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 移动端卡片列表 -->
        <div class="mobile-card-list">
          <div
            v-for="item in ipList"
            :key="item.id"
            class="mobile-card"
          >
            <div class="card-header-section">
              <div class="card-title-row">
                <h3 class="card-name">{{ item.name }}</h3>
                <div class="card-keywords-inline">
                  <el-tag
                    v-for="keyword in item.keywords || []"
                    :key="keyword.id"
                    size="small"
                    class="keyword-tag"
                  >
                    {{ keyword.value }}
                  </el-tag>
                  <span v-if="!item.keywords || item.keywords.length === 0" class="text-gray">暂无</span>
                </div>
              </div>
            </div>
            <div class="card-actions">
              <el-button type="primary" size="small" @click="handleEdit(item)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button type="danger" size="small" @click="handleDelete(item)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </div>
        </div>

        <el-empty v-if="!loading && ipList.length === 0" description="暂无数据" />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        :model="formData"
        :rules="formRules"
        ref="formRef"
        label-position="top"
      >
        <el-form-item label="作品名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入IP作品名称"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="关键词">
          <div class="keywords-manager">
            <div class="keywords-input-group">
              <el-input
                v-model="newKeyword"
                placeholder="输入关键词（通常是IP全称的缩写，如：星铁、崩铁、HSR）"
                maxlength="50"
                @keyup.enter="handleAddKeyword"
                clearable
              >
                <template #append>
                  <el-button @click="handleAddKeyword" :disabled="!newKeyword.trim()">
                    <el-icon><Plus /></el-icon>
                    添加
                  </el-button>
                </template>
              </el-input>
            </div>
            <div class="keywords-list">
              <el-tag
                v-for="(keyword, index) in formData.keywords"
                :key="index"
                closable
                @close="handleRemoveKeyword(index)"
                class="keyword-tag"
              >
                {{ keyword }}
              </el-tag>
              <div v-if="formData.keywords.length === 0" class="empty-keywords">
                <span class="text-gray">暂无关键词，可添加IP的缩写或别名</span>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Edit, Delete, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  getIPList,
  getIPDetail,
  createIP,
  updateIP,
  deleteIP,
} from '@/api/metadata'
import type { IP } from '@/api/types'

const loading = ref(false)
const submitting = ref(false)
const searchText = ref('')
const ipList = ref<IP[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const newKeyword = ref('')

const formData = ref({
  name: '',
  keywords: [] as string[],
})

const formRules: FormRules = {
  name: [
    { required: true, message: '请输入作品名称', trigger: 'blur' },
    { max: 100, message: '作品名称不能超过100个字符', trigger: 'blur' },
  ],
}

const dialogTitle = computed(() => (isEdit.value ? '编辑IP作品' : '新增IP作品'))

// 加载IP列表
const fetchIPList = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (searchText.value.trim()) {
      params.search = searchText.value.trim()
    }
    const data = await getIPList(params)
    ipList.value = data
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  fetchIPList()
}

// 新增
const handleAdd = () => {
  isEdit.value = false
  editingId.value = null
  formData.value = { name: '', keywords: [] }
  newKeyword.value = ''
  dialogVisible.value = true
}

// 编辑
const handleEdit = async (row: IP) => {
  isEdit.value = true
  editingId.value = row.id
  
  // 获取完整详情以获取关键词
  try {
    const detail = await getIPDetail(row.id)
    formData.value = {
      name: detail.name,
      keywords: detail.keywords?.map(k => k.value) || [],
    }
  } catch (err: any) {
    // 如果获取详情失败，使用列表数据
    formData.value = {
      name: row.name,
      keywords: row.keywords?.map(k => k.value) || [],
    }
  }
  
  newKeyword.value = ''
  dialogVisible.value = true
}

// 添加关键词
const handleAddKeyword = () => {
  const keyword = newKeyword.value.trim()
  if (!keyword) return
  
  // 检查是否已存在
  if (formData.value.keywords.includes(keyword)) {
    ElMessage.warning('该关键词已存在')
    return
  }
  
  // 检查长度
  if (keyword.length > 50) {
    ElMessage.warning('关键词不能超过50个字符')
    return
  }
  
  formData.value.keywords.push(keyword)
  newKeyword.value = ''
}

// 删除关键词
const handleRemoveKeyword = (index: number) => {
  formData.value.keywords.splice(index, 1)
}

// 删除
const handleDelete = async (row: IP) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除IP作品"${row.name}"吗？删除后该IP下的所有角色和谷子数据将无法正常显示。`,
      '提示',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
      }
    )
    await deleteIP(row.id)
    ElMessage.success('删除成功')
    await fetchIPList()
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err.message || '删除失败')
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      const submitData: { name: string; keywords?: string[] } = {
        name: formData.value.name,
      }
      
      // 如果有关键词，则包含在提交数据中（即使是空数组也会完全替换）
      if (formData.value.keywords.length > 0) {
        submitData.keywords = formData.value.keywords
      }
      
      if (isEdit.value && editingId.value) {
        await updateIP(editingId.value, submitData)
        ElMessage.success('更新成功')
      } else {
        await createIP(submitData)
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      await fetchIPList()
    } catch (err: any) {
      ElMessage.error(err.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

// 对话框关闭
const handleDialogClose = () => {
  formRef.value?.resetFields()
  formData.value = { name: '', keywords: [] }
  newKeyword.value = ''
}

onMounted(() => {
  fetchIPList()
})
</script>

<style scoped>
.ip-management {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.management-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  color: var(--primary-gold);
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.table-container {
  min-height: 400px;
}

:deep(.el-table) {
  border-radius: var(--card-radius);
  overflow: hidden;
}

:deep(.el-button.is-text) {
  padding: 4px 8px;
}

.keywords-display {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.keyword-tag {
  margin: 0;
}

.text-gray {
  color: var(--text-light);
  font-size: 12px;
}

/* 移动端卡片布局 */
.mobile-card-list {
  display: none;
}

.mobile-card {
  background: #fff;
  border: 1px solid var(--border-color, #dcdfe6);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.mobile-card:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.card-header-section {
  margin-bottom: 8px;
}

.card-title-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.card-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  flex: 0 1 45%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-keywords-inline {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  flex-wrap: nowrap;
}

.card-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color, #e4e7ed);
}

.card-actions .el-button {
  flex: 1;
}

/* 响应式：移动端显示卡片，PC端显示表格 */
@media (max-width: 768px) {
  .desktop-table {
    display: none !important;
  }

  .mobile-card-list {
    display: block;
  }

  .search-bar {
    flex-direction: column;
  }

  .search-bar .el-input {
    width: 100% !important;
  }

  .search-bar .el-button {
    width: 100%;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .card-header .el-button {
    width: 100%;
  }
}

@media (min-width: 769px) {
  .mobile-card-list {
    display: none !important;
  }

  .desktop-table {
    display: table !important;
  }
}

.keywords-manager {
  width: 100%;
}

.keywords-input-group {
  margin-bottom: 12px;
}

.keywords-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 32px;
  padding: 8px;
  border: 1px solid var(--border-color, #dcdfe6);
  border-radius: 4px;
  background-color: var(--bg-light, #f5f7fa);
}

.empty-keywords {
  width: 100%;
  text-align: center;
  padding: 8px 0;
}

/* 弹窗 & 表单移动端适配 */
@media (max-width: 768px) {
  :deep(.el-dialog) {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0;
    border-radius: 0;
  }

  :deep(.el-dialog__body) {
    max-height: calc(100vh - 120px);
    overflow-y: auto;
  }
}
</style>

