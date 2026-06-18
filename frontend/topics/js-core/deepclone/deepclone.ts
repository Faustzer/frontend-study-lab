type CloneCache = WeakMap<object, unknown>

function isObject(value: unknown): value is object {
  return value !== null && typeof value === 'object'
}

export function deepClone<T>(value: T, cache: CloneCache = new WeakMap()): T {
  if (!isObject(value)) {
    return value
  }

  if (cache.has(value)) {
    return cache.get(value) as T
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as T
  }

  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as T
  }

  if (Array.isArray(value)) {
    const result: unknown[] = []
    cache.set(value, result)

    value.forEach((item, index) => {
      result[index] = deepClone(item, cache)
    })

    return result as T
  }

  const result = Object.create(Object.getPrototypeOf(value)) as Record<PropertyKey, unknown>
  cache.set(value, result)

  Reflect.ownKeys(value).forEach((key) => {
    result[key] = deepClone((value as Record<PropertyKey, unknown>)[key], cache)
  })

  return result as T
}
