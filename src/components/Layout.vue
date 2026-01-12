<template>
  <div class="layout">
    <!-- 顶部导航栏 -->
    <nav ref="navbarRef" class="navbar" :class="{ 'navbar-native': isNativePlatform }">
      <div class="navbar-content">
        <div class="brand" @click="goHome">
          <span class="brand-text">✦ 拾谷 ShiGu</span>
        </div>
        <!-- 普通宽度下：直接展示完整菜单 -->
        <div class="nav-menu" v-if="!isMobile">
          <el-menu
            :default-active="activeMenu"
            mode="horizontal"
            @select="handleMenuSelect"
            class="nav-menu-el"
          >
            <el-menu-item index="/showcase">
              <el-icon><Grid /></el-icon>
              <span>云展柜</span>
            </el-menu-item>
            <el-menu-item index="/location">
              <el-icon><FolderOpened /></el-icon>
              <span>位置管理</span>
            </el-menu-item>
            <el-menu-item index="/ipcharacter">
              <el-icon><Collection /></el-icon>
              <span>IP作品与角色</span>
            </el-menu-item>
            <el-menu-item index="/category">
              <el-icon><Box /></el-icon>
              <span>品类管理</span>
            </el-menu-item>
          </el-menu>
        </div>
        <!-- 设置按钮（PC端和移动端都显示） -->
        <div class="nav-actions">
          <el-button
            text
            :class="{ 'settings-active': route.path === '/settings' }"
            @click="goToSettings"
            class="settings-btn"
          >
            <el-icon><Setting /></el-icon>
          </el-button>
        </div>
      </div>
    </nav>

    <!-- 主要内容区 -->
    <main class="main-content" :class="{ 'has-bottom-nav': isMobile }">
      <router-view v-slot="{ Component, route }">
        <Transition :name="pageTransitionName" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </Transition>
      </router-view>
    </main>

    <!-- 移动端底部导航栏 -->
    <MobileBottomNav v-if="isMobile" />

    <!-- 悬浮按钮组（仅云展柜页面展示） -->
    <div v-if="showFab" class="fab-group" :class="{ 'fab-mobile': isMobile }">
      <div class="fab-btn refresh-fab" @click="handleRefresh" :class="{ loading: refreshLoading }">
        <el-icon v-if="!refreshLoading"><Refresh /></el-icon>
        <el-icon v-else class="is-loading"><Loading /></el-icon>
      </div>
      <div class="fab-btn" @click="goToAdd">
        <el-icon><Plus /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Grid, FolderOpened, Plus, Collection, Box, Refresh, Loading, Setting } from '@element-plus/icons-vue'
import { useGuziStore } from '@/stores/guzi'
import { Capacitor } from '@capacitor/core'
import { StatusBar } from '@capacitor/status-bar'
import MobileBottomNav from './MobileBottomNav.vue'

const router = useRouter()
const route = useRoute()
const guziStore = useGuziStore()

const isMobile = ref(window.innerWidth < 768)
const refreshLoading = ref(false)
const isNativePlatform = ref(Capacitor.isNativePlatform())
const statusBarHeight = ref(0)
const navbarRef = ref<HTMLElement | null>(null)

const activeMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/showcase')) return '/showcase'
  if (path.startsWith('/location')) return '/location'
  if (path.startsWith('/ipcharacter') || path.startsWith('/ip') || path.startsWith('/character')) return '/ipcharacter'
  if (path.startsWith('/category')) return '/category'
  return '/showcase'
})

const handleMenuSelect = (index: string) => {
  router.push(index)
}

const goHome = () => {
  router.push('/showcase')
}

const goToSettings = () => {
  router.push('/settings')
}

// 仅在云展柜页面显示“新增谷子”悬浮按钮
const showFab = computed(() => route.path.startsWith('/showcase'))

const goToAdd = () => {
  router.push('/goods/new')
}

// 移动端为页面切换添加向上滑入动画，PC 端使用轻量淡入
const pageTransitionName = computed(() => (isMobile.value ? 'page-slide-up' : 'page-fade'))

const handleRefresh = async () => {
  if (refreshLoading.value) return
  refreshLoading.value = true
  try {
    await guziStore.searchGuziImmediate()
  } finally {
    refreshLoading.value = false
  }
}

