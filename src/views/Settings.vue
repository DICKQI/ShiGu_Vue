<template>
  <div class="settings-container">
    <div class="header-section">
      <div class="title-wrapper">
        <h2 class="page-title">设置</h2>
        <span class="sub-title">配置应用程序设置</span>
      </div>
    </div>

    <el-card class="settings-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><Setting /></el-icon>
          <span>后端服务配置</span>
        </div>
      </template>

      <el-form :model="formData" :rules="formRules" ref="formRef" label-position="top" class="settings-form">
        <el-form-item label="后端 API 地址" prop="apiBaseURL">
          <el-input
            v-model="formData.apiBaseURL"
            placeholder="请输入后端 API 地址，例如：http://127.0.0.1:8000"
            clearable
            class="api-input"
          >
            <template #prefix><el-icon><Link /></el-icon></template>
          </el-input>
          <div class="form-tip">
            <el-icon class="tip-icon"><InfoFilled /></el-icon>
            <span>当前地址将用于所有 API 请求。修改后立即生效。</span>
          </div>
        </el-form-item>

        <el-form-item>
          <div class="form-actions">
            <el-button @click="handleReset" :disabled="isDefault">恢复默认</el-button>
            <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
          </div>
        </el-form-item>
      </el-form>

      <el-divider />

      <div class="current-info">
        <div class="info-item">
          <span class="info-label">当前后端地址：</span>
          <span class="info-value">{{ currentBaseURL }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">默认后端地址：</span>
          <span class="info-value default-value">{{ defaultBaseURL }}</span>
        </div>
      </div>
    </el-card>

    <el-card class="settings-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><Document /></el-icon>
          <span>使用说明</span>
        </div>
      </template>

      <div class="help-content">
        <el-alert
          title="后端地址配置说明"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <ul class="help-list">
              <li>后端地址应为完整的 URL，包含协议（http:// 或 https://）和端口号</li>
              <li>示例：<code>http://127.0.0.1:8000</code> 或 <code>https://api.example.com</code></li>
              <li>修改后的地址会保存到浏览器本地存储，刷新页面后仍然有效</li>
              <li>如果配置错误，可以点击"恢复默认"按钮重置为默认地址</li>
            </ul>
          </template>
        </el-alert>
      </div>
    </el-card>

    <!-- 账号与个人信息：仅已登录时展示 -->
    <el-card v-if="authStore.isAuthenticated" class="settings-card" shadow="never">
      <template #header>
        <div class="card-header">
          <el-icon class="header-icon"><User /></el-icon>
          <span>账号与个人信息</span>
        </div>
      </template>
      <div class="account-info">
        <div class="info-item">
          <span class="info-label">用户名：</span>
          <span class="info-value">{{ authStore.user?.username ?? '—' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">角色：</span>
          <span class="info-value">{{ roleLabel }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">用户 ID：</span>
          <span class="info-value">{{ authStore.user?.id ?? '—' }}</span>
        </div>
        <div class="role-tip">
          <template v-if="authStore.isAdmin">
            管理员可管理 IP、品类、角色、主题等公共元数据，并可查看所有用户数据。
          </template>
          <template v-else>
            普通用户只能访问和修改自己的谷子、展柜、主题与收纳位置；公共元数据为只读。
          </template>
        </div>
      </div>
      <el-divider />
      <div class="form-actions">
        <el-button :loading="refreshingUser" @click="handleRefreshUser">刷新信息</el-button>
        <el-button type="danger" plain @click="handleLogout">退出登录</el-button>
      </div>
    </el-card>

    <!-- 未登录时提示 -->
    <el-card v-else class="settings-card settings-card-tip" shadow="never">
      <div class="account-tip">
        <el-icon class="tip-icon"><User /></el-icon>
        <span>登录后可在此查看账号信息与退出登录。</span>
        <router-link to="/login" class="link">去登录</router-link>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Setting, Link, InfoFilled, Document, User } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { updateBaseURL, getCurrentBaseURL, resetBaseURL } from '@/utils/request'
import { useAuthStore } from '@/stores/auth'
import { useMetadataStore } from '@/stores/metadata'

const router = useRouter()
const authStore = useAuthStore()
const metadataStore = useMetadataStore()
const refreshingUser = ref(false)

const formRef = ref<FormInstance>()
const saving = ref(false)
const formData = ref({
  apiBaseURL: ''
})

// 获取默认地址（与 request.ts 中的逻辑保持一致）
const getDefaultBaseURL = (): string => {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8000`
  }
  return 'http://127.0.0.1:8000'
}

const defaultBaseURL = ref(getDefaultBaseURL())
const currentBaseURL = ref('')

// URL 验证规则
const validateURL = (rule: any, value: string, callback: any) => {
  if (!value || value.trim() === '') {
    callback(new Error('后端地址不能为空'))
    return
  }

  try {
    const url = new URL(value.trim())
    // 只允许 http 和 https 协议
    if (!['http:', 'https:'].includes(url.protocol)) {
      callback(new Error('只支持 http:// 或 https:// 协议'))
      return
    }
    callback()
  } catch (error) {
    callback(new Error('请输入有效的 URL 地址，例如：http://127.0.0.1:8000'))
  }
}

const formRules: FormRules = {
  apiBaseURL: [
    { required: true, validator: validateURL, trigger: 'blur' }
  ]
}

const isDefault = computed(() => {
  return formData.value.apiBaseURL === defaultBaseURL.value || formData.value.apiBaseURL === ''
})

const loadCurrentSettings = () => {
  currentBaseURL.value = getCurrentBaseURL()
  formData.value.apiBaseURL = currentBaseURL.value
}

const handleSave = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    saving.value = true
    try {
      const url = formData.value.apiBaseURL.trim()
      updateBaseURL(url)
      currentBaseURL.value = url
      metadataStore.clearCache() // 清除元数据缓存
      ElMessage.success('后端地址已保存')
    } catch (error: any) {
      ElMessage.error(error.message || '保存失败')
    } finally {
      saving.value = false
    }
  })
}

const handleReset = () => {
  resetBaseURL()
  formData.value.apiBaseURL = defaultBaseURL.value
  currentBaseURL.value = defaultBaseURL.value
  metadataStore.clearCache() // 清除元数据缓存
  ElMessage.success('已恢复为默认地址')
}

const roleLabel = computed(() => {
  const role = authStore.user?.role
  if (!role) return '—'
  return role.toLowerCase() === 'admin' ? '管理员' : '普通用户'
})

const handleRefreshUser = async () => {
  refreshingUser.value = true
  try {
    await authStore.fetchCurrentUser()
    ElMessage.success('已刷新')
  } catch {
    ElMessage.error('登录状态已失效，请重新登录')
    await router.push('/login')
  } finally {
    refreshingUser.value = false
  }
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      lockScroll: true,
      closeOnClickModal: true,
      closeOnPressEscape: true,
    })
    await authStore.logout()
  } catch (error) {
    // 用户取消或 logout 内部会跳转
    if (error !== 'cancel' && error !== 'close') {
      console.error(error)
    }
  }
}

onMounted(() => {
  loadCurrentSettings()
  if (authStore.isAuthenticated && !authStore.user) {
    authStore.fetchCurrentUser()
  }
})
</script>

<style scoped>
.settings-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  min-height: calc(100vh - 64px);
}

.header-section {
  margin-bottom: 20px;
}

.title-wrapper {
  display: flex;
  flex-direction: column;
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

.settings-card {
  border-radius: 12px;
  border: none;
  margin-bottom: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.header-icon {
  font-size: 18px;
  color: #8e7dff;
}

.settings-form {
  margin-top: 20px;
}

.api-input {
  width: 100%;
}

.form-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

.tip-icon {
  font-size: 14px;
  color: #409eff;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.current-info {
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  color: #606266;
  min-width: 120px;
  font-weight: 500;
}

.info-value {
  color: #303133;
  font-family: monospace;
  word-break: break-all;
}

.info-value.default-value {
  color: #909399;
}

.help-content {
  margin-top: 12px;
}

.help-list {
  margin: 12px 0 0 0;
  padding-left: 20px;
  line-height: 1.8;
  color: #606266;
}

.help-list li {
  margin-bottom: 8px;
}

.help-list code {
  background-color: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  color: #e6a23c;
}

.account-info {
  padding: 0;
}

.role-tip {
  margin-top: 12px;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

.account-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
}

.account-tip .tip-icon {
  font-size: 18px;
  color: #909399;
}

.account-tip .link {
  color: #409eff;
  text-decoration: none;
  margin-left: 4px;
}

.account-tip .link:hover {
  text-decoration: underline;
}

.settings-card-tip .el-card__body {
  padding: 16px 20px;
}

@media (max-width: 768px) {
  .settings-container {
    padding: 16px;
  }

  .page-title {
    font-size: 20px;
  }

  .form-actions {
    display: flex;
    flex-direction: row;
    gap: 12px;
  }

  .form-actions :deep(.el-button) {
    flex: 1;
    margin: 0;
  }

  .info-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .info-label {
    min-width: auto;
  }
}
</style>

