<template>
  <div class="ip-character-management-container">
    <!-- 顶部操作区 -->
    <div class="header-section">
      <div class="title-wrapper">
        <h2 class="page-title">IP作品与角色管理</h2>
        <span class="sub-title">管理您的作品分类及其角色</span>
      </div>
      <div class="header-actions">
        <el-button class="add-btn" type="info" @click="handleOpenBGMImport">
          <el-icon><Search /></el-icon>
          <span>从BGM导入</span>
        </el-button>
        <el-button class="add-btn" type="primary" @click="handleAddIP">
          <el-icon><Plus /></el-icon>
          <span>新增作品</span>
        </el-button>
        <el-button class="add-btn" type="success" @click="handleAddCharacter">
          <el-icon><Plus /></el-icon>
          <span>新增角色</span>
        </el-button>
      </div>
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
        <el-table
          :data="ipList"
          border-radius="12"
          style="width: 100%"
          @expand-change="handleTableExpandChange"
        >
          <el-table-column type="expand" width="50">
            <template #default="{ row }">
              <div class="character-expand-section">
                <div class="expand-header">
                  <span class="expand-title">角色列表</span>
                  <el-button
                    size="small"
                    type="primary"
                    text
                    @click="handleAddCharacterForIP(row)"
                  >
                    <el-icon><Plus /></el-icon>
                    为该IP添加角色
                  </el-button>
                </div>
                <div v-loading="characterLoadingMap[row.id]" class="character-content">
                  <template v-if="characterMap[row.id]?.length">
                    <div
                      v-for="char in characterMap[row.id]"
                      :key="char.id"
                      class="character-row"
                    >
                      <div class="char-info-row">
                        <el-avatar :size="40" :src="char.avatar || undefined" shape="square" class="char-avatar table-avatar">
                          <el-icon><UserFilled /></el-icon>
                        </el-avatar>
                        <div class="char-details">
                          <span class="char-name">{{ char.name }}</span>
                          <span :class="['gender-badge', char.gender]">
                            {{ getGenderLabel(char.gender) }}
                          </span>
                        </div>
                      </div>
                      <div class="char-actions">
                        <el-button link type="primary" @click="handleEditCharacter(char)">编辑</el-button>
                        <span class="action-divider" />
                        <el-button link type="danger" @click="handleDeleteCharacter(char)">删除</el-button>
                      </div>
                    </div>
                  </template>
                  <el-empty
                    v-else-if="!characterLoadingMap[row.id]"
                    description="该作品下暂无角色"
                    :image-size="80"
                  />
                </div>
              </div>
            </template>
          </el-table-column>
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
          <el-table-column label="角色数量" width="100" align="center">
            <template #default="{ row }">
              <span class="character-count">{{ row.character_count ?? (characterMap[row.id]?.length || 0) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" align="right" fixed="right">
            <template #default="{ row }">
              <div class="action-inline">
                <el-button link type="primary" @click="handleEditIP(row)">编辑</el-button>
                <span class="action-divider" />
                <el-button link type="danger" @click="handleDeleteIP(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 移动端：现代化卡片 -->
      <div class="mobile-view">
        <div v-for="item in ipList" :key="item.id" class="ip-card-item">
          <div class="card-main" @click="toggleExpand(item.id)">
            <div class="card-info">
              <div class="name-row">
                <h3 class="name-text">{{ item.name }}</h3>
                <span class="character-count-badge">{{ item.character_count ?? (characterMap[item.id]?.length || 0) }}</span>
              </div>
              <div class="keyword-row">
                <span v-for="keyword in item.keywords || []" :key="keyword.id" class="mini-tag">
                  {{ keyword.value }}
                </span>
                <span v-if="!item.keywords?.length" class="no-tag">暂无关键词</span>
              </div>
            </div>
            <div class="card-arrow">
              <el-icon :class="{ rotated: expandedIPs.includes(item.id) }">
                <ArrowRight />
              </el-icon>
            </div>
          </div>

          <!-- 展开的角色列表 -->
          <div
            v-if="expandedIPs.includes(item.id)"
            v-loading="characterLoadingMap[item.id]"
            class="character-list"
          >
            <div class="character-list-header">
              <span>角色列表</span>
              <el-button
                size="small"
                type="primary"
                text
                @click.stop="handleAddCharacterForIP(item)"
              >
                <el-icon><Plus /></el-icon>
                添加角色
              </el-button>
            </div>
            <template v-if="characterMap[item.id]?.length">
              <div
                v-for="char in characterMap[item.id]"
                :key="char.id"
                class="character-card"
              >
                <el-avatar :size="50" :src="char.avatar || undefined" shape="square" class="char-avatar">
                  <el-icon><UserFilled /></el-icon>
                </el-avatar>
                <div class="char-info">
                  <div class="name-line">
                    <span class="name">{{ char.name }}</span>
                    <span :class="['gender-badge', char.gender]">
                      {{ getGenderLabel(char.gender) }}
                    </span>
                  </div>
                </div>
                <div class="char-actions-mobile">
                  <el-button
                    size="small"
                    text
                    type="primary"
                    @click.stop="handleEditCharacter(char)"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button
                    size="small"
                    text
                    type="danger"
                    @click.stop="handleDeleteCharacter(char)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </template>
            <el-empty v-else description="暂无角色" :image-size="60" />
          </div>

          <div class="card-footer">
            <div class="footer-action" @click.stop="handleEditIP(item)">
              <el-icon><Edit /></el-icon>编辑作品
            </div>
            <div class="footer-action delete" @click.stop="handleDeleteIP(item)">
              <el-icon><Delete /></el-icon>删除作品
            </div>
          </div>
        </div>
      </div>

      <el-empty v-if="!loading && ipList.length === 0" description="没有找到相关的作品" />
    </div>

    <!-- IP编辑弹窗 -->
    <el-dialog
      v-model="ipDialogVisible"
      :title="ipDialogTitle"
      :width="dialogWidth"
      class="custom-dialog"
      align-center
    >
      <el-form :model="ipFormData" :rules="ipFormRules" ref="ipFormRef" label-position="top">
        <el-form-item label="作品官方全称" prop="name">
          <el-input v-model="ipFormData.name" placeholder="例如：崩坏：星穹铁道" />
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
                v-for="(keyword, index) in ipFormData.keywords"
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
          <el-button @click="ipDialogVisible = false">取消</el-button>
          <el-button type="primary" class="submit-btn" @click="handleSubmitIP" :loading="submitting">
            保存更改
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- BGM导入弹窗 -->
    <el-dialog
      v-model="bgmDialogVisible"
      title="从Bangumi导入角色"
      :width="bgmDialogWidth"
      class="custom-dialog bgm-dialog"
      align-center
      :close-on-click-modal="false"
    >
      <div class="bgm-import-container">
        <!-- 搜索阶段 -->
        <div v-if="bgmStep === 'search'" class="bgm-step-search">
          <el-form @submit.prevent="handleBGMSearch">
            <el-form-item label="IP作品名称">
              <el-input
                v-model="bgmSearchInput"
                placeholder="例如：崩坏：星穹铁道"
                clearable
                @keyup.enter="handleBGMSearch"
                :disabled="bgmSearching"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <div class="bgm-search-actions">
              <el-button type="primary" @click="handleBGMSearch" :loading="bgmSearching" :disabled="!bgmSearchInput.trim()">
                搜索BGM
              </el-button>
            </div>
          </el-form>
        </div>

        <!-- 搜索中等待页面 -->
        <div v-if="bgmStep === 'searching'" class="bgm-step-searching">
          <div class="searching-content">
            <el-icon class="searching-icon"><Loading /></el-icon>
            <h3>正在搜索Bangumi...</h3>
            <p>请耐心等待，正在从Bangumi API获取角色信息</p>
            <div class="searching-progress">
              <el-progress :percentage="50" :indeterminate="true" />
            </div>
          </div>
        </div>

        <!-- 搜索结果展示 -->
        <div v-if="bgmStep === 'results'" class="bgm-step-results">
          <div class="results-header">
            <h3>搜索结果：{{ bgmSearchResult?.ip_name }}</h3>
            <p class="results-subtitle">找到 {{ bgmSearchResult?.characters.length || 0 }} 个角色，请勾选需要导入的角色</p>
          </div>
          <div class="results-actions-top">
            <el-button size="small" @click="handleBGMSelectAll">全选</el-button>
            <el-button size="small" @click="handleBGMSelectNone">取消全选</el-button>
            <span class="selected-count">已选择 {{ bgmSelectedCharacters.length }} 个角色</span>
          </div>
          <div class="results-filter">
            <el-input
              v-model="bgmCharacterKeyword"
              size="small"
              placeholder="按角色名搜索"
              clearable
              class="results-filter-input"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
          <div class="character-list-container">
            <div
              v-for="(char, index) in bgmSearchResult?.characters || []"
              :key="index"
              class="bgm-character-item"
              :class="{ selected: bgmSelectedCharacters.includes(index) }"
              v-show="
                !bgmCharacterKeyword.trim() ||
                char.name.toLowerCase().includes(bgmCharacterKeyword.trim().toLowerCase())
              "
              @click="handleBGMToggleCharacter(index)"
            >
              <el-checkbox
                :model-value="bgmSelectedCharacters.includes(index)"
                @change="handleBGMToggleCharacter(index)"
                @click.stop
              />
              <el-avatar :size="50" :src="char.avatar || undefined" shape="square" class="char-avatar">
                <el-icon><UserFilled /></el-icon>
              </el-avatar>
              <div class="char-info">
                <div class="char-name">{{ char.name }}</div>
                <div class="char-relation">{{ char.relation }}</div>
              </div>
            </div>
          </div>
          <div v-if="!bgmSearchResult?.characters.length" class="empty-results">
            <el-empty description="未找到角色信息" />
          </div>
        </div>

        <!-- 导入中 -->
        <div v-if="bgmStep === 'importing'" class="bgm-step-importing">
          <div class="importing-content">
            <el-icon class="importing-icon"><Loading /></el-icon>
            <h3>正在导入角色...</h3>
            <p>请稍候，正在将选中的角色添加到数据库</p>
            <div class="importing-progress">
              <el-progress :percentage="50" :indeterminate="true" />
            </div>
          </div>
        </div>

        <!-- 导入结果 -->
        <div v-if="bgmStep === 'imported'" class="bgm-step-imported">
          <div class="imported-content">
            <el-icon class="success-icon"><CircleCheck /></el-icon>
            <h3>导入完成！</h3>
            <div class="import-summary">
              <p>成功创建：<strong>{{ bgmImportResult?.created || 0 }}</strong> 个角色</p>
              <p>已存在跳过：<strong>{{ bgmImportResult?.skipped || 0 }}</strong> 个角色</p>
            </div>
            <div class="import-details" v-if="bgmImportResult?.details.length">
              <el-collapse>
                <el-collapse-item title="查看详情" name="details">
                  <div
                    v-for="(detail, idx) in bgmImportResult.details"
                    :key="idx"
                    class="detail-item"
                    :class="detail.status"
                  >
                    <el-icon>
                      <CircleCheck v-if="detail.status === 'created'" />
                      <Warning v-else-if="detail.status === 'already_exists'" />
                      <CircleClose v-else />
                    </el-icon>
                    <span class="detail-text">
                      {{ detail.ip_name }} - {{ detail.character_name }}
                      <span class="detail-status">
                        ({{ detail.status === 'created' ? '已创建' : detail.status === 'already_exists' ? '已存在' : '错误' }})
                      </span>
                    </span>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button v-if="bgmStep === 'search'" @click="bgmDialogVisible = false">取消</el-button>
          <el-button
            v-if="bgmStep === 'results'"
            @click="handleBGMReset"
          >
            重新搜索
          </el-button>
          <el-button
            v-if="bgmStep === 'results'"
            type="primary"
            @click="handleBGMConfirmImport"
            :disabled="bgmSelectedCharacters.length === 0"
            :loading="bgmImporting"
          >
            确认导入 ({{ bgmSelectedCharacters.length }})
          </el-button>
          <el-button
            v-if="bgmStep === 'imported'"
            type="primary"
            @click="handleBGMClose"
          >
            完成
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 角色编辑弹窗 -->
    <el-dialog
      v-model="characterDialogVisible"
      :title="characterDialogTitle"
      :width="dialogWidth"
      class="custom-dialog"
      align-center
    >
      <el-form
        :model="characterFormData"
        :rules="characterFormRules"
        ref="characterFormRef"
        label-position="top"
      >
        <div class="form-layout">
          <div class="avatar-col">
            <el-upload
              class="avatar-uploader"
              :auto-upload="false"
              :show-file-list="false"
              @change="handleAvatarFileChange"
            >
              <img v-if="avatarPreview" :src="avatarPreview" class="preview-img" />
              <el-icon v-else class="uploader-icon"><Plus /></el-icon>
              <div class="upload-label">修改头像</div>
            </el-upload>
          </div>
          <div class="info-col">
            <el-form-item label="角色名称" prop="name">
              <el-input v-model="characterFormData.name" placeholder="输入角色名" />
            </el-form-item>
            <el-form-item label="所属作品" prop="ip_id">
              <el-select
                v-model="characterFormData.ip_id"
                placeholder="选择所属IP"
                filterable
                style="width: 100%"
              >
                <el-option v-for="ip in ipList" :key="ip.id" :label="ip.name" :value="ip.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="characterFormData.gender" class="custom-radio">
                <el-radio-button value="female">女</el-radio-button>
                <el-radio-button value="male">男</el-radio-button>
                <el-radio-button value="other">其他</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="characterDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          class="submit-btn"
          @click="handleSubmitCharacter"
          :loading="submitting"
        >
          保存信息
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Plus,
  Edit,
  Delete,
  Search,
  ArrowRight,
  UserFilled,
  Loading,
  CircleCheck,
  Warning,
  CircleClose,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules, UploadFile } from 'element-plus'
import {
  getIPList,
  getIPDetail,
  createIP,
  updateIP,
  deleteIP,
  getIPCharacters,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  searchBGMCharacters,
  createBGMCharacters,
} from '@/api/metadata'
import type {
  IP,
  Character,
  CharacterGender,
  BGMSearchResponse,
  BGMCreateCharactersResponse,
} from '@/api/types'

// 窗口宽度响应式
const windowWidth = ref(window.innerWidth)

const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', updateWindowWidth)
  fetchIPList()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth)
})

