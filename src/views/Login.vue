<template>
  <div class="login-container">
    <!-- Decorative background shapes (Laser & Gold) -->
    <div class="bg-shape shape-1"></div>
    <div class="bg-shape shape-2"></div>

    <div class="login-card-wrapper">
      <el-card class="login-card" :body-style="{ padding: '0' }">
        <div class="login-content">
          <div class="card-header">
            <div class="logo-container">
              <div class="logo-icon">PG</div>
            </div>
            <h2 class="login-title">拾谷 PickGoods</h2>
            <p class="login-subtitle">欢迎回到拾谷</p>
          </div>

          <!-- Custom Tabs Header -->
          <div class="custom-tabs">
            <div
              class="tab-item"
              :class="{ active: mode === 'login' }"
              @click="switchMode('login')"
            >
              登录
            </div>
            <div
              class="tab-item"
              :class="{ active: mode === 'register' }"
              @click="switchMode('register')"
            >
              注册
            </div>
            <!-- Animated Bottom Bar -->
            <div class="tab-bar" :style="tabBarStyle"></div>
          </div>

          <!-- Single Adaptive Form -->
          <el-form
            ref="formRef"
            :model="formData"
            :rules="currentRules"
            label-position="top"
            class="login-form"
            @submit.prevent="handleSubmit"
            size="large"
            hide-required-asterisk
          >
            <el-form-item prop="username">
              <el-input
                v-model="formData.username"
                placeholder="用户名"
                clearable
                :prefix-icon="User"
                maxlength="150"
              />
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="formData.password"
                type="password"
                :placeholder="mode === 'register' ? '密码（至少 6 位）' : '密码'"
                show-password
                clearable
                :prefix-icon="Lock"
                @keyup.enter="handleEnterKey"
              />
            </el-form-item>

            <!-- Animated Confirm Password Field -->
            <transition
              name="expand"
              @enter="enter"
              @after-enter="afterEnter"
              @leave="leave"
            >
              <div v-if="mode === 'register'" class="expand-wrapper">
                <el-form-item prop="confirmPassword" class="confirm-password-item">
                  <el-input
                    v-model="formData.confirmPassword"
                    type="password"
                    placeholder="确认密码"
                    show-password
                    clearable
                    :prefix-icon="Lock"
                    @keyup.enter="handleSubmit"
                  />
                </el-form-item>
              </div>
            </transition>

            <div class="form-actions">
              <el-button
                type="primary"
                class="submit-btn"
                :loading="authStore.loading"
                @click="handleSubmit"
                round
              >
                <span class="btn-text">{{ mode === 'login' ? '登 录' : '注册并自动登录' }}</span>
              </el-button>
            </div>
          </el-form>

          <transition name="fade">
            <el-alert
              v-if="errorMessage"
              :title="errorMessage"
              type="error"
              show-icon
              closable
              class="error-alert"
            />
          </transition>

          <div class="footer-links">
            <router-link to="/settings" class="link">
              <el-icon class="link-icon"><Tools /></el-icon>
              <span>服务器设置</span>
            </router-link>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { User, Lock, Tools } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// State
const mode = ref<'login' | 'register'>('login')
const errorMessage = ref('')
const formRef = ref<FormInstance>()

// Data
const formData = reactive({
  username: '',
  password: '',
  confirmPassword: '',
})

// Validation
const validateConfirmPassword = (_rule: any, value: string, callback: (err?: Error) => void) => {
  if (mode.value === 'register' && value !== formData.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const loginRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const registerRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

const currentRules = computed(() => mode.value === 'login' ? loginRules : registerRules)

// Tab Bar Animation
const tabBarStyle = computed(() => {
  return {
    transform: mode.value === 'login' ? 'translateX(0)' : 'translateX(100%)',
  }
})

// Actions
function switchMode(newMode: 'login' | 'register') {
  if (mode.value === newMode) return
  mode.value = newMode
  errorMessage.value = ''

  // Clear validation state when switching, but keep input values (UX choice)
  // except confirmPassword which is hidden/shown
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

function getRedirectPath(): string {
  const redirect = route.query.redirect
  if (typeof redirect === 'string' && redirect && redirect !== '/login') {
    return redirect
  }
  return '/showcase'
}

async function handleSubmit() {
  errorMessage.value = ''
  await formRef.value?.validate(async (valid) => {
    if (!valid) return
    try {
      if (mode.value === 'login') {
        await authStore.login(formData.username.trim(), formData.password)
        ElMessage.success('登录成功')
      } else {
        await authStore.registerAndLogin(formData.username.trim(), formData.password)
        ElMessage.success('注册成功，已自动登录')
      }
      await router.push(getRedirectPath())
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || (mode.value === 'login' ? '登录失败' : '注册失败')
      errorMessage.value = typeof msg === 'string' ? msg : JSON.stringify(msg)
    }
  })
}

function handleEnterKey() {
  if (mode.value === 'login') {
    handleSubmit()
  }
  // If register, do nothing (let user tab to confirm password)
}

// Animation Hooks for Height Transition
const enter = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = '0'
  element.style.opacity = '0'
  // Force reflow
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  element.offsetHeight

  element.style.height = element.scrollHeight + 'px'
  element.style.opacity = '1'
}

const afterEnter = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = 'auto'
  element.style.overflow = 'visible' // Allow tooltips etc if needed
}

const leave = (el: Element) => {
  const element = el as HTMLElement
  element.style.height = element.scrollHeight + 'px'
  element.style.overflow = 'hidden'
  // Force reflow
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  element.offsetHeight

  element.style.height = '0'
  element.style.opacity = '0'
}

onMounted(() => {
  errorMessage.value = ''
})
</script>

<style scoped>
/* Color Variables based on PM.txt */
:root {
  --color-brand: #D4AF37;       /* 香槟金 */
  --color-secondary: #F5F5F7;   /* 明亮灰 */
  --color-accent: #A29BFE;      /* 镭射紫 */
  --color-bg: #FFFFFF;          /* 纯白 */
  --color-text-main: #303133;
  --color-text-sub: #909399;
}

/* Base Layout */
.login-container {
  min-height: 100vh;
  height: 100dvh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #FFFFFF; /* PM 1.2 BG */
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

/* Background Shapes (Simulating Laser Reflection) */
.bg-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  z-index: 0;
  opacity: 0.4;
}

.shape-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #D4AF37 0%, transparent 70%); /* Champagne */
  top: -100px;
  right: -50px;
}

