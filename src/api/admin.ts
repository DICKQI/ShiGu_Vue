import request from '@/utils/request'
import type { PaginatedResponse } from './types'

export interface AdminUser {
  id: number
  username: string
  role: {
    id: number
    name: string
    created_at: string
  }
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AdminRole {
  id: number
  name: string
  created_at: string
}

export interface AdminUserListParams {
  page?: number
  page_size?: number
}

export interface CreateAdminUserData {
  username: string
  password: string
  role_id: number
}

export interface UpdateAdminUserData {
  role_id?: number
  is_active?: boolean
  password?: string
}

export function getAdminUsers(params?: AdminUserListParams) {
  return request.get<PaginatedResponse<AdminUser>>('/api/admin/users/', { params })
}

export function getAdminUserDetail(id: number) {
  return request.get<AdminUser>(`/api/admin/users/${id}/`)
}

export function createAdminUser(data: CreateAdminUserData) {
  return request.post<AdminUser>('/api/admin/users/', data)
}

export function updateAdminUser(id: number, data: UpdateAdminUserData) {
  return request.patch<AdminUser>(`/api/admin/users/${id}/`, data)
}

export function getAdminRoles() {
  return request.get<AdminRole[]>('/api/admin/roles/')
}
