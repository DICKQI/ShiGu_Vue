<template>
  <div class="ip-management-container">
    <!-- 顶部操作区 -->
    <div class="header-section">
      <div class="title-wrapper">
        <h2 class="page-title">IP作品管理</h2>
        <span class="sub-title">管理您的谷子所属作品分类</span>
      </div>
      <el-button class="add-btn" type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        <span>新增作品</span>
      </el-button>
    </div>

    <!-- 搜索与筛选卡片 -->
    <el-card class="search-card" shadow="never">
      <div class="search-flex">
        <el-input
          v-model="searchText"
          placeholder="搜索作品名称或关键词..."
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
          class="custom-search"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button class="search-btn" type="primary" @click="handleSearch">搜索</el-button>
      </div>
    </el-card>

    <!-- 内容展示区 -->
    <div v-loading="loading" class="content-body">
      <!-- PC端：精致的表格 -->
      <div class="desktop-view">
        <el-table :data="ipList" border-radius="12" style="width: 100%">
          <el-table-column prop="name" label="作品名称" min-width="180">
            <template #default="{ row }">
              <span class="table-name">{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="检索关键词" min-width="250">
            <template #default="{ row }">
              <div class="tag-group">
                <el-tag
                  v-for="keyword in row.keywords || []"
                  :key="keyword.id"
                  effect="plain"
                  round
                  size="small"
                  class="custom-tag"
                >
                  {{ keyword.value }}
                </el-tag>
              </div>
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

      <!-- 移动端：现代化瀑布流卡片 -->
      <div class="mobile-view">
        <div v-for="item in ipList" :key="item.id" class="ip-card-item">
          <div class="card-main" @click="handleEdit(item)">
            <div class="card-info">
              <div class="name-row">
                <h3 class="name-text">{{ item.name }}</h3>
              </div>
              <div class="keyword-row">
                <span v-for="keyword in item.keywords || []" :key="keyword.id" class="mini-tag">
                  {{ keyword.value }}
                </span>
                <span v-if="!item.keywords?.length" class="no-tag">暂无关键词</span>
              </div>
            </div>
            <div class="card-arrow">
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
          
          <div class="card-footer">
             <div class="footer-action" @click="handleEdit(item)">
                <el-icon><Edit /></el-icon>编辑
             </div>
             <div class="footer-action delete" @click.stop="handleDelete(item)">
                <el-icon><Delete /></el-icon>删除
             </div>
          </div>
        </div>
      </div>

      <el-empty v-if="!loading && ipList.length === 0" description="没有找到相关的作品" />
    </div>

    <!-- 弹窗部分保持逻辑不变，仅优化样式 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="90%"
      class="custom-dialog"
      align-center
    >
      <el-form :model="formData" :rules="formRules" ref="formRef" label-position="top">
        <el-form-item label="作品官方全称" prop="name">
          <el-input v-model="formData.name" placeholder="例如：崩坏：星穹铁道" />
        </el-form-item>
        <el-form-item label="关联关键词 (别名/缩写)">
          <div class="keyword-manager-box">
            <div class="input-inline">
              <el-input
                v-model="newKeyword"
                placeholder="输入别名后点添加"
                @keyup.enter="handleAddKeyword"
              >
                <template #append>
                  <el-button @click="handleAddKeyword">添加</el-button>
                </template>
              </el-input>
            </div>
            <div class="tags-wrapper">
              <el-tag
                v-for="(keyword, index) in formData.keywords"
                :key="index"
                closable
                round
                @close="handleRemoveKeyword(index)"
              >
                {{ keyword }}
              </el-tag>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" class="submit-btn" @click="handleSubmit" :loading="submitting">保存更改</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Edit, Delete, Search, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
// 假设 API 路径保持不变
import { getIPList, getIPDetail, createIP, updateIP, deleteIP } from '@/api/metadata'
import type { IP } from '@/api/types'

// 逻辑部分基本复用原代码，仅做细微优化
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
  name: [{ required: true, message: '请输入作品名称', trigger: 'blur' }],
}

const dialogTitle = computed(() => (isEdit.value ? '📝 编辑作品资料' : '✨ 新增IP作品'))

