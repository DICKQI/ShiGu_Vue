import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/showcase',
  },
  {
    path: '/showcase',
    name: 'CloudShowcase',
    component: () => import('@/views/CloudShowcase.vue'),
    meta: {
      title: '云展柜',
    },
  },
  {
    path: '/location',
    name: 'Location',
    component: () => import('@/views/LocationManagement.vue'),
    meta: {
      title: '位置管理',
    },
  },
  {
    path: '/ipcharacter',
    name: 'IPCharacterManagement',
    component: () => import('@/views/IPCharacterManagement.vue'),
    meta: {
      title: 'IP作品与角色管理',
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
    },
  },
  {
    path: '/theme',
    name: 'ThemeManagement',
    component: () => import('@/views/ThemeManagement.vue'),
    meta: {
      title: '主题管理',
    },
  },
  {
    path: '/goods/new',
    name: 'GoodsNew',
    component: () => import('@/views/GoodsForm.vue'),
    meta: {
      title: '新增谷子',
    },
  },
  {
    path: '/goods/:id/edit',
    name: 'GoodsEdit',
    component: () => import('@/views/GoodsForm.vue'),
    meta: {
      title: '编辑谷子',
    },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
    meta: {
      title: '设置',
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - 拾谷 PickGoods` : '拾谷 PickGoods'
  next()
})

export default router