const handleResize = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  
  // 在原生平台上，尝试获取状态栏高度并设置 padding（作为 CSS env() 的后备方案）
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    // 延迟检查，确保 Capacitor 和状态栏已完全初始化
    setTimeout(() => {
      // 检查 safe-area-inset-top 是否可用且有效
      const safeAreaTop = getComputedStyle(document.documentElement)
        .getPropertyValue('env(safe-area-inset-top)')
      
      // 如果 safe-area-inset-top 不可用或为 0，使用 JavaScript 设置默认值
      // 这主要作为后备方案，因为 Capacitor 通常会自动设置 safe-area-inset-top
      if (!safeAreaTop || safeAreaTop === '0px' || safeAreaTop.trim() === '') {
        // Android 状态栏的标准高度通常是 24dp
        // 根据设备像素比调整（高DPI设备可能需要更大的值）
        const defaultStatusBarHeight = window.devicePixelRatio >= 3 ? 28 : 
                                      window.devicePixelRatio >= 2 ? 26 : 24
        statusBarHeight.value = defaultStatusBarHeight
        
        // 直接设置 padding-top 作为后备方案
        if (navbarRef.value) {
          navbarRef.value.style.paddingTop = `${defaultStatusBarHeight}px`
        }
      }
    }, 100) // 延迟 100ms 确保初始化完成
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background-color: var(--bg-white);
  border-bottom: 2px solid transparent;
  border-image: linear-gradient(to right, transparent, var(--primary-gold), transparent) 1;
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 1000;
}

/* 在 Capacitor 原生环境中，为导航栏添加状态栏高度的 padding-top */
.navbar-native {
  padding-top: env(safe-area-inset-top);
}

/* 如果浏览器不支持 safe-area-inset-top，则不应用 padding */
@supports not (padding-top: env(safe-area-inset-top)) {
  .navbar-native {
    padding-top: 0;
  }
}

.navbar-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  height: 64px;
}

.brand {
  cursor: pointer;
  user-select: none;
  justify-self: start;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.brand:focus,
.brand:active {
  outline: none;
}

.brand-text {
  font-size: 24px;
  font-weight: bold;
  background: linear-gradient(45deg, var(--primary-gold), var(--primary-gold-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-menu {
  display: flex;
  justify-content: center;
  grid-column: 2;
}

.nav-menu-el {
  border-bottom: none;
  background: transparent;
}

:deep(.el-menu-item) {
  color: var(--text-dark);
  border-bottom: 2px solid transparent;
}

:deep(.el-menu-item:hover) {
  color: var(--primary-gold);
  background-color: transparent;
}

:deep(.el-menu-item.is-active) {
  color: var(--primary-gold);
  border-bottom-color: var(--primary-gold);
  background-color: transparent;
}

.nav-actions {
  display: flex;
  gap: 12px;
  justify-self: end;
}

.settings-btn {
  font-size: 20px;
  color: var(--text-dark);
  padding: 8px;
  transition: color 0.2s ease;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.settings-btn:hover {
  color: var(--primary-gold);
}

.settings-btn:focus,
.settings-btn:active {
  outline: none;
}

.settings-btn.settings-active {
  color: var(--primary-gold);
}

:deep(.settings-btn:focus),
:deep(.settings-btn:active),
:deep(.settings-btn:focus-visible) {
  outline: none;
  border: none;
}

.main-content {
  flex: 1;
  min-height: calc(100vh - 64px);
}

.main-content.has-bottom-nav {
  padding-bottom: calc(64px + env(safe-area-inset-bottom));
}

/* 兼容不支持 safe-area-inset-bottom 的环境 */
@supports not (padding-bottom: env(safe-area-inset-bottom)) {
  .main-content.has-bottom-nav {
    padding-bottom: 64px;
  }
}

/* 页面过渡动画 */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.page-slide-up-enter-active,
.page-slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.page-slide-up-enter-from,
.page-slide-up-leave-to {
  transform: translateY(24px);
  opacity: 0;
}

.fab-group {
  position: fixed;
  bottom: 30px;
  right: 30px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  z-index: 999;
}

.fab-btn {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--primary-gold), var(--primary-gold-light));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 30px;
  box-shadow: var(--shadow-purple);
  cursor: pointer;
  transition: all var(--transition-normal);
  outline: none;
  -webkit-tap-highlight-color: transparent;
  border: none;
}

.fab-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(212, 175, 55, 0.6);
}

.fab-btn:focus,
.fab-btn:active {
  outline: none;
}

.refresh-fab {
  background: linear-gradient(135deg, #a396ff 0%, #8e7dff 100%);
}

.refresh-fab:hover {
  background: linear-gradient(135deg, #8e7dff 0%, #7a6aff 100%);
  transform: scale(1.1) rotate(180deg);
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

@media (max-width: 768px) {
  .navbar-content {
    padding: 0 12px;
    grid-template-columns: 1fr auto;
  }

  .brand-text {
    font-size: 20px;
  }

  .nav-actions {
    justify-self: end;
  }

  .settings-btn {
    font-size: 22px;
    padding: 6px;
  }

  .fab-group {
    bottom: 20px;
    right: 20px;
  }

  .fab-group.fab-mobile {
    bottom: calc(84px + env(safe-area-inset-bottom));
  }

  /* 兼容不支持 safe-area-inset-bottom 的环境 */
  @supports not (bottom: env(safe-area-inset-bottom)) {
    .fab-group.fab-mobile {
      bottom: 84px;
    }
  }

  .fab-btn {
    width: 50px;
    height: 50px;
    font-size: 24px;
  }
}
</style>

