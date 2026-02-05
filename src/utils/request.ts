import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'

// API基础URL存储键名
const API_BASE_URL_KEY = 'pickgoods_api_base_url'
const LEGACY_API_BASE_URL_KEY = 'shigu_api_base_url'

// 认证 Token 存储键名（与 auth store 共用）
export const AUTH_TOKEN_KEY = 'pickgoods_access_token'

const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

const migrateLegacyBaseURLIfNeeded = (): void => {
  if (typeof window === 'undefined') return
  try {
    const current = localStorage.getItem(API_BASE_URL_KEY)
    if (current) return
    const legacy = localStorage.getItem(LEGACY_API_BASE_URL_KEY)
    if (!legacy) return
    localStorage.setItem(API_BASE_URL_KEY, legacy)
  } catch {
    // ignore storage errors (e.g. privacy mode)
  }
}

// 获取默认的API基础URL
const getDefaultBaseURL = (): string => {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8000`
  }
  return 'http://127.0.0.1:8000'
}

// 获取API基础URL（优先从localStorage读取，其次从环境变量，最后使用默认值）
const getBaseURL = (): string => {
  if (typeof window !== 'undefined') {
    migrateLegacyBaseURLIfNeeded()
    const savedURL = localStorage.getItem(API_BASE_URL_KEY) || localStorage.getItem(LEGACY_API_BASE_URL_KEY)
    if (savedURL) {
      return savedURL
    }
  }
  return import.meta.env.VITE_API_BASE_URL || getDefaultBaseURL()
}

// 创建axios实例
const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 每次请求时动态获取baseURL（支持运行时修改）
    if (typeof window !== 'undefined') {
      migrateLegacyBaseURLIfNeeded()
      const savedURL = localStorage.getItem(API_BASE_URL_KEY) || localStorage.getItem(LEGACY_API_BASE_URL_KEY)
      if (savedURL) {
        config.baseURL = savedURL
      } else {
        config.baseURL = import.meta.env.VITE_API_BASE_URL || getDefaultBaseURL()
      }
    }
    
    // 如果是FormData，让浏览器自动设置Content-Type（包含boundary）
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    
    const token = getAuthToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: any) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
axiosInstance.interceptors.response.use(
  <T = any>(response: AxiosResponse<T>) => {
    return response.data
  },
  (error: any) => {
    const status = error.response?.status
    // 处理 401：未认证，清除 Token 并跳转登录页
    if (status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        const redirect = encodeURIComponent(window.location.pathname + window.location.search)
        const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '') || ''
        const loginPath = base ? `${base}/login` : '/login'
        const fullPath = `${window.location.origin}${loginPath}?redirect=${redirect}`
        window.location.href = fullPath
      }
      return Promise.reject(error)
    }
    // 处理 403：无权限
    if (status === 403) {
      ElMessage.error('无权限访问')
      return Promise.reject(error)
    }
    // 处理限流错误
    if (status === 429) {
      ElMessage.warning('搜索太快了，请稍后再试')
      return Promise.reject(error)
    }
    // 处理其他错误
    const message = error.response?.data?.detail || error.message || '请求失败'
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

// 创建自定义请求接口，返回类型为 T 而不是 AxiosResponse<T>
interface CustomAxiosInstance {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>
  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>
}

const request = axiosInstance as unknown as CustomAxiosInstance

// 更新API基础URL的函数
export const updateBaseURL = (url: string): void => {
  if (typeof window !== 'undefined') {
    // 验证URL格式
    try {
      new URL(url)
      localStorage.setItem(API_BASE_URL_KEY, url)
      // 更新axios实例的baseURL
      axiosInstance.defaults.baseURL = url
    } catch (error) {
      throw new Error('无效的URL格式')
    }
  }
}

// 获取当前API基础URL的函数
export const getCurrentBaseURL = (): string => {
  return getBaseURL()
}

// 重置API基础URL为默认值的函数
export const resetBaseURL = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(API_BASE_URL_KEY)
    localStorage.removeItem(LEGACY_API_BASE_URL_KEY)
    const defaultURL = import.meta.env.VITE_API_BASE_URL || getDefaultBaseURL()
    axiosInstance.defaults.baseURL = defaultURL
  }
}

export default request

