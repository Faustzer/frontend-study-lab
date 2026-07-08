function isObject(value: unknown): value is Record<PropertyKey, unknown> {
  return value !== null && typeof value === 'object'
}

export function deepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true
  }

  if (!isObject(left) || !isObject(right)) {
    return false
  }

  const leftKeys = Reflect.ownKeys(left)
  const rightKeys = Reflect.ownKeys(right)

  if (leftKeys.length !== rightKeys.length) {
    return false
  }

  return leftKeys.every((key) => {
    return Object.hasOwn(right, key)
      && deepEqual(left[key], right[key])
  })
}
