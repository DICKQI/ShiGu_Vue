<template>
  <nav class="mobile-bottom-nav">
    <div 
      v-for="item in navItems" 
      :key="item.path"
      class="nav-item"
      :class="{ active: isActive(item.path) }"
      @click="handleNavClick(item.path)"
    >
      <el-icon class="nav-icon">
        <component :is="item.icon" />
      </el-icon>
      <span class="nav-label">{{ item.label }}</span>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { Grid, FolderOpened, Collection, Box, Star } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

interface NavItem {
  path: string
  label: string
  icon: any
}

const navItems: NavItem[] = [
  {
    path: '/showcase',
    label: '云展柜',
    icon: Grid
  },
  {
    path: '/location',
    label: '位置管理',
    icon: FolderOpened
  },
  {
    path: '/ipcharacter',
    label: 'IP与角色',
    icon: Collection
  },
  {
    path: '/category',
    label: '品类管理',
    icon: Box
  },
  {
    path: '/theme',
    label: '主题管理',
    icon: Star
  }
]

const isActive = (path: string): boolean => {
  const currentPath = route.path
  if (path === '/showcase') {
    return currentPath.startsWith('/showcase')
  }
  if (path === '/location') {
    return currentPath.startsWith('/location')
  }
  if (path === '/ipcharacter') {
    return currentPath.startsWith('/ipcharacter') || currentPath.startsWith('/ip') || currentPath.startsWith('/character')
  }
  if (path === '/category') {
    return currentPath.startsWith('/category')
  }
  if (path === '/theme') {
    return currentPath.startsWith('/theme')
  }
  return false
}

const handleNavClick = (path: string) => {
  router.push(path)
}
</script>

<style scoped>
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  background-color: #FFFFFF;
  border-top: 1px solid #F5F5F7;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.04);
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
  z-index: 1000;
  height: calc(64px + env(safe-area-inset-bottom));
  overflow-x: hidden;
}

/* 兼容不支持 safe-area-inset-bottom 的环境 */
@supports not (padding-bottom: env(safe-area-inset-bottom)) {
  .mobile-bottom-nav {
    padding-bottom: 8px;
    height: 64px;
  }
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  outline: none;
}

.nav-item:active,
.nav-item:focus {
  transform: scale(0.95);
  opacity: 0.8;
  outline: none;
}

.nav-icon {
  font-size: 22px;
  transition: color 0.2s ease;
  color: #9ca3af;
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
  transition: color 0.2s ease;
  color: #9ca3af;
  line-height: 1.2;
  text-align: center;
}

.nav-item.active .nav-icon {
  color: #D4AF37;
}

.nav-item.active .nav-label {
  color: #D4AF37;
}

/* 选中状态的轻微动画效果 */
.nav-item.active {
  position: relative;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  top: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 2px;
  background-color: #D4AF37;
  border-radius: 2px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) scaleX(0);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) scaleX(1);
  }
}
</style>

