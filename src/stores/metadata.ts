import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getIPList, getIPCharacters, getCategoryList, getThemeList } from '@/api/metadata'
import type { IP, Character, Category, Theme } from '@/api/types'

const CACHE_KEYS = {
  IPS: 'metadata_ips',
  CHARACTERS_BY_IP: 'metadata_characters_by_ip', // 改为存储按IP分组的角色
  CATEGORIES: 'metadata_categories',
  THEMES: 'metadata_themes'
}

export const useMetadataStore = defineStore('metadata', () => {
  const ips = ref<IP[]>([])
  const charactersByIP = ref<Record<number, Character[]>>({}) // 使用 Map 结构存储
  const categories = ref<Category[]>([])
  const themes = ref<Theme[]>([])
  const loading = ref(false)

  // 初始化时从本地缓存加载
  const loadFromCache = () => {
    try {
      const cachedIps = localStorage.getItem(CACHE_KEYS.IPS)
      if (cachedIps) ips.value = JSON.parse(cachedIps)

      const cachedCharacters = localStorage.getItem(CACHE_KEYS.CHARACTERS_BY_IP)
      if (cachedCharacters) charactersByIP.value = JSON.parse(cachedCharacters)

      const cachedCategories = localStorage.getItem(CACHE_KEYS.CATEGORIES)
      if (cachedCategories) categories.value = JSON.parse(cachedCategories)

      const cachedThemes = localStorage.getItem(CACHE_KEYS.THEMES)
      if (cachedThemes) themes.value = JSON.parse(cachedThemes)
    } catch (e) {
      console.error('Failed to load metadata from cache', e)
    }
  }

  // 保存到本地缓存
  const saveToCache = (key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch (e) {
      console.error('Failed to save metadata to cache', e)
    }
  }

  const fetchIPs = async (force = false) => {
    if (!force && ips.value.length > 0) return ips.value
    try {
      const data = await getIPList()
      ips.value = data
      saveToCache(CACHE_KEYS.IPS, data)
      return data
    } catch (error) {
      console.error('Failed to fetch IPs', error)
      throw error
    }
  }

  // 按需获取指定 IP 的角色
  const fetchIPCharacters = async (ipId: number, force = false) => {
    // 如果非强制刷新，且内存中已有该IP的角色数据，直接返回
    if (!force && charactersByIP.value[ipId]) return charactersByIP.value[ipId]
    
    try {
      // 使用特定接口获取该IP的角色
      const data = await getIPCharacters(ipId)
      
      // 更新状态
      charactersByIP.value = {
        ...charactersByIP.value,
        [ipId]: data
      }
      
      // 更新本地缓存
      saveToCache(CACHE_KEYS.CHARACTERS_BY_IP, charactersByIP.value)
      return data
    } catch (error) {
      console.error(`Failed to fetch Characters for IP ${ipId}`, error)
      throw error
    }
  }

  const fetchCategories = async (force = false) => {
    if (!force && categories.value.length > 0) return categories.value
    try {
      const data = await getCategoryList()
      categories.value = data
      saveToCache(CACHE_KEYS.CATEGORIES, data)
      return data
    } catch (error) {
      console.error('Failed to fetch Categories', error)
      throw error
    }
  }

  const fetchThemes = async (force = false) => {
    if (!force && themes.value.length > 0) return themes.value
    try {
      const data = await getThemeList()
      themes.value = data
      saveToCache(CACHE_KEYS.THEMES, data)
      return data
    } catch (error) {
      console.error('Failed to fetch Themes', error)
      throw error
    }
  }

  const fetchAll = async (force = false) => {
    loading.value = true
    try {
      await Promise.all([
        fetchIPs(force),
        // fetchCharacters(force), // 不再预加载所有角色
        fetchCategories(force),
        fetchThemes(force)
      ])
    } finally {
      loading.value = false
    }
  }

  const clearCache = () => {
    ips.value = []
    charactersByIP.value = {}
    categories.value = []
    themes.value = []
    
    localStorage.removeItem(CACHE_KEYS.IPS)
    localStorage.removeItem(CACHE_KEYS.CHARACTERS_BY_IP)
    localStorage.removeItem(CACHE_KEYS.CATEGORIES)
    localStorage.removeItem(CACHE_KEYS.THEMES)
  }

  // 自动加载缓存
  loadFromCache()

  return {
    ips,
    charactersByIP,
    categories,
    themes,
    loading,
    fetchIPs,
    fetchIPCharacters,
    fetchCategories,
    fetchThemes,
    fetchAll,
    clearCache
  }
})
