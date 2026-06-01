import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App', () => {
  it('mounts renders properly', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          Layout: {
            template: '<main data-test="layout-root">拾谷 PickGoods</main>',
          },
        },
      },
    })

    expect(wrapper.find('[data-test="layout-root"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('拾谷 PickGoods')
  })
})
