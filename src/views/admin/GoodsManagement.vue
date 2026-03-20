<template>
  <div class="goods-management-container">
    <div class="header-section">
      <div class="title-wrapper">
        <h2 class="page-title">谷子管理</h2>
        <span class="sub-title">管理全站谷子数据，可按用户筛选</span>
      </div>
      <div class="header-actions">
        <el-button type="primary" class="add-btn" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          <span>新增谷子</span>
        </el-button>
      </div>
    </div>

    <el-card class="search-card" shadow="never">
      <div class="search-flex">
        <el-input
          v-model="searchText"
          placeholder="搜索谷子名称..."
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
          class="custom-search"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select
          v-model="selectedUserId"
          placeholder="筛选用户"
          clearable
          filterable
          class="user-filter"
          @change="handleSearch"
        >
          <el-option
            v-for="user in userOptions"
            :key="user.id"
            :label="user.username"
            :value="user.id"
          />
        </el-select>
        <el-select
          v-model="selectedStatus"
          placeholder="筛选状态"
          clearable
          class="status-filter"
          @change="handleSearch"
        >
          <el-option label="在馆" value="in_cabinet" />
          <el-option label="出街中" value="outdoor" />
          <el-option label="已售出" value="sold" />
        </el-select>
        <el-button class="search-btn" type="primary" @click="handleSearch">搜索</el-button>
      </div>
    </el-card>

    <div v-loading="loading" class="content-body">
      <div class="table-wrapper">
        <el-table :data="goodsList" style="width: 100%" class="goods-table">
          <el-table-column label="主图" width="80" align="center">
            <template #default="{ row }">
              <el-image
                v-if="row.main_photo"
                :src="row.main_photo"
                fit="cover"
                class="goods-image"
              >
                <template #error>
                  <div class="image-placeholder">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div v-else class="image-placeholder">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="谷子名称" min-width="200">
            <template #default="{ row }">
              <div class="goods-name">{{ row.name }}</div>
              <div class="goods-meta">
                <el-tag size="small" type="info">{{ row.ip?.name || '未关联' }}</el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="category" label="品类" width="120">
            <template #default="{ row }">
              {{ row.category?.name || '—' }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag
                :type="getStatusType(row.status)"
                effect="plain"
                size="small"
              >
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="80" align="center">
            <template #default="{ row }">
              {{ row.quantity }}
            </template>
          </el-table-column>
          <el-table-column prop="user_id" label="归属用户" width="120">
            <template #default="{ row }">
              <span class="user-badge">{{ row.user_id || '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="right" fixed="right">
            <template #default="{ row }">
              <div class="action-inline">
                <el-button link type="primary" @click="handleEdit(row)" title="编辑">
                  <el-icon :size="16"><Edit /></el-icon>
                </el-button>
                <el-button link type="danger" @click="handleDelete(row)" title="删除">
                  <el-icon :size="16"><Delete /></el-icon>
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>

      <el-empty v-if="!loading && goodsList.length === 0" description="暂无谷子数据" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search, Picture, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getGoodsList, deleteGoods } from '@/api/goods'
import { getAdminUsers } from '@/api/admin'
import type { GoodsListItem } from '@/api/types'
import type { AdminUser } from '@/api/admin'

const router = useRouter()

const loading = ref(false)
const goodsList = ref<GoodsListItem[]>([])
const userOptions = ref<AdminUser[]>([])
const searchText = ref('')
const selectedUserId = ref<number | null>(null)
const selectedStatus = ref<string | null>(null)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const getStatusType = (status: string) => {
  const map: Record<string, any> = {
    in_cabinet: 'success',
    outdoor: 'warning',
    sold: 'info'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    in_cabinet: '在馆',
    outdoor: '出街中',
    sold: '已售出'
  }
  return map[status] || status
}

const fetchGoods = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: currentPage.value,
      page_size: pageSize.value
    }
    if (searchText.value) {
      params.search = searchText.value
    }
    if (selectedUserId.value) {
      params.user = selectedUserId.value
    }
    if (selectedStatus.value) {
      params.status = selectedStatus.value
    }
    const response = await getGoodsList(params)
    goodsList.value = response.results
    total.value = response.count
  } catch (err: any) {
    ElMessage.error(err.message || '获取谷子列表失败')
  } finally {
    loading.value = false
  }
}

const fetchUsers = async () => {
  try {
    const response = await getAdminUsers({ page_size: 100 })
    userOptions.value = response.results
  } catch (err: any) {
    console.error('获取用户列表失败', err)
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchGoods()
}

const handleSizeChange = () => {
  currentPage.value = 1
  fetchGoods()
}

const handlePageChange = () => {
  fetchGoods()
}

const handleAdd = () => {
  router.push('/goods/new')
}

const handleEdit = (row: GoodsListItem) => {
  router.push(`/goods/${row.id}/edit`)
}

const handleDelete = async (row: GoodsListItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除谷子「${row.name}」吗？此操作不可恢复。`,
      '警告',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    await deleteGoods(row.id)
    ElMessage.success('谷子已删除')
    fetchGoods()
  } catch {}
}

onMounted(() => {
  fetchUsers()
  fetchGoods()
})
</script>

<style scoped>
.goods-management-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
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
}

.add-btn {
  background: linear-gradient(135deg, #a396ff 0%, #8e7dff 100%);
  border: none;
  border-radius: 8px;
}

.search-card {
  border-radius: 12px;
  border: none;
  margin-bottom: 20px;
}

.search-flex {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.custom-search {
  flex: 1;
  min-width: 200px;
}

.user-filter {
  width: 150px;
}

.status-filter {
  width: 120px;
}

.search-btn {
  background: linear-gradient(135deg, #a396ff 0%, #8e7dff 100%);
  border: none;
  border-radius: 8px;
}

.table-wrapper {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.goods-image {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  object-fit: cover;
}

.image-placeholder {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
}

.goods-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.goods-meta {
  display: flex;
  gap: 4px;
}

.user-badge {
  font-size: 12px;
  color: #606266;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
}

.action-inline {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px;
  background: #fff;
  border-radius: 0 0 12px 12px;
}

@media (max-width: 768px) {
  .goods-management-container {
    padding: 16px;
  }

  .header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .add-btn {
    width: 100%;
  }

  .search-flex {
    flex-direction: column;
  }

  .custom-search,
  .user-filter,
  .status-filter {
    width: 100%;
  }

  .pagination-wrapper {
    overflow-x: auto;
  }
}
</style>
