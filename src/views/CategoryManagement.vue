<template>
  <div class="category-management-container">
    <div class="header-section">
      <div class="title-wrapper">
        <h2 class="page-title">品类管理</h2>
        <span class="sub-title">配置谷子的种类（如：立牌、马口铁徽章等）</span>
      </div>
      <div class="header-actions">
        <el-button class="add-btn" type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          <span>新增品类</span>
        </el-button>
      </div>
    </div>

    <el-card class="search-card" shadow="never">
      <div class="search-flex">
        <el-input
          v-model="searchText"
          placeholder="搜索品类..."
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

    <div v-loading="loading" class="content-body">
      <!-- 统一使用简洁列表/表格 -->
      <div class="category-list-wrapper">
        <el-table :data="categoryList" style="width: 100%">
          <el-table-column prop="id" label="ID" width="80" align="center" class-name="id-column" />
          <el-table-column prop="name" label="品类名称">
            <template #default="{ row }">
              <div class="category-item-name">
                <el-icon class="folder-icon"><CollectionTag /></el-icon>
                <span>{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="right">
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
      
      <el-empty v-if="!loading && categoryList.length === 0" />
    </div>

    <!-- 刷新按钮 - 右下角悬浮 -->
    <div class="refresh-fab" @click="handleRefresh" :class="{ loading: loading }">
      <el-icon v-if="!loading"><Refresh /></el-icon>
      <el-icon v-else class="is-loading"><Loading /></el-icon>
    </div>

    <!-- 弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="400px" class="custom-dialog" align-center>
      <el-form :model="formData" :rules="formRules" ref="formRef" label-position="top">
        <el-form-item label="品类名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入品类名称，如：马口铁徽章" maxlength="50" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" class="submit-btn" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Search, CollectionTag, Refresh, Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getCategoryList, createCategory, updateCategory, deleteCategory } from '@/api/metadata'
import type { Category } from '@/api/types'

const loading = ref(false)
const submitting = ref(false)
const searchText = ref('')
const categoryList = ref<Category[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const formData = ref({ name: '' })
const formRules: FormRules = {
  name: [{ required: true, message: '名称不能为空', trigger: 'blur' }]
}

const dialogTitle = computed(() => isEdit.value ? '🏷️ 修改品类' : '✨ 新增品类')

const fetchCategoryList = async () => {
  loading.value = true
  try {
    const data = await getCategoryList({ search: searchText.value.trim() || undefined })
    categoryList.value = data
  } finally {
    loading.value = false
  }
}

const handleSearch = () => fetchCategoryList()
const handleRefresh = () => fetchCategoryList()
const handleAdd = () => { isEdit.value = false; formData.value.name = ''; dialogVisible.value = true; }
const handleEdit = (row: Category) => { isEdit.value = true; editingId.value = row.id; formData.value.name = row.name; dialogVisible.value = true; }

const handleDelete = async (row: Category) => {
  try {
    await ElMessageBox.confirm(`确定删除品类《${row.name}》吗？`, '提示')
    await deleteCategory(row.id)
    ElMessage.success('已删除')
    fetchCategoryList()
  } catch {}
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      if (isEdit.value && editingId.value) {
        await updateCategory(editingId.value, formData.value)
      } else {
        await createCategory(formData.value)
      }
      dialogVisible.value = false
      fetchCategoryList()
    } finally {
      submitting.value = false
    }
  })
}

onMounted(fetchCategoryList)
</script>

<style scoped>
.category-management-container { 
  padding: 20px; 
  max-width: 1400px; 
  margin: 0 auto; 
  min-height: calc(100vh - 64px); 
}
.header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-title { font-size: 22px; font-weight: 600; color: #303133; margin: 0; }
.sub-title { font-size: 13px; color: #909399; }

.search-card { border-radius: 12px; border: none; margin-bottom: 20px; }
.search-flex { display: flex; gap: 8px; }
.custom-search { flex: 1; }

.add-btn, .search-btn, .submit-btn {
  background: linear-gradient(135deg, #a396ff 0%, #8e7dff 100%);
  border: none; border-radius: 8px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-list-wrapper { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }

/* 刷新按钮 - 右下角悬浮 */
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
  transition: all var(--transition-normal);
  z-index: 999;
  outline: none;
  -webkit-tap-highlight-color: transparent;
  border: none;
}

.refresh-fab:hover {
  transform: scale(1.1) rotate(180deg);
  box-shadow: 0 6px 20px rgba(163, 150, 255, 0.6);
}

.refresh-fab:focus,
.refresh-fab:active {
  outline: none;
}

.refresh-fab.loading {
  cursor: not-allowed;
  opacity: 0.8;
}

.refresh-fab .is-loading {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.category-item-name { display: flex; align-items: center; gap: 10px; font-weight: 500; color: #444; }
.folder-icon { color: #8e7dff; font-size: 18px; }
:deep(.id-column) { color: #c0c4cc; font-family: monospace; }

@media (max-width: 768px) {
  .add-btn span { display: none; }
  .add-btn { width: 40px; height: 40px; border-radius: 50%; padding: 0; }

  .refresh-fab {
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    font-size: 24px;
  }
}

.action-inline { display: flex; align-items: center; justify-content: flex-end; gap: 10px; }
.action-divider { display: inline-block; width: 1px; height: 16px; background: #e4e7ed; }
</style>