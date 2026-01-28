import request from '@/utils/request'
import type {
  PaginatedShowcaseResponse,
  Showcase,
  ShowcaseListParams,
  ShowcaseCreateInput,
  ShowcaseUpdateInput,
  ShowcaseGoods,
  ShowcaseAddGoodsInput,
  ShowcaseRemoveGoodsInput,
  ShowcaseMoveGoodsInput,
  ShowcaseMoveGoodsResponse,
} from './types'

// ==================== 展柜（Showcase）CRUD ====================

export function getShowcaseList(params?: ShowcaseListParams) {
  return request.get<PaginatedShowcaseResponse>('/api/showcases/', { params })
}

export function getShowcaseDetail(id: string) {
  return request.get<Showcase>(`/api/showcases/${id}/`)
}

export function createShowcase(data: ShowcaseCreateInput | FormData) {
  return request.post<Showcase>('/api/showcases/', data)
}

export function patchShowcase(id: string, data: ShowcaseUpdateInput | FormData) {
  return request.patch<Showcase>(`/api/showcases/${id}/`, data)
}

export function deleteShowcase(id: string) {
  return request.delete(`/api/showcases/${id}/`)
}

// ==================== 展柜内谷子管理 ====================

export function getShowcaseGoods(showcaseId: string, params?: { category_id?: string }) {
  return request.get<ShowcaseGoods[]>(`/api/showcases/${showcaseId}/goods/`, { params })
}

export function addGoodsToShowcase(showcaseId: string, data: ShowcaseAddGoodsInput) {
  return request.post<ShowcaseGoods>(`/api/showcases/${showcaseId}/add-goods/`, data)
}

export function removeGoodsFromShowcase(showcaseId: string, data: ShowcaseRemoveGoodsInput) {
  return request.post<{ detail: string }>(`/api/showcases/${showcaseId}/remove-goods/`, data)
}

export function moveShowcaseGoods(showcaseId: string, data: ShowcaseMoveGoodsInput) {
  return request.post<ShowcaseMoveGoodsResponse>(`/api/showcases/${showcaseId}/move-goods/`, data)
}

