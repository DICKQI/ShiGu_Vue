import request from '@/utils/request'
import type { IP, Character, Category } from './types'

// ==================== IP作品 CRUD ====================

// 获取所有IP列表
export function getIPList(params?: {
  name?: string
  search?: string
  subject_type?: number
  subject_type__in?: string
}) {
  return request.get<IP[]>('/api/ips/', { params })
}

// 获取IP详情
export function getIPDetail(id: number) {
  return request.get<IP>(`/api/ips/${id}/`)
}

// 创建IP
export function createIP(data: { name: string; keywords?: string[]; subject_type?: number | null }) {
  return request.post<IP>('/api/ips/', data)
}

// 更新IP
export function updateIP(id: number, data: { name: string; keywords?: string[]; subject_type?: number | null }) {
  return request.put<IP>(`/api/ips/${id}/`, data)
}

// 部分更新IP
export function patchIP(id: number, data: Partial<{ name: string; keywords?: string[]; subject_type?: number | null }>) {
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

// 获取所有品类列表（扁平），支持父级筛选
export function getCategoryList(params?: { name?: string; search?: string; parent?: number; parent__isnull?: boolean }) {
  return request.get<Category[]>('/api/categories/', { params })
}

// 获取品类树（扁平列表，前端自行组装 children）
export function getCategoryTree() {
  return request.get<Category[]>('/api/categories/tree/')
}

// 获取品类详情
export function getCategoryDetail(id: number) {
  return request.get<Category>(`/api/categories/${id}/`)
}

// 创建品类
export function createCategory(data: { name: string; parent?: number | null; color_tag?: string | null; order?: number }) {
  return request.post<Category>('/api/categories/', data)
}

// 更新品类
export function updateCategory(id: number, data: { name: string; parent?: number | null; color_tag?: string | null; order?: number }) {
  return request.put<Category>(`/api/categories/${id}/`, data)
}

// 部分更新品类
export function patchCategory(id: number, data: Partial<{ name: string; parent?: number | null; color_tag?: string | null; order?: number }>) {
  return request.patch<Category>(`/api/categories/${id}/`, data)
}

// 删除品类
export function deleteCategory(id: number) {
  return request.delete(`/api/categories/${id}/`)
}

// 批量更新品类排序
export function batchUpdateCategoryOrder(items: { id: number; order: number }[]) {
  return request.post<{
    detail: string
    updated_count: number
    categories: Category[]
  }>('/api/categories/batch-update-order/', {
    items,
  })
}

// ==================== 主题 CRUD ====================

import type { Theme } from './types'

// 获取所有主题列表
export function getThemeList(params?: { name?: string; search?: string }) {
  return request.get<Theme[]>('/api/themes/', { params })
}

// 获取主题详情
export function getThemeDetail(id: number) {
  return request.get<Theme>(`/api/themes/${id}/`)
}

// 创建主题
export function createTheme(data: { name: string; description?: string | null }) {
  return request.post<Theme>('/api/themes/', data)
}

// 更新主题
export function updateTheme(id: number, data: { name: string; description?: string | null }) {
  return request.put<Theme>(`/api/themes/${id}/`, data)
}

// 部分更新主题
export function patchTheme(id: number, data: Partial<{ name: string; description?: string | null }>) {
  return request.patch<Theme>(`/api/themes/${id}/`, data)
}

// 删除主题
export function deleteTheme(id: number) {
  return request.delete(`/api/themes/${id}/`)
}

// ==================== BGM角色导入 ====================

import type {
  BGMSearchResponse,
  BGMCreateCharactersResponse,
  BGMCreateCharacterItem,
  BGMSearchSubjectsResponse,
  BGMGetCharactersResponse
} from './types'

// 搜索BGM IP作品列表
export function searchBGMSubjects(keyword: string, subjectType?: number) {
  return request.post<BGMSearchSubjectsResponse>('/api/bgm/search-subjects/', {
    keyword,
    ...(subjectType !== undefined && { subject_type: subjectType }),
  })
}

// 根据BGM作品ID获取角色列表
export function getBGMCharactersBySubjectId(subjectId: number) {
  return request.post<BGMGetCharactersResponse>('/api/bgm/get-characters-by-id/', {
    subject_id: subjectId,
  })
}

// 搜索BGM IP作品并获取角色列表
export function searchBGMCharacters(ipName: string, subjectType?: number) {
  return request.post<BGMSearchResponse>('/api/bgm/search-characters/', {
    ip_name: ipName,
    ...(subjectType !== undefined && { subject_type: subjectType }),
  })
}

// 批量创建IP和角色
export function createBGMCharacters(characters: BGMCreateCharacterItem[], subjectType?: number | null) {
  // 根据API文档，subject_type应该在每个character项中传递
  const charactersWithType = subjectType !== undefined && subjectType !== null
    ? characters.map(char => ({ ...char, subject_type: subjectType }))
    : characters
  return request.post<BGMCreateCharactersResponse>('/api/bgm/create-characters/', {
    characters: charactersWithType,
  })
}

