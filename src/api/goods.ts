import request from '@/utils/request'
import type { GoodsListItem, GoodsDetail, PaginatedResponse, GoodsSearchParams, GoodsInput } from './types'

// 获取谷子列表
export function getGoodsList(params?: GoodsSearchParams) {
  return request.get<PaginatedResponse<GoodsListItem>>('/api/goods/', { params })
}

// 获取谷子详情
export function getGoodsDetail(id: string) {
  return request.get<GoodsDetail>(`/api/goods/${id}/`)
}

// 创建谷子（主数据 JSON）
export function createGoods(data: GoodsInput) {
  return request.post<GoodsDetail>('/api/goods/', data)
}

// 更新谷子（主数据 JSON）
export function updateGoods(id: string, data: GoodsInput) {
  return request.put<GoodsDetail>(`/api/goods/${id}/`, data)
}

// 上传或更新主图
export function uploadMainPhoto(id: string, file: File) {
  const formData = new FormData()
  formData.append('main_photo', file)
  return request.post<GoodsDetail>(`/api/goods/${id}/upload-main-photo/`, formData)
}

// 删除谷子
export function deleteGoods(id: string) {
  return request.delete(`/api/goods/${id}/`)
}

