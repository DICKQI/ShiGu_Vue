import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import GoodsCard from '@/components/GoodsCard.vue'
import type { GoodsListItem } from '@/api/types'

const goods: GoodsListItem = {
  id: 'goods-1',
  name: '测试谷子',
  ip: { id: 1, name: '测试 IP' },
  characters: [{ id: 1, name: '角色', ip: { id: 1, name: '测试 IP' }, gender: 'other' }],
  category: { id: 1, name: '亚克力', parent: null, path_name: '亚克力', order: 1 },
  location_path: '柜子/第一层',
  main_photo: null,
  status: 'in_cabinet',
  quantity: 1,
  is_official: true,
}

const mountCard = (props: Partial<InstanceType<typeof GoodsCard>['$props']> = {}) =>
  mount(GoodsCard, {
    props: {
      goods,
      ...props,
    },
    global: {
      stubs: {
        'el-icon': { template: '<i><slot /></i>' },
        'el-image': { template: '<div><slot name="error" /></div>' },
        WatermarkImage: true,
      },
    },
  })

describe('GoodsCard selection mode', () => {
  it('emits click in normal mode', async () => {
    const wrapper = mountCard()

    await wrapper.trigger('click')

    expect(wrapper.emitted('click')?.[0]).toEqual([goods])
    expect(wrapper.emitted('select')).toBeUndefined()
  })

  it('emits select instead of click in selection mode', async () => {
    const wrapper = mountCard({ selectable: true })

    await wrapper.trigger('click')

    expect(wrapper.emitted('select')?.[0]).toEqual([goods])
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('marks the card as selected', () => {
    const wrapper = mountCard({ selectable: true, selected: true })

    expect(wrapper.classes()).toContain('is-selectable')
    expect(wrapper.classes()).toContain('is-selected')
  })
})