// 弹窗宽度计算
const dialogWidth = computed(() => {
  if (windowWidth.value <= 768) {
    return '90%'
  }
  return '600px'
})

// BGM导入弹窗需要更宽
const bgmDialogWidth = computed(() => {
  if (windowWidth.value <= 768) {
    return '90%'
  }
  return '800px'
})

// 状态管理
const loading = ref(false)
const submitting = ref(false)
const searchText = ref('')
const ipList = ref<IP[]>([])
const characterMap = ref<Record<number, Character[]>>({})
const characterLoadingMap = ref<Record<number, boolean>>({})
const expandedIPs = ref<number[]>([])

// IP相关
const ipDialogVisible = ref(false)
const ipDialogTitle = computed(() => (isEditIP.value ? '📝 编辑作品资料' : '✨ 新增IP作品'))
const isEditIP = ref(false)
const editingIPId = ref<number | null>(null)
const ipFormRef = ref<FormInstance>()
const newKeyword = ref('')
const ipFormData = ref({
  name: '',
  keywords: [] as string[],
})
const ipFormRules: FormRules = {
  name: [{ required: true, message: '请输入作品名称', trigger: 'blur' }],
}

// 角色相关
const characterDialogVisible = ref(false)
const characterDialogTitle = computed(() =>
  isEditCharacter.value ? '🎭 编辑角色资料' : '✨ 迎接新角色'
)
const isEditCharacter = ref(false)
const editingCharacterId = ref<number | null>(null)
const editingCharacterOriginalIpId = ref<number | null>(null)
const characterFormRef = ref<FormInstance>()
const avatarPreview = ref('')
const avatarFile = ref<File | null>(null)
const characterFormData = ref({
  name: '',
  ip_id: null as number | null,
  gender: 'other' as CharacterGender,
})
const characterFormRules: FormRules = {
  name: [{ required: true, message: '请输入角色名', trigger: 'blur' }],
  ip_id: [{ required: true, message: '请选择所属IP', trigger: 'change' }],
}

