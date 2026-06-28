import { ref } from 'vue'

export interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

const toasts = ref<Toast[]>([])
let nextId = 0

const DEFAULT_DURATION = 3000

/**
 * Composable for toast notifications.
 *
 * Usage:
 * ```ts
 * const { success, error, info } = useToast()
 * success('Module completed!')
 * error('Something went wrong')
 * info('Syncing with server...')
 * ```
 */
export function useToast() {
  function add(message: string, type: Toast['type'] = 'info', duration = DEFAULT_DURATION) {
    const id = nextId++
    toasts.value.push({ id, message, type })

    setTimeout(() => {
      const index = toasts.value.findIndex(t => t.id === id)
      if (index !== -1) {
        toasts.value.splice(index, 1)
      }
    }, duration)
  }

  function success(message: string, duration?: number) {
    add(message, 'success', duration)
  }

  function error(message: string, duration?: number) {
    add(message, 'error', duration)
  }

  function info(message: string, duration?: number) {
    add(message, 'info', duration)
  }

  return { toasts, add, success, error, info }
}
