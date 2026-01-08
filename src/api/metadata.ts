import request from '@/utils/request'
import type { IP, Character, Category } from './types'

// ==================== IP作品 CRUD ====================

// 获取所有IP列表
export function getIPList(params?: { name?: string; search?: string }) {
  return request.get<IP[]>('/api/ips/', { params })
}

// 获取IP详情
export function getIPDetail(id: number) {
  return request.get<IP>(`/api/ips/${id}/`)
}

// 创建IP
export function createIP(data: { name: string; keywords?: string[] }) {
  return request.post<IP>('/api/ips/', data)
}

// 更新IP
export function updateIP(id: number, data: { name: string; keywords?: string[] }) {
  return request.put<IP>(`/api/ips/${id}/`, data)
}

// 部分更新IP
export function patchIP(id: number, data: Partial<{ name: string; keywords?: string[] }>) {
  return request.patch<IP>(`/api/ips/${id}/`, data)
}

// 删除IP
export function deleteIP(id: number) {
  return request.delete(`/api/ips/${id}/`)
}

// ==================== 角色 CRUD ====================

// 获取所有角色列表
export function getCharacterList(params?: { ip?: number; name?: string; search?: string }) {
  return request.get<Character[]>('/api/characters/', { params })
}

// 根据IP获取角色列表（通过 /api/characters/?ip=id）
export function getCharactersByIP(ipId: number) {
  return request.get<Character[]>(`/api/characters/?ip=${ipId}`)
}

// 获取IP下的所有角色（使用专用接口 /api/ips/{id}/characters/）
export function getIPCharacters(ipId: number) {
  return request.get<Character[]>(`/api/ips/${ipId}/characters/`)
}

// 获取角色详情
export function getCharacterDetail(id: number) {
  return request.get<Character>(`/api/characters/${id}/`)
}

// 创建角色
export function createCharacter(data: { name: string; ip_id: number; avatar?: string | null; gender?: 'male' | 'female' | 'other' } | FormData) {
  return request.post<Character>('/api/characters/', data)
}

// 更新角色
export function updateCharacter(id: number, data: { name: string; ip_id: number; avatar?: string | null; gender?: 'male' | 'female' | 'other' } | FormData) {
  return request.put<Character>(`/api/characters/${id}/`, data)
}

// 部分更新角色
export function patchCharacter(id: number, data: Partial<{ name: string; ip_id: number; avatar?: string | null; gender?: 'male' | 'female' | 'other' }>) {
  return request.patch<Character>(`/api/characters/${id}/`, data)
}

// 删除角色
export function deleteCharacter(id: number) {
  return request.delete(`/api/characters/${id}/`)
}

// ==================== 品类 CRUD ====================

// 获取所有品类列表
export function getCategoryList(params?: { name?: string; search?: string }) {
  return request.get<Category[]>('/api/categories/', { params })
}

// 获取品类详情
export function getCategoryDetail(id: number) {
  return request.get<Category>(`/api/categories/${id}/`)
}

// 创建品类
export function createCategory(data: { name: string }) {
  return request.post<Category>('/api/categories/', data)
}

// 更新品类
export function updateCategory(id: number, data: { name: string }) {
  return request.put<Category>(`/api/categories/${id}/`, data)
}

// 部分更新品类
export function patchCategory(id: number, data: Partial<{ name: string }>) {
  return request.patch<Category>(`/api/categories/${id}/`, data)
}

// 删除品类
export function deleteCategory(id: number) {
  return request.delete(`/api/categories/${id}/`)
}

// ==================== BGM角色导入 ====================

import type { BGMSearchResponse, BGMCreateCharactersResponse, BGMCreateCharacterItem } from './types'

// 搜索BGM IP作品并获取角色列表
export function searchBGMCharacters(ipName: string) {
  return request.post<BGMSearchResponse>('/api/bgm/search-characters/', {
    ip_name: ipName,
  })
}

// 批量创建IP和角色
export function createBGMCharacters(characters: BGMCreateCharacterItem[]) {
  return request.post<BGMCreateCharactersResponse>('/api/bgm/create-characters/', {
    characters,
  })
}