// BGM导入相关
const bgmDialogVisible = ref(false)
type BGMStep = 'search' | 'searching' | 'results' | 'importing' | 'imported'
const bgmStep = ref<BGMStep>('search')
const bgmSearchInput = ref('')
const bgmSearching = ref(false)
const bgmCharacterKeyword = ref('')
const bgmSearchResult = ref<BGMSearchResponse | null>(null)
const bgmSelectedCharacters = ref<number[]>([])
const bgmImporting = ref(false)
const bgmImportResult = ref<BGMCreateCharactersResponse | null>(null)

const getGenderLabel = (g: CharacterGender) =>
  ({ male: '男', female: '女', other: '其他' }[g] || '未知')

const setIPCharacterCount = (ipId: number, count: number) => {
  const ip = ipList.value.find((x) => x.id === ipId)
  if (!ip) return
  ip.character_count = count
}

const syncIPCharacterCountFromMap = (ipId: number) => {
  const list = characterMap.value[ipId]
  if (!list) return
  setIPCharacterCount(ipId, list.length)
}

// 获取IP列表
const fetchIPList = async () => {
  loading.value = true
  try {
    const data = await getIPList({ search: searchText.value.trim() || undefined })
    ipList.value = data
    // 清空角色映射和展开状态
    characterMap.value = {}
    expandedIPs.value = []
  } catch (err: any) {
    ElMessage.error(err.message || '加载失败')
  } finally {
    loading.value = false
  }
}

