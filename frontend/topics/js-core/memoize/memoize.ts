type AnyFunction = (..._args: any[]) => any

export function memoize<F extends AnyFunction>(fn: F): F {
  const cache = new Map<string, ReturnType<F>>()

  return function memoized(...args: Parameters<F>): ReturnType<F> {
    const cacheKey = JSON.stringify(args)

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey) as ReturnType<F>
    }

    const result = fn(...args)
    cache.set(cacheKey, result)

    return result
  } as F
}
