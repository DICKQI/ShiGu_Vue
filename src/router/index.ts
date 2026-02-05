import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/showcase',
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: {
      title: '登录',
      public: true,
      hideTopNav: true,
      hideBottomNav: true,
    },
  },
  {
    path: '/showcase',
    name: 'CloudShowcase',
    component: () => import('@/views/CloudShowcase.vue'),
    meta: {
      title: '云展柜',
      requiresAuth: true,
    },
  },
  {
    path: '/location',
    name: 'Location',
    component: () => import('@/views/LocationManagement.vue'),
    meta: {
      title: '位置管理',
      requiresAuth: true,
    },
  },
  {
    path: '/ipcharacter',
    name: 'IPCharacterManagement',
    component: () => import('@/views/IPCharacterManagement.vue'),
    meta: {
      title: 'IP作品与角色管理',
      requiresAuth: true,
    },
  },
  // 兼容旧路径，重定向到新路径
  {
    path: '/ip',
    redirect: '/ipcharacter',
  },
  {
    path: '/character',
    redirect: '/ipcharacter',
  },
  {
    path: '/category',
    name: 'CategoryManagement',
    component: () => import('@/views/CategoryManagement.vue'),
    meta: {
      title: '品类管理',
      requiresAuth: true,
    },
  },
  {
    path: '/theme',
    name: 'ThemeManagement',
    component: () => import('@/views/ThemeManagement.vue'),
    meta: {
      title: '主题管理',
      requiresAuth: true,
    },
  },
  {
    path: '/goods/new',
    name: 'GoodsNew',
    component: () => import('@/views/GoodsForm.vue'),
    meta: {
      title: '新增谷子',
      requiresAuth: true,
    },
  },
  {
    path: '/goods/:id/edit',
    name: 'GoodsEdit',
    component: () => import('@/views/GoodsForm.vue'),
    meta: {
      title: '编辑谷子',
      requiresAuth: true,
    },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
    meta: {
      title: '设置',
      // 不要求登录，未登录也可进入设置页配置后端地址
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 拾谷 PickGoods` : '拾谷 PickGoods'

  const authStore = useAuthStore()
  await authStore.initFromStorage()

  const requiresAuth = to.meta.requiresAuth === true
  const isPublic = to.meta.public === true

  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }
  if (isPublic && authStore.isAuthenticated && to.name === 'Login') {
    const redirect = (to.query.redirect as string) || '/showcase'
    next(typeof redirect === 'string' ? redirect : '/showcase')
    return
  }
  next()
})

export default router
