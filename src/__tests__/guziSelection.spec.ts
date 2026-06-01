import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useGuziStore } from '@/stores/guzi'
import { getGoodsList } from '@/api/goods'
import type { GoodsListItem, PaginatedResponse } from '@/api/types'

vi.mock('@/api/goods', () => ({
  getGoodsList: vi.fn(),
  getGoodsDetail: vi.fn(),
  getSimilarRandomGoodsList: vi.fn(),
}))

const createGoods = (id: string, name = `谷子 ${id}`): GoodsListItem => ({
  id,
  name,
  ip: { id: 1, name: '测试 IP' },
  characters: [{ id: 1, name: '角色', ip: { id: 1, name: '测试 IP' }, gender: 'other' }],
  category: { id: 1, name: '吧唧', parent: null, path_name: '吧唧', order: 1 },
  location_path: '柜子/第一层',
  main_photo: `https://example.com/${id}.jpg`,
  status: 'in_cabinet',
  quantity: 1,
  is_official: true,
})

const paginated = (results: GoodsListItem[]): PaginatedResponse<GoodsListItem> => ({
  count: results.length,
  page: 1,
  page_size: 18,
  next: null,
  previous: null,
  results,
})

describe('guzi selection store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getGoodsList).mockReset()
  })

  it('keeps selected goods in the order they were selected', () => {
    const store = useGuziStore()
    const first = createGoods('first')
    const second = createGoods('second')

    store.enterSelectionMode()
    store.toggleGoodsSelection(first)
    store.toggleGoodsSelection(second)

    expect(store.selectionMode).toBe(true)
    expect(store.selectedGoodsIds).toEqual(['first', 'second'])
    expect(store.selectedGoodsList.map((goods) => goods.id)).toEqual(['first', 'second'])
    expect(store.selectedGoodsCount).toBe(2)
  })

  it('does not clear selection when searching with new results', async () => {
    const store = useGuziStore()
    const selected = createGoods('selected')
    const searched = createGoods('searched')
    vi.mocked(getGoodsList).mockResolvedValueOnce(paginated([searched]))

    store.enterSelectionMode()
    store.toggleGoodsSelection(selected)
    await store.searchGuziImmediate({ search: '新搜索' })

    expect(store.selectionMode).toBe(true)
    expect(store.guziList.map((goods) => goods.id)).toEqual(['searched'])
    expect(store.selectedGoodsList.map((goods) => goods.id)).toEqual(['selected'])
  })

  it('clears selection when exiting selection mode with clear enabled', () => {
    const store = useGuziStore()

    store.enterSelectionMode()
    store.toggleGoodsSelection(createGoods('selected'))
    store.exitSelectionMode(true)

    expect(store.selectionMode).toBe(false)
    expect(store.selectedGoodsCount).toBe(0)
  })

  it('removes a single selected goods item', () => {
    const store = useGuziStore()

    store.toggleGoodsSelection(createGoods('first'))
    store.toggleGoodsSelection(createGoods('second'))
    store.removeGoodsSelection('first')

    expect(store.selectedGoodsIds).toEqual(['second'])
    expect(store.isGoodsSelected('first')).toBe(false)
    expect(store.isGoodsSelected('second')).toBe(true)
  })
})