// 获取IP下的角色列表
const fetchIPCharacters = async (ipId: number) => {
  if (characterLoadingMap.value[ipId]) return
  if (characterMap.value[ipId]) return // 已加载过，不再重复加载

  characterLoadingMap.value[ipId] = true
  try {
    const data = await getIPCharacters(ipId)
    characterMap.value[ipId] = data
    // 已经加载到真实角色列表时，用列表长度同步一次计数（无需点开也能看到）
    syncIPCharacterCountFromMap(ipId)
  } catch (err: any) {
    ElMessage.error(err.message || '加载角色失败')
    characterMap.value[ipId] = []
    syncIPCharacterCountFromMap(ipId)
  } finally {
    characterLoadingMap.value[ipId] = false
  }
}

// 切换展开状态
const toggleExpand = async (ipId: number) => {
  const index = expandedIPs.value.indexOf(ipId)
  if (index > -1) {
    expandedIPs.value.splice(index, 1)
  } else {
    expandedIPs.value.push(ipId)
    await fetchIPCharacters(ipId)
  }
}

// 表格展开时加载角色
const handleTableExpandChange = async (row: IP, expandedRows: IP[]) => {
  // 检查该行是否在展开列表中
  const isExpanded = expandedRows.some((r) => r.id === row.id)
  if (isExpanded) {
    await fetchIPCharacters(row.id)
  }
}

