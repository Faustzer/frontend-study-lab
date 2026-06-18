export function throttle<F extends (...args: any[]) => any>(fn: F, delay: number) {
  let shouldWait = false

  return function (...args: Parameters<F>): void {
    if (!shouldWait) {
      fn(...args)
      shouldWait = true

      setTimeout(() => {
        shouldWait = false
      }, delay)
    }
  }
}