.shape-2 {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, #A29BFE 0%, transparent 70%); /* Laser Purple */
  bottom: -50px;
  left: -50px;
}

/* Card Wrapper */
.login-card-wrapper {
  width: 100%;
  max-width: 400px;
  z-index: 1;
}

.login-card {
  border-radius: 12px;
  border: 1px solid #D4AF37; /* PM 1.2: 1px 香槟金细边框 */
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 24px rgba(212, 175, 55, 0.15); /* Subtle gold shadow */
  overflow: hidden; /* Important for height animation */
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); /* Global transition for wrapper */
}

.login-card:hover {
  box-shadow: 0 8px 32px rgba(162, 155, 254, 0.2); /* Laser Purple hint on hover */
}

.login-content {
  padding: 40px 32px;
}

/* Header */
.card-header {
  text-align: center;
  margin-bottom: 24px;
}

.logo-container {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.logo-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #D4AF37 0%, #FAD961 100%); /* Brand Color */
  border-radius: 12px;
  color: white;
  font-size: 24px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.login-title {
  font-size: 26px;
  font-weight: 700;
  color: #D4AF37; /* PM 1.2: Brand color for important titles */
  margin: 0 0 8px 0;
  letter-spacing: 1px;
}

.login-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

/* Custom Tabs */
.custom-tabs {
  position: relative;
  display: flex;
  margin-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-size: 16px;
  font-weight: 500;
  color: #606266;
  cursor: pointer;
  transition: color 0.3s ease;
  z-index: 1;
}

.tab-item.active {
  color: #D4AF37;
  font-weight: 600;
}

.tab-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 50%;
  height: 2px;
  background-color: #D4AF37;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Form */
.login-form {
  margin-top: 10px;
}

.login-form :deep(.el-input__wrapper) {
  box-shadow: none;
  background-color: #F5F5F7; /* PM 1.2: Secondary color for input bg */
  border-radius: 8px;
  padding: 8px 16px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  background-color: #fff;
  border-color: #D4AF37; /* Brand color focus */
  box-shadow: 0 0 0 1px #D4AF37 inset;
}

.login-form :deep(.el-input__inner) {
  height: 44px;
  font-size: 15px;
  color: #303133;
}

/* Expand Animation Wrapper */
.expand-wrapper {
  overflow: hidden;
  /* Hardware acceleration for smoother animation */
  will-change: height, opacity;
}

/* Custom Transition: Expand */
.expand-enter-active,
.expand-leave-active {
  transition: height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease;
}

/* Slide effect for the inner item */
.confirm-password-item {
  margin-bottom: 18px; /* Standard el-form-item margin */
  /* Ensure transform origin is top for natural feel */
  transform-origin: top;
  animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.form-actions {
  margin-top: 24px;
  /* Smooth transition for when button is pushed down */
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.submit-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
  background: #A29BFE; /* PM 1.2: Accent for Primary Button */
  border: none;
  box-shadow: 0 4px 14px rgba(162, 155, 254, 0.4);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

/* Laser/Holographic hover effect */
.submit-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    120deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  transition: 0.5s;
}

.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(162, 155, 254, 0.5);
}

.submit-btn:hover::before {
  left: 100%;
}

.submit-btn:active {
  transform: translateY(1px);
}

/* Alert */
.error-alert {
  margin-top: 16px;
  border-radius: 8px;
}

/* Footer */
.footer-links {
  margin-top: 32px;
  text-align: center;
}

.link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #909399;
  text-decoration: none;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.3s ease;
  background: transparent;
  border: 1px solid transparent;
}

.link:hover {
  color: #D4AF37;
  border-color: #D4AF37;
  background: rgba(212, 175, 55, 0.05);
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Mobile Optimizations */
@media (max-width: 480px) {
  .login-container {
    padding: 0;
    background: #FFFFFF;
  }

  .bg-shape {
    opacity: 0.2; /* Lighter on mobile */
  }

  .login-card-wrapper {
    height: 100%;
    max-width: none;
  }

  .login-card {
    height: 100%;
    border-radius: 0;
    border: none;
    box-shadow: none;
    background: transparent;
  }

  .login-content {
    padding: 32px 24px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .card-header {
    margin-bottom: 32px;
  }

  .logo-icon {
    width: 72px;
    height: 72px;
    font-size: 28px;
    margin-bottom: 12px;
  }

  .login-title {
    font-size: 28px;
  }

  .footer-links {
    margin-top: auto;
    padding-bottom: 20px;
  }
}
</style>