const handleSearch = () => fetchIPList()

// IP相关操作
const handleAddIP = () => {
  isEditIP.value = false
  editingIPId.value = null
  ipFormData.value = { name: '', keywords: [] }
  newKeyword.value = ''
  ipDialogVisible.value = true
}

const handleEditIP = async (row: IP) => {
  isEditIP.value = true
  editingIPId.value = row.id
  try {
    const detail = await getIPDetail(row.id)
    ipFormData.value = {
      name: detail.name,
      keywords: detail.keywords?.map((k) => k.value) || [],
    }
  } catch {
    ipFormData.value = {
      name: row.name,
      keywords: row.keywords?.map((k) => k.value) || [],
    }
  }
  newKeyword.value = ''
  ipDialogVisible.value = true
}

const handleDeleteIP = async (row: IP) => {
  try {
    await ElMessageBox.confirm(
      `确定删除作品《${row.name}》吗？这将导致关联的角色数据丢失。`,
      '警告',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '点错了',
        type: 'warning',
        buttonSize: 'default',
      }
    )
    await deleteIP(row.id)
    ElMessage.success('已安全删除')
    // 清除该IP的角色映射
    delete characterMap.value[row.id]
    fetchIPList()
  } catch {}
}

const handleAddKeyword = () => {
  const val = newKeyword.value.trim()
  if (!val) return
  if (ipFormData.value.keywords.includes(val)) return ElMessage.warning('关键词已存在')
  ipFormData.value.keywords.push(val)
  newKeyword.value = ''
}

const handleRemoveKeyword = (index: number) => {
  ipFormData.value.keywords.splice(index, 1)
}

