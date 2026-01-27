import request from '@/utils/request'
import type {
  GoodsListItem,
  GoodsDetail,
  PaginatedResponse,
  GoodsSearchParams,
  GoodsInput,
  MoveGoodsResponse,
  GoodsStatsParams,
  GoodsStatsResponse,
} from './types'

// 获取谷子列表
export function getGoodsList(params?: GoodsSearchParams) {
  return request.get<PaginatedResponse<GoodsListItem>>('/api/goods/', { params })
}

// 获取谷子统计图表数据（Dashboard）
export function getGoodsStats(params?: GoodsStatsParams) {
  return request.get<GoodsStatsResponse>('/api/goods/stats/', { params })
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

// 上传或更新附加图片
export function uploadAdditionalPhotos(
  id: string,
  files?: File[],
  options?: {
    photoIds?: number[]
    label?: string
  }
) {
  const formData = new FormData()
  // 添加多个文件（可选，只更新标签时不需要）
  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append('additional_photos', file)
    })
  }
  // 如果提供了 photoIds，用于更新已有图片
  if (options?.photoIds && options.photoIds.length > 0) {
    options.photoIds.forEach((photoId) => {
      formData.append('photo_ids', photoId.toString())
    })
  }
  // 如果提供了 label，为本次操作的所有图片添加标签
  if (options?.label !== undefined) {
    formData.append('label', options.label)
  }
  return request.post<GoodsDetail>(`/api/goods/${id}/upload-additional-photos/`, formData)
}

// 只更新附加图片的标签（不修改图片文件）
export function updateAdditionalPhotoLabel(
  id: string,
  photoIds: number[],
  label?: string
) {
  return uploadAdditionalPhotos(id, undefined, {
    photoIds,
    label: label || '',
  })
}

// 删除单张附加图片
export function deleteAdditionalPhoto(goodsId: string, photoId: number) {
  return request.delete<GoodsDetail>(`/api/goods/${goodsId}/additional-photos/${photoId}/`)
}

// 批量删除附加图片
export function deleteAdditionalPhotos(goodsId: string, photoIds: number[]) {
  const photoIdsStr = photoIds.join(',')
  return request.delete<GoodsDetail>(`/api/goods/${goodsId}/additional-photos/`, {
    params: { photo_ids: photoIdsStr },
  })
}

// 删除谷子
export function deleteGoods(id: string) {
  return request.delete(`/api/goods/${id}/`)
}

// 移动谷子排序（支持跨页锚点）
export function moveGoods(
  id: string,
  data: {
    anchor_id: string
    position: 'before' | 'after'
  },
) {
  return request.post<MoveGoodsResponse>(`/api/goods/${id}/move/`, data)
}
