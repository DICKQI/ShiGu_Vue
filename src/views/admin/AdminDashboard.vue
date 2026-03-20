<template>
  <div class="admin-layout">
    <aside class="admin-sidebar" :class="{ collapsed: isSidebarCollapsed }">
      <div class="sidebar-header">
        <div class="brand" @click="goHome">
          <span class="brand-icon">✦</span>
          <span v-show="!isSidebarCollapsed" class="brand-text">管理后台</span>
        </div>
        <el-button
          v-show="!isSidebarCollapsed"
          class="collapse-btn"
          text
          @click="toggleSidebar"
          :icon="Fold"
        />
        <el-button
          v-show="isSidebarCollapsed"
          class="collapse-btn collapsed-toggle"
          text
          @click="toggleSidebar"
          :icon="Expand"
        />
      </div>

      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        :collapse="isSidebarCollapsed"
        @select="handleMenuSelect"
      >
        <el-menu-item index="/admin/users">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>
        <el-menu-item index="/admin/goods">
          <el-icon><Goods /></el-icon>
          <template #title>谷子管理</template>
        </el-menu-item>
        <el-menu-item index="/admin/ip">
          <el-icon><Collection /></el-icon>
          <template #title>IP与角色</template>
        </el-menu-item>
        <el-menu-item index="/admin/categories">
          <el-icon><Box /></el-icon>
          <template #title>品类管理</template>
        </el-menu-item>
        <el-menu-item index="/admin/themes">
          <el-icon><Star /></el-icon>
          <template #title>主题管理</template>
        </el-menu-item>
      </el-menu>

      <div class="sidebar-footer">
        <el-button
          text
          class="back-btn"
          @click="goBack"
        >
          <el-icon><Back /></el-icon>
          <span v-show="!isSidebarCollapsed">返回主站</span>
        </el-button>
      </div>
    </aside>

    <main class="admin-main">
      <header class="admin-header">
        <div class="header-left">
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>
        <div class="header-right">
          <span class="user-info">
            <el-icon><User /></el-icon>
            <span>{{ authStore.user?.username }}</span>
          </span>
          <el-button text @click="goToSettings">
            <el-icon><Setting /></el-icon>
          </el-button>
        </div>
      </header>

      <div class="admin-content">
        <router-view v-slot="{ Component, route }">
          <Transition name="admin-page-fade" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </Transition>
        </router-view>
      </div>
    </main>

    <div v-if="isMobile && !isSidebarCollapsed" class="sidebar-overlay" @click="isSidebarCollapsed = true"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  User,
  Goods,
  Collection,
  Box,
  Star,
  Back,
  Setting,
  Fold,
  Expand
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isSidebarCollapsed = ref(false)
const isMobile = ref(window.innerWidth < 768)

const activeMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/admin/users')) return '/admin/users'
  if (path.startsWith('/admin/goods')) return '/admin/goods'
  if (path.startsWith('/admin/ip')) return '/admin/ip'
  if (path.startsWith('/admin/categories')) return '/admin/categories'
  if (path.startsWith('/admin/themes')) return '/admin/themes'
  return '/admin/users'
})

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/admin/users': '用户管理',
    '/admin/goods': '谷子管理',
    '/admin/ip': 'IP与角色管理',
    '/admin/categories': '品类管理',
    '/admin/themes': '主题管理'
  }
  return titles[activeMenu.value] || '管理后台'
})

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

const handleMenuSelect = (index: string) => {
  router.push(index)
  if (isMobile.value) {
    isSidebarCollapsed.value = true
  }
}

const goHome = () => {
  router.push('/showcase')
}

const goBack = () => {
  router.push('/showcase')
}

const goToSettings = () => {
  router.push('/settings')
}

const handleResize = () => {
  isMobile.value = window.innerWidth < 768
  if (isMobile.value) {
    isSidebarCollapsed.value = true
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  handleResize()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.admin-sidebar {
  width: 220px;
  background: linear-gradient(180deg, #ffffff 0%, #fafbff 100%);
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
}

.admin-sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-bottom: 1px solid #e4e7ed;
}

.admin-sidebar.collapsed .sidebar-header {
  justify-content: center;
  padding: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.admin-sidebar.collapsed .brand {
  display: none;
}

.brand-icon {
  font-size: 24px;
  background: linear-gradient(45deg, #d4af37, #f0d77c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-text {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.collapse-btn {
  font-size: 18px;
  color: #606266;
}

.admin-sidebar.collapsed .collapse-btn {
  margin: 0 auto;
}

.sidebar-menu {
  flex: 1;
  border-right: none;
  background: transparent;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 220px;
}

.sidebar-menu.el-menu--collapse {
  width: 64px;
}

.sidebar-menu :deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  margin: 4px 8px;
  border-radius: 8px;
}

.sidebar-menu.el-menu--collapse :deep(.el-menu-item) {
  margin: 4px 0;
  padding: 0 !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-menu.el-menu--collapse :deep(.el-menu-item .el-icon) {
  margin-right: 0 !important;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background-color: #f5f7fa;
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, #f6f4ff 0%, #ebe7ff 100%);
  color: #8e7dff;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #e4e7ed;
}

.back-btn {
  width: 100%;
  justify-content: flex-start;
  color: #606266;
}

.back-btn:hover {
  color: #8e7dff;
}

.admin-main {
  flex: 1;
  margin-left: 220px;
  transition: margin-left 0.3s ease;
  display: flex;
  flex-direction: column;
}

.admin-sidebar.collapsed + .admin-main {
  margin-left: 64px;
}

.admin-header {
  height: 64px;
  background: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-left {
  display: flex;
  align-items: center;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #606266;
}

.admin-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.admin-page-fade-enter-active,
.admin-page-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.admin-page-fade-enter-from,
.admin-page-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.sidebar-overlay {
  display: none;
}

@media (max-width: 768px) {
  .admin-sidebar {
    width: 220px;
  }

  .admin-sidebar.collapsed {
    width: 0;
    overflow: hidden;
  }

  .admin-main {
    margin-left: 0;
  }

  .admin-sidebar.collapsed + .admin-main {
    margin-left: 0;
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    top: 0;
    left: 220px;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 99;
  }

  .admin-content {
    padding: 16px;
  }

  .admin-header {
    padding: 0 16px;
  }
}
</style>