const handleSubmitIP = async () => {
  if (!ipFormRef.value) return
  await ipFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const data = { name: ipFormData.value.name, keywords: ipFormData.value.keywords }
      if (isEditIP.value && editingIPId.value) {
        await updateIP(editingIPId.value, data)
        // 如果编辑的是已展开的IP，刷新角色列表
        if (expandedIPs.value.includes(editingIPId.value)) {
          delete characterMap.value[editingIPId.value]
          await fetchIPCharacters(editingIPId.value)
        }
      } else {
        await createIP(data)
      }
      ElMessage.success('操作成功')
      ipDialogVisible.value = false
      fetchIPList()
    } catch (err: any) {
      ElMessage.error(err.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

// 角色相关操作
const handleAddCharacter = () => {
  isEditCharacter.value = false
  editingCharacterId.value = null
  editingCharacterOriginalIpId.value = null
  characterFormData.value = { name: '', ip_id: null, gender: 'other' }
  avatarPreview.value = ''
  avatarFile.value = null
  characterDialogVisible.value = true
}

const handleAddCharacterForIP = (ip: IP) => {
  isEditCharacter.value = false
  editingCharacterId.value = null
  editingCharacterOriginalIpId.value = null
  characterFormData.value = { name: '', ip_id: ip.id, gender: 'other' }
  avatarPreview.value = ''
  avatarFile.value = null
  characterDialogVisible.value = true
}

const handleEditCharacter = (row: Character) => {
  isEditCharacter.value = true
  editingCharacterId.value = row.id
  editingCharacterOriginalIpId.value = row.ip.id
  characterFormData.value = {
    name: row.name,
    ip_id: row.ip.id,
    gender: row.gender,
  }
  avatarPreview.value = row.avatar || ''
  avatarFile.value = null
  characterDialogVisible.value = true
}

const handleDeleteCharacter = async (row: Character) => {
  try {
    await ElMessageBox.confirm(
      `确定删除角色《${row.name}》吗？关联的谷子数据也会受到影响。`,
      '警告',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
      }
    )
    await deleteCharacter(row.id)
    ElMessage.success('已删除')
    // 未展开情况下也能即时看到数量变化（最终会被 fetchIPCharacters 的 sync 覆盖为最准）
    if (ipList.value.find((x) => x.id === row.ip.id)?.character_count != null) {
      setIPCharacterCount(row.ip.id, Math.max(0, (ipList.value.find((x) => x.id === row.ip.id)?.character_count || 0) - 1))
    }
    // 刷新该IP的角色列表
    if (characterMap.value[row.ip.id]) {
      delete characterMap.value[row.ip.id]
      await fetchIPCharacters(row.ip.id)
    }
  } catch {}
}

const handleAvatarFileChange = (file: UploadFile) => {
  if (file.raw) {
    avatarFile.value = file.raw
    const reader = new FileReader()
    reader.onload = (e) => (avatarPreview.value = e.target?.result as string)
    reader.readAsDataURL(file.raw)
  }
}

const handleSubmitCharacter = async () => {
  if (!characterFormRef.value) return
  await characterFormRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const data = new FormData()
      data.append('name', characterFormData.value.name)
      data.append('ip_id', String(characterFormData.value.ip_id))
      data.append('gender', characterFormData.value.gender)
      if (avatarFile.value) data.append('avatar', avatarFile.value)

      const newIpId = characterFormData.value.ip_id!
      const oldIpId = editingCharacterOriginalIpId.value
      if (isEditCharacter.value && editingCharacterId.value) {
        await updateCharacter(editingCharacterId.value, data)
        // 如果编辑时变更了所属IP，需要同步旧IP与新IP的角色列表/数量
        if (oldIpId && oldIpId !== newIpId) {
          // 旧IP：若已加载过角色列表就重新拉取；否则至少先把计数 -1（避免一直显示旧值）
          if (characterMap.value[oldIpId]) {
            delete characterMap.value[oldIpId]
            await fetchIPCharacters(oldIpId)
          } else if (ipList.value.find((x) => x.id === oldIpId)?.character_count != null) {
            setIPCharacterCount(
              oldIpId,
              Math.max(0, (ipList.value.find((x) => x.id === oldIpId)?.character_count || 0) - 1)
            )
          }

          // 新IP：若已加载过角色列表就重新拉取；否则先把计数 +1
          if (characterMap.value[newIpId]) {
            delete characterMap.value[newIpId]
            await fetchIPCharacters(newIpId)
          } else if (ipList.value.find((x) => x.id === newIpId)?.character_count != null) {
            setIPCharacterCount(newIpId, (ipList.value.find((x) => x.id === newIpId)?.character_count || 0) + 1)
          }
        } else {
          // 刷新该IP的角色列表（如果已展开/加载过）
          if (characterMap.value[newIpId]) {
            delete characterMap.value[newIpId]
            await fetchIPCharacters(newIpId)
          }
        }
      } else {
        await createCharacter(data)
        // 如果是新增角色，刷新对应IP的角色列表
        delete characterMap.value[newIpId]
        // 未展开情况下也能即时看到数量变化（最终会被 fetchIPCharacters 的 sync 覆盖为最准）
        if (ipList.value.find((x) => x.id === newIpId)?.character_count != null) {
          setIPCharacterCount(newIpId, (ipList.value.find((x) => x.id === newIpId)?.character_count || 0) + 1)
        }
        await fetchIPCharacters(newIpId)
        // 如果是移动端，确保IP是展开状态
        if (!expandedIPs.value.includes(newIpId)) {
          expandedIPs.value.push(newIpId)
        }
      }
      ElMessage.success('保存成功')
      characterDialogVisible.value = false
      editingCharacterOriginalIpId.value = null
    } catch (err: any) {
      ElMessage.error(err.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

// BGM导入相关操作
const handleOpenBGMImport = () => {
  bgmDialogVisible.value = true
  handleBGMReset()
}

const handleBGMReset = () => {
  bgmStep.value = 'search'
  bgmSearchInput.value = ''
   bgmCharacterKeyword.value = ''
  bgmSearchResult.value = null
  bgmSelectedCharacters.value = []
  bgmImportResult.value = null
}

const handleBGMSearch = async () => {
  const ipName = bgmSearchInput.value.trim()
  if (!ipName) {
    ElMessage.warning('请输入IP作品名称')
    return
  }

  bgmSearching.value = true
  bgmStep.value = 'searching'

  try {
    const result = await searchBGMCharacters(ipName)
    bgmSearchResult.value = result
    bgmCharacterKeyword.value = ''
    bgmSelectedCharacters.value = [] // 重置选择
    bgmStep.value = 'results'
  } catch (err: any) {
    // 404错误特殊处理
    if (err.response?.status === 404) {
      ElMessage.error(err.response?.data?.detail || '未找到相关作品')
    } else {
      ElMessage.error(err.message || '搜索失败')
    }
    bgmStep.value = 'search'
  } finally {
    bgmSearching.value = false
  }
}

const handleBGMSelectAll = () => {
  if (!bgmSearchResult.value) return
  bgmSelectedCharacters.value = bgmSearchResult.value.characters.map((_, index) => index)
}

const handleBGMSelectNone = () => {
  bgmSelectedCharacters.value = []
}

const handleBGMToggleCharacter = (index: number) => {
  const idx = bgmSelectedCharacters.value.indexOf(index)
  if (idx > -1) {
    bgmSelectedCharacters.value.splice(idx, 1)
  } else {
    bgmSelectedCharacters.value.push(index)
  }
}

const handleBGMConfirmImport = async () => {
  const result = bgmSearchResult.value
  if (!result || bgmSelectedCharacters.value.length === 0) {
    ElMessage.warning('请至少选择一个角色')
    return
  }

  bgmImporting.value = true
  bgmStep.value = 'importing'

  try {
    const charactersToImport = bgmSelectedCharacters.value
      .map((index) => result.characters[index])
      .filter((char): char is (typeof result.characters)[number] => !!char)
      .map((char) => ({
        ip_name: result.ip_name,
        character_name: char.name,
      }))

    const createResult = await createBGMCharacters(charactersToImport)
    bgmImportResult.value = createResult
    bgmStep.value = 'imported'

    // 刷新IP列表
    await fetchIPList()

    ElMessage.success(`成功导入 ${createResult.created} 个角色`)
  } catch (err: any) {
    ElMessage.error(err.message || '导入失败')
    bgmStep.value = 'results'
  } finally {
    bgmImporting.value = false
  }
}

const handleBGMClose = () => {
  bgmDialogVisible.value = false
  handleBGMReset()
  // 刷新IP列表以显示新导入的数据
  fetchIPList()
}
</script>

<style scoped>
/* 容器设计：参考云展柜布局 */
.ip-character-management-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: calc(100vh - 64px);
}

/* 顶部标题区 */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-actions {
  display: flex;
  gap: 8px;
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
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
.add-btn,
.search-btn,
.submit-btn {
  background: linear-gradient(135deg, #a396ff 0%, #8e7dff 100%);
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
}

.add-btn[type='success'] {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.add-btn[type='info'] {
  background: linear-gradient(135deg, #909399 0%, #a6a9ad 100%);
}

/* PC端表格样式 */
.desktop-view {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
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

.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 10px;
  align-items: center;
}

.character-count {
  font-weight: 600;
  color: #606266;
}

/* 展开区域样式 */
.character-expand-section {
  padding: 16px;
  background: #fafbfc;
}

.expand-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.expand-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.character-content {
  min-height: 50px;
}

.character-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid #f2f6fc;
}

.char-info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.char-avatar {
  border: 1px solid #e4e7ed;
}

.table-avatar {
  flex-shrink: 0;
}

.char-details {
  display: flex;
  align-items: center;
  gap: 8px;
}

.char-name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.gender-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
}

.gender-badge.female {
  background: #fff0f0;
  color: #f56c6c;
}

.gender-badge.male {
  background: #ecf5ff;
  color: #409eff;
}

.gender-badge.other {
  background: #f0f0f0;
  color: #909399;
}

.char-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-divider {
  display: inline-block;
  width: 1px;
  height: 16px;
  background: #e4e7ed;
}

.action-inline {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
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
  cursor: pointer;
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

.character-count-badge {
  font-size: 12px;
  background: linear-gradient(135deg, #a396ff 0%, #8e7dff 100%);
  color: #fff;
  padding: 2px 8px;
  border-radius: 10px;
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
  transition: transform 0.3s;
}

.card-arrow .rotated {
  transform: rotate(90deg);
}

/* 角色列表展开区域（移动端） */
.character-list {
  padding: 12px 16px;
  background: #fafbfc;
  border-top: 1px solid #f2f6fc;
}

.character-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.character-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid #f2f6fc;
}

.character-card .char-info {
  flex: 1;
}

.name-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
}

.char-actions-mobile {
  display: flex;
  gap: 4px;
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

/* 响应式适配 */
@media (max-width: 768px) {
  .desktop-view {
    display: none;
  }
  .mobile-view {
    display: flex;
  }
  .header-section {
    flex-direction: column;
    align-items: stretch;
  }
  .header-actions {
    width: 100%;
  }
  .header-actions .add-btn {
    flex: 1;
  }
  .page-title {
    font-size: 18px;
  }
  .add-btn span {
    display: inline;
  }
}

/* 弹窗与关键词管理 */
.keyword-manager-box {
  background: #f8f9fc;
  padding: 12px;
  border-radius: 8px;
  border: 1px dashed #dcdfe6;
}

.input-inline {
  margin-bottom: 12px;
}

.tags-wrapper {
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

/* 角色表单布局 */
.form-layout {
  display: flex;
  gap: 24px;
}

.avatar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.info-col {
  flex: 1;
}

.avatar-uploader {
  width: 120px;
  height: 120px;
  border: 1px dashed #dcdfe6;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  background: #f8f9fc;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.upload-label {
  position: absolute;
  bottom: 0;
  width: 100%;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 11px;
  text-align: center;
  padding: 4px 0;
}

.custom-radio :deep(.el-radio-button__inner) {
  border-radius: 8px !important;
  margin-right: 8px;
  border: 1px solid #dcdfe6 !important;
}

@media (max-width: 768px) {
  .form-layout {
    flex-direction: column;
    align-items: center;
  }
}

/* BGM导入对话框样式 */
.bgm-dialog :deep(.el-dialog__body) {
  padding: 24px;
  min-height: 400px;
}

.bgm-import-container {
  width: 100%;
}

/* 搜索阶段 */
.bgm-step-search {
  padding: 20px 0;
}

.bgm-search-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* 搜索中等待页面 */
.bgm-step-searching {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px 20px;
}

.searching-content {
  text-align: center;
  max-width: 400px;
}

.searching-icon {
  font-size: 64px;
  color: #a396ff;
  animation: rotate 2s linear infinite;
  margin-bottom: 20px;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.searching-content h3 {
  margin: 16px 0 8px;
  font-size: 18px;
  color: #303133;
}

.searching-content p {
  color: #909399;
  font-size: 14px;
  margin-bottom: 24px;
}

.searching-progress {
  width: 100%;
}

/* 搜索结果展示 */
.bgm-step-results {
  padding: 20px 0;
}

.results-header {
  margin-bottom: 20px;
}

.results-header h3 {
  font-size: 18px;
  color: #303133;
  margin: 0 0 8px;
}

.results-subtitle {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

.results-actions-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f2f6fc;
}

.results-filter {
  margin-bottom: 12px;
}

.results-filter-input :deep(.el-input__wrapper) {
  border-radius: 999px;
}

.selected-count {
  margin-left: auto;
  color: #606266;
  font-size: 14px;
}

.character-list-container {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 8px;
}

.bgm-character-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #f2f6fc;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}

.bgm-character-item:hover {
  border-color: #a396ff;
  background: #f6f4ff;
}

.bgm-character-item.selected {
  border-color: #a396ff;
  background: linear-gradient(135deg, #f6f4ff 0%, #ebe7ff 100%);
  box-shadow: 0 2px 8px rgba(163, 150, 255, 0.2);
}

.bgm-character-item .char-info {
  flex: 1;
}

.bgm-character-item .char-name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.bgm-character-item .char-relation {
  font-size: 12px;
  color: #909399;
}

.empty-results {
  padding: 40px 0;
}

/* 导入中 */
.bgm-step-importing {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px 20px;
}

.importing-content {
  text-align: center;
  max-width: 400px;
}

.importing-icon {
  font-size: 64px;
  color: #a396ff;
  animation: rotate 2s linear infinite;
  margin-bottom: 20px;
}

.importing-content h3 {
  margin: 16px 0 8px;
  font-size: 18px;
  color: #303133;
}

.importing-content p {
  color: #909399;
  font-size: 14px;
  margin-bottom: 24px;
}

.importing-progress {
  width: 100%;
}

/* 导入完成 */
.bgm-step-imported {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px 20px;
}

.imported-content {
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.success-icon {
  font-size: 64px;
  color: #67c23a;
  margin-bottom: 20px;
}

.imported-content h3 {
  margin: 16px 0 24px;
  font-size: 20px;
  color: #303133;
}

.import-summary {
  background: #f8f9fc;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.import-summary p {
  margin: 8px 0;
  font-size: 15px;
  color: #606266;
}

.import-summary strong {
  color: #a396ff;
  font-size: 18px;
}

.import-details {
  text-align: left;
  margin-top: 20px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 14px;
}

.detail-item .el-icon {
  font-size: 16px;
}

.detail-item.created .el-icon {
  color: #67c23a;
}

.detail-item.already_exists .el-icon {
  color: #e6a23c;
}

.detail-item.error .el-icon {
  color: #f56c6c;
}

.detail-text {
  flex: 1;
  color: #606266;
}

.detail-status {
  color: #909399;
  font-size: 12px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .bgm-dialog :deep(.el-dialog) {
    width: 95% !important;
  }

  .results-actions-top {
    flex-wrap: wrap;
  }

  .selected-count {
    margin-left: 0;
    width: 100%;
  }

  .character-list-container {
    max-height: 300px;
  }
}
</style>