const fetchIPList = async () => {
  loading.value = true
  try {
    const data = await getIPList({ search: searchText.value.trim() || undefined })
    ipList.value = data
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => fetchIPList()

const handleAdd = () => {
  isEdit.value = false
  editingId.value = null
  formData.value = { name: '', keywords: [] }
  dialogVisible.value = true
}

const handleEdit = async (row: IP) => {
  isEdit.value = true
  editingId.value = row.id
  try {
    const detail = await getIPDetail(row.id)
    formData.value = {
      name: detail.name,
      keywords: detail.keywords?.map(k => k.value) || [],
    }
  } catch {
    formData.value = {
      name: row.name,
      keywords: row.keywords?.map(k => k.value) || [],
    }
  }
  dialogVisible.value = true
}

const handleAddKeyword = () => {
  const val = newKeyword.value.trim()
  if (!val) return
  if (formData.value.keywords.includes(val)) return ElMessage.warning('关键词已存在')
  formData.value.keywords.push(val)
  newKeyword.value = ''
}

const handleRemoveKeyword = (index: number) => {
  formData.value.keywords.splice(index, 1)
}

const handleDelete = async (row: IP) => {
  try {
    await ElMessageBox.confirm(`确定删除作品《${row.name}》吗？这将导致关联的角色数据丢失。`, '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '点错了',
      type: 'warning',
      buttonSize: 'default'
    })
    await deleteIP(row.id)
    ElMessage.success('已安全删除')
    fetchIPList()
  } catch {}
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const data = { name: formData.value.name, keywords: formData.value.keywords }
      if (isEdit.value && editingId.value) {
        await updateIP(editingId.value, data)
      } else {
        await createIP(data)
      }
      ElMessage.success('操作成功')
      dialogVisible.value = false
      fetchIPList()
    } catch (err: any) {
      ElMessage.error(err.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

onMounted(() => fetchIPList())
</script>

<style scoped>
/* 容器设计：采用柔和背景 */
.ip-management-container {
  padding: 16px;
  max-width: 1000px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: #f8f9fc;
}

/* 顶部标题区 */
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
}

/* 搜索框美化 */
.search-card {
  margin-bottom: 20px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}

.search-flex {
  display: flex;
  gap: 8px;
}

.custom-search :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #e4e7ed inset;
}

/* 品牌色按钮 */
.add-btn, .search-btn, .submit-btn {
  background: linear-gradient(135deg, #a396ff 0%, #8e7dff 100%);
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
}

/* PC端表格样式 */
.desktop-view {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
}

.table-name {
  font-weight: 600;
  color: #404144;
}

.custom-tag {
  border: 1px solid #d9d4ff;
  color: #5a4bff;
  background: linear-gradient(135deg, #f6f4ff 0%, #ebe7ff 100%);
  box-shadow: 0 6px 12px rgba(90, 75, 255, 0.08);
}

/* PC端关键词标签分隔 */
.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 10px;
  align-items: center;
}

/* 移动端现代化卡片设计 */
.mobile-view {
  display: none;
  flex-direction: column;
  gap: 14px;
}

.ip-card-item {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transition: transform 0.2s;
}

.ip-card-item:active {
  transform: scale(0.98);
}

.card-main {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.name-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
}

.name-text {
  margin: 0;
  font-size: 17px;
  color: #2c3e50;
  font-weight: 600;
}

.keyword-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mini-tag {
  font-size: 11px;
  background: linear-gradient(135deg, #f6f4ff 0%, #ebe7ff 100%);
  color: #5a4bff;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #d9d4ff;
}

.no-tag {
  font-size: 12px;
  color: #c0c4cc;
  font-style: italic;
}

.card-arrow {
  color: #c0c4cc;
}

/* 卡片操作底部 */
.card-footer {
  display: flex;
  border-top: 1px solid #f2f6fc;
  background: #fafbfc;
}

.footer-action {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-size: 13px;
  color: #606266;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.footer-action:not(:last-child) {
  border-right: 1px solid #f2f6fc;
}

.footer-action.delete {
  color: #f56c6c;
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

/* 响应式适配 */
@media (max-width: 768px) {
  .desktop-view {
    display: none;
  }
  .mobile-view {
    display: flex;
  }
  .header-section {
    flex-direction: row;
    align-items: center;
  }
  .page-title {
    font-size: 18px;
  }
  .add-btn span {
    display: none; /* 移动端隐藏文字只留图标，更简洁 */
  }
  .add-btn {
    padding: 10px;
    border-radius: 50%;
    width: 40px;
    height: 40px;
  }
}

/* 弹窗与关键词管理 */
.keyword-manager-box {
  background: #f8f9fc;
  padding: 12px;
  border-radius: 8px;
  border: 1px dashed #dcdfe6;
}

.tags-wrapper {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.custom-dialog :deep(.el-dialog__header) {
  margin-right: 0;
  padding-bottom: 20px;
  border-bottom: 1px solid #f2f6fc;
}

.custom-dialog :deep(.el-dialog__body) {
  padding-top: 20px;
}
</style>