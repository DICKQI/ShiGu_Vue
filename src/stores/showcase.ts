import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  PaginatedShowcaseResponse,
  Showcase,
  ShowcaseGoods,
  ShowcaseMoveGoodsInput,
} from '@/api/types'
import {
  addGoodsToShowcase,
  createShowcase,
  deleteShowcase,
  getShowcaseDetail,
  getShowcaseList,
  moveShowcaseGoods,
  patchShowcase,
  removeGoodsFromShowcase,
} from '@/api/showcase'

export const useShowcaseStore = defineStore('showcase', () => {
  // 列表加载中
  const listLoading = ref(false)
  // 详情加载中
  const detailLoading = ref(false)
  // 增删改等写操作中
  const mutating = ref(false)

  // 向外仍暴露一个聚合后的 loading，兼容旧用法
  const loading = computed(() => listLoading.value || detailLoading.value || mutating.value)
  const error = ref<string | null>(null)
  // 写操作专用提示（避免污染列表/详情的 error 展示）
  const mutationStatus = ref<number | null>(null)
  const mutationMessage = ref<string | null>(null)

  const list = ref<Showcase[]>([])
  const pagination = ref<PaginatedShowcaseResponse>({
    count: 0,
    page: 1,
    page_size: 20,
    next: null,
    previous: null,
    results: [],
  })

  const activeShowcaseId = ref<string | null>(null)
  const activeShowcase = ref<Showcase | null>(null)

  const showcaseGoods = computed<ShowcaseGoods[]>(() => activeShowcase.value?.showcase_goods || [])

  const sortedShowcaseGoods = computed<ShowcaseGoods[]>(() => {
    // 保持后端 order（越小越靠前）；没有 order 时按 0 处理
    return [...showcaseGoods.value].slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  })

  const fetchList = async (opts?: { page?: number; page_size?: number }) => {
    if (listLoading.value) return
    listLoading.value = true
    error.value = null
    try {
      const page = opts?.page ?? pagination.value.page
      const page_size = opts?.page_size ?? pagination.value.page_size
      const data = await getShowcaseList({ page, page_size })
      pagination.value = data
      list.value = data.results || []
      if (!activeShowcaseId.value && list.value.length) {
        activeShowcaseId.value = list.value[0]?.id ?? null
      }
    } catch (e: any) {
      error.value = e?.message || '加载展柜列表失败'
      list.value = []
    } finally {
      listLoading.value = false
    }
  }

  const fetchDetail = async (id?: string) => {
    const targetId = id ?? activeShowcaseId.value
    if (!targetId) return
    if (detailLoading.value) return
    detailLoading.value = true
    error.value = null
    try {
      const data = await getShowcaseDetail(targetId)
      activeShowcaseId.value = data.id
      activeShowcase.value = data
    } catch (e: any) {
      error.value = e?.message || '加载展柜详情失败'
      activeShowcase.value = null
    } finally {
      detailLoading.value = false
    }
  }

  const setActive = async (id: string) => {
    if (activeShowcaseId.value === id && activeShowcase.value) return
    activeShowcaseId.value = id
    await fetchDetail(id)
  }

  const createOne = async (payload: { name: string; description?: string | null; is_public?: boolean }) => {
    if (mutating.value) return null
    mutating.value = true
    error.value = null
    mutationStatus.value = null
    mutationMessage.value = null
    try {
      const created = await createShowcase(payload)
      // 重新拉列表，确保分页/排序一致
      await fetchList({ page: 1, page_size: pagination.value.page_size })
      activeShowcaseId.value = created.id
      await fetchDetail(created.id)
      return created
    } catch (e: any) {
      error.value = e?.message || '创建展柜失败'
      return null
    } finally {
      mutating.value = false
    }
  }

  const updateOne = async (id: string, payload: { name?: string; description?: string | null; is_public?: boolean }) => {
    if (mutating.value) return null
    mutating.value = true
    error.value = null
    mutationStatus.value = null
    mutationMessage.value = null
    try {
      const updated = await patchShowcase(id, payload)
      // 本地合并
      activeShowcase.value = updated
      list.value = list.value.map((s) => (s.id === id ? { ...s, ...updated } : s))
      return updated
    } catch (e: any) {
      error.value = e?.message || '更新展柜失败'
      return null
    } finally {
      mutating.value = false
    }
  }

  const removeOne = async (id: string) => {
    if (mutating.value) return false
    mutating.value = true
    error.value = null
    mutationStatus.value = null
    mutationMessage.value = null
    try {
      await deleteShowcase(id)
      // 刷新列表与选中
      await fetchList({ page: pagination.value.page, page_size: pagination.value.page_size })
      if (activeShowcaseId.value === id) {
        activeShowcaseId.value = list.value[0]?.id ?? null
        activeShowcase.value = null
        if (activeShowcaseId.value) await fetchDetail(activeShowcaseId.value)
      }
      return true
    } catch (e: any) {
      error.value = e?.message || '删除展柜失败'
      return false
    } finally {
      mutating.value = false
    }
  }

  const addGoods = async (payload: { showcaseId: string; goodsId: string; categoryId?: string; notes?: string }) => {
    if (mutating.value) return null
    mutating.value = true
    error.value = null
    mutationStatus.value = null
    mutationMessage.value = null
    try {
      const created = await addGoodsToShowcase(payload.showcaseId, {
        goods_id: payload.goodsId,
        // 云展柜不再使用分类功能，统一不传 category_id
        notes: payload.notes,
      })
      await fetchDetail(payload.showcaseId)
      return created
    } catch (e: any) {
      const status = e?.response?.status ?? null
      const detail = e?.response?.data?.detail
      mutationStatus.value = status
      mutationMessage.value = typeof detail === 'string' && detail.trim() ? detail.trim() : null

      // 400 多为“已在展柜中/校验失败”，不应污染左侧列表的全局 error 展示
      if (status === 400) {
        return null
      }

      error.value = mutationMessage.value || e?.message || '添加谷子到展柜失败'
      return null
    } finally {
      mutating.value = false
    }
  }

  const removeGoods = async (payload: { showcaseId: string; goodsId: string }) => {
    if (mutating.value) return false
    mutating.value = true
    error.value = null
    mutationStatus.value = null
    mutationMessage.value = null
    try {
      await removeGoodsFromShowcase(payload.showcaseId, { goods_id: payload.goodsId })
      await fetchDetail(payload.showcaseId)
      return true
    } catch (e: any) {
      const status = e?.response?.status ?? null
      const detail = e?.response?.data?.detail
      mutationStatus.value = status
      mutationMessage.value = typeof detail === 'string' && detail.trim() ? detail.trim() : null
      error.value = mutationMessage.value || e?.message || '从展柜移除谷子失败'
      return false
    } finally {
      mutating.value = false
    }
  }

  const moveGoods = async (showcaseId: string, data: ShowcaseMoveGoodsInput) => {
    if (mutating.value) return null
    mutating.value = true
    error.value = null
    mutationStatus.value = null
    mutationMessage.value = null
    try {
      const res = await moveShowcaseGoods(showcaseId, data)
      await fetchDetail(showcaseId)
      return res
    } catch (e: any) {
      const status = e?.response?.status ?? null
      const detail = e?.response?.data?.detail
      mutationStatus.value = status
      mutationMessage.value = typeof detail === 'string' && detail.trim() ? detail.trim() : null
      error.value = mutationMessage.value || e?.message || '移动展柜谷子失败'
      return null
    } finally {
      mutating.value = false
    }
  }

  return {
    // 细分 loading，便于组件按需展示骨架/禁用按钮
    listLoading,
    detailLoading,
    mutating,
    // 聚合 loading，兼容旧逻辑
    loading,
    error,
    mutationStatus,
    mutationMessage,
    list,
    pagination,
    activeShowcaseId,
    activeShowcase,
    showcaseGoods,
    sortedShowcaseGoods,
    fetchList,
    fetchDetail,
    setActive,
    createOne,
    updateOne,
    removeOne,
    addGoods,
    removeGoods,
    moveGoods,
  }
})

