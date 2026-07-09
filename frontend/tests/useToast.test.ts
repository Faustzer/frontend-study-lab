import { useToast } from '@/composables/useToast'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * composable useToast tests
 *
 * Note: `toasts`/`nextId` in useToast.ts are module-level singletons,
 * so the toast list is cleared before each test to isolate them from each other.
 */
describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    const { toasts } = useToast()
    toasts.value.splice(0, toasts.value.length)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a toast with the given message and type', () => {
    const { toasts, add } = useToast()

    add('Hello world', 'success')

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('Hello world')
    expect(toasts.value[0].type).toBe('success')
  })

  it('defaults to type info when none is provided', () => {
    const { toasts, add } = useToast()

    add('Default type message')

    expect(toasts.value[0].type).toBe('info')
  })

  it('assigns each toast a unique, incrementing id', () => {
    const { toasts, add } = useToast()

    add('First')
    add('Second')

    expect(toasts.value[0].id).not.toBe(toasts.value[1].id)
  })

  it('auto-hides a toast after the default duration', () => {
    const { toasts, add } = useToast()

    add('Auto hide me')
    expect(toasts.value).toHaveLength(1)

    vi.advanceTimersByTime(2999)
    expect(toasts.value).toHaveLength(1)

    vi.advanceTimersByTime(1)
    expect(toasts.value).toHaveLength(0)
  })

  it('auto-hides a toast after a custom duration', () => {
    const { toasts, add } = useToast()

    add('Custom duration', 'info', 1000)

    vi.advanceTimersByTime(999)
    expect(toasts.value).toHaveLength(1)

    vi.advanceTimersByTime(1)
    expect(toasts.value).toHaveLength(0)
  })

  it('handles multiple toasts at once, each hiding independently', () => {
    const { toasts, add } = useToast()

    add('Short', 'info', 1000)
    add('Long', 'info', 3000)

    expect(toasts.value).toHaveLength(2)

    vi.advanceTimersByTime(1000)
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('Long')

    vi.advanceTimersByTime(2000)
    expect(toasts.value).toHaveLength(0)
  })

  it('allows manually closing a toast before its timer expires', () => {
    const { toasts, add } = useToast()

    add('Manual close', 'info', 3000)
    const id = toasts.value[0].id

    const index = toasts.value.findIndex(t => t.id === id)
    toasts.value.splice(index, 1)

    expect(toasts.value).toHaveLength(0)

    // The pending auto-hide timer should be a no-op once the toast is already removed.
    vi.advanceTimersByTime(3000)
    expect(toasts.value).toHaveLength(0)
  })

  it('manually closing one toast does not affect others', () => {
    const { toasts, add } = useToast()

    add('Keep me', 'info', 3000)
    add('Remove me', 'info', 3000)
    const removeId = toasts.value[1].id

    const index = toasts.value.findIndex(t => t.id === removeId)
    toasts.value.splice(index, 1)

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('Keep me')
  })

  describe('success/error/info helpers', () => {
    it('success() adds a toast with type success', () => {
      const { toasts, success } = useToast()

      success('It worked')

      expect(toasts.value[0].type).toBe('success')
      expect(toasts.value[0].message).toBe('It worked')
    })

    it('error() adds a toast with type error', () => {
      const { toasts, error } = useToast()

      error('It failed')

      expect(toasts.value[0].type).toBe('error')
      expect(toasts.value[0].message).toBe('It failed')
    })

    it('info() adds a toast with type info', () => {
      const { toasts, info } = useToast()

      info('FYI')

      expect(toasts.value[0].type).toBe('info')
      expect(toasts.value[0].message).toBe('FYI')
    })

    it('passes a custom duration through to the underlying timer', () => {
      const { toasts, success } = useToast()

      success('Quick success', 500)

      vi.advanceTimersByTime(499)
      expect(toasts.value).toHaveLength(1)

      vi.advanceTimersByTime(1)
      expect(toasts.value).toHaveLength(0)
    })
  })
})
