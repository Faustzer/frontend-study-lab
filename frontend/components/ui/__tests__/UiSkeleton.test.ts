import UiSkeleton from '../UiSkeleton.vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

describe('uiSkeleton', () => {
  it('renders with default props', () => {
    const wrapper = mount(UiSkeleton)
    const el = wrapper.find('.ui-skeleton')
    expect(el.exists()).toBe(true)
    expect(el.classes()).toContain('ui-skeleton--text')
  })

  it('is hidden from assistive technology', () => {
    const wrapper = mount(UiSkeleton)
    expect(wrapper.find('.ui-skeleton').attributes('aria-hidden')).toBe('true')
  })

  it('applies variant class', () => {
    const wrapper = mount(UiSkeleton, {
      props: { variant: 'circle' },
    })
    expect(wrapper.find('.ui-skeleton').classes()).toContain('ui-skeleton--circle')
  })

  it('applies width and height styles', () => {
    const wrapper = mount(UiSkeleton, {
      props: { width: '120px', height: '40px' },
    })
    const style = wrapper.find('.ui-skeleton').attributes('style')
    expect(style).toContain('width: 120px')
    expect(style).toContain('height: 40px')
  })

  it('defaults width to 100%', () => {
    const wrapper = mount(UiSkeleton)
    expect(wrapper.find('.ui-skeleton').attributes('style')).toContain('width: 100%')
  })
})
