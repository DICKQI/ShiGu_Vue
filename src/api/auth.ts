import request from '@/utils/request'
import type { AuthTokenResponse, UserInfo } from './types'

/** 注册（创建用户并返回 Token） */
export function register(data: { username: string; password: string }) {
  return request.post<AuthTokenResponse>('/api/auth/register/', data)
}

/** 登录（返回 Token） */
export function login(data: { username: string; password: string }) {
  return request.post<AuthTokenResponse>('/api/auth/login/', data)
}

/** 获取当前登录用户信息（需携带 Token） */
export function getCurrentUser() {
  return request.get<UserInfo>('/api/auth/me/')
}

/** 登出（需携带 Token，成功后前端清除本地 Token） */
export function logout() {
  return request.delete('/api/auth/logout/')
}
