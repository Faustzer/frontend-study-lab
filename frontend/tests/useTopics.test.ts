import type { TopicCategory, TopicItem } from '@/types/topic'
import type { CategoryMeta, ModuleMeta } from '@/types/meta'
import type { RouteRecordRaw } from 'vue-router'
import {
  buildCategory,
  buildRoutes,
  buildTopicItem,
  calculateXp,
  categoryFromPath,
  createFallbackCategory,
  extractMeta,
  humanize,
  slugify,
  sortCategories,
} from '@/helpers/useTopics'
import { mockTopicCategories, mockTopicItems } from '@/mocks/topics'
import { describe, expect, it } from 'vitest'

/**
 * helpers useTopics tests
 */
describe('buildCategory', () => {
  const slug = 'js-core'
  const meta = {
    title: 'JavaScript Core',
    description: 'Фундаментальные концепции JS: замыкания, контекст, функции высшего порядка',
    icon: '🟨',
    order: 1,
  }

  it('build TopicCategory from slug and metadata', () => {
    const result: TopicCategory = buildCategory(slug, meta, mockTopicItems)
    expect(result.slug).toBe('js-core')
    expect(result.title).toBe('JavaScript Core')
    expect(result.description).toBe('Фундаментальные концепции JS: замыкания, контекст, функции высшего порядка')
    expect(result.icon).toBe('🟨')
    expect(result.order).toBe(1)
    expect(result.items).toHaveLength(2)
    expect(result.items[0].slug).toBe('bind')
    expect(result.items[1].slug).toBe('curry')
    expect(result.i18nTitleKey).toBe('categories.js-core.title')
    expect(result.i18nDescriptionKey).toBe('categories.js-core.description')
  })

  it('build TopicCategory with default values when meta is empty', () => {
    const result = buildCategory('unknown-slug', {})
    expect(result.slug).toBe('unknown-slug')
    expect(result.title).toBe('Unknown slug')
    expect(result.icon).toBe('📦')
    expect(result.order).toBe(99)
    expect(result.items).toEqual([])
  })
})

describe('buildRoutes', () => {
  it('generates routes from categories', () => {
    const result: RouteRecordRaw[] = buildRoutes(mockTopicCategories)

    expect(result).toHaveLength(2)

    const first = result[0]
    expect(first.path).toBe('/js-core/bind')
    expect(first.name).toBe('js-core-bind')
    expect(first.meta).toBeDefined()
    expect(first.meta!.category).toBe('js-core')
    expect(first.meta!.title).toBe('Bind')

    const second = result[1]
    expect(second.path).toBe('/js-core/curry')
    expect(second.name).toBe('js-core-curry')
  })

  it('returns empty array when categories have no items', () => {
    const emptyCategories: TopicCategory[] = [
      { slug: 'empty', title: 'Empty', description: '', i18nTitleKey: '', i18nDescriptionKey: '', icon: '📦', order: 1, items: [] },
    ]
    const result = buildRoutes(emptyCategories)

    expect(result).toEqual([])
  })
})

describe('slugify', () => {
  it('converts PascalCase filename to slug', () => {
    expect(slugify('topics/js-core/bind/Bind.vue')).toBe('bind')
    expect(slugify('topics/js-core/deep-clone/DeepClone.vue')).toBe('deepclone')
    expect(slugify('topics/js-core/curry/Curry.vue')).toBe('curry')
  })

  it('handles single word filenames', () => {
    expect(slugify('topics/scss/flexbox/Flexbox.vue')).toBe('flexbox')
  })
})

describe('categoryFromPath', () => {
  it('extracts category from valid path', () => {
    expect(categoryFromPath('topics/js-core/bind/Bind.vue')).toBe('js-core')
    expect(categoryFromPath('topics/js-async/promise/Promise.vue')).toBe('js-async')
    expect(categoryFromPath('topics/scss/flexbox/Flexbox.vue')).toBe('scss')
  })

  it('returns unknown for invalid path', () => {
    expect(categoryFromPath('invalid/path')).toBe('unknown')
    expect(categoryFromPath('')).toBe('unknown')
  })
})

describe('humanize', () => {
  it('converts kebab-case to human-readable', () => {
    expect(humanize('js-core')).toBe('Js core')
    expect(humanize('js-async')).toBe('Js async')
  })

  it('converts snake_case to human-readable', () => {
    expect(humanize('js_core')).toBe('Js core')
  })

  it('handles PascalCase', () => {
    expect(humanize('deepClone')).toBe('Deep Clone')
  })

  it('capitalizes first letter', () => {
    expect(humanize('scss')).toBe('Scss')
  })
})

describe('extractMeta', () => {
  it('extracts meta from { default: Meta } format', () => {
    const mod = { default: { title: 'Test', order: 1 } }
    const result = extractMeta<{ title?: string, order?: number }>(mod)
    expect(result.title).toBe('Test')
    expect(result.order).toBe(1)
  })

  it('extracts meta from direct object', () => {
    const mod = { title: 'Direct', order: 2 }
    const result = extractMeta<{ title?: string, order?: number }>(mod)
    expect(result.title).toBe('Direct')
    expect(result.order).toBe(2)
  })

  it('returns empty object for undefined', () => {
    const result = extractMeta<{ title?: string }>(undefined)
    expect(result).toEqual({})
  })

  it('returns empty object for null', () => {
    const result = extractMeta<{ title?: string }>(null)
    expect(result).toEqual({})
  })
})

describe('calculateXp', () => {
  it('returns explicit xp when provided', () => {
    expect(calculateXp('easy', 50)).toBe(50)
    expect(calculateXp('hard', 200)).toBe(200)
  })

  it('calculates xp from difficulty', () => {
    expect(calculateXp('easy')).toBe(30)
    expect(calculateXp('medium')).toBe(60)
    expect(calculateXp('hard')).toBe(100)
  })

  it('defaults to easy xp when difficulty is undefined', () => {
    expect(calculateXp(undefined)).toBe(30)
  })

  it('defaults to 30 for unknown difficulty', () => {
    expect(calculateXp('expert')).toBe(30)
  })
})

describe('buildTopicItem', () => {
  const path = 'topics/js-core/bind/Bind.vue'
  const component = () => Promise.resolve({ default: {} })

  it('builds TopicItem from path and meta', () => {
    const meta: import('@/types/meta').ModuleMeta = {
      title: 'Bind',
      description: 'Function.prototype.bind',
      difficulty: 'easy',
      xp: 50,
      order: 1,
      tags: ['functions'],
    }
    const result = buildTopicItem(path, meta, component)

    expect(result.slug).toBe('bind')
    expect(result.title).toBe('Bind')
    expect(result.description).toBe('Function.prototype.bind')
    expect(result.category).toBe('js-core')
    expect(result.order).toBe(1)
    expect(result.difficulty).toBe('easy')
    expect(result.xpReward).toBe(50)
    expect(result.sourcePath).toBe('topics/js-core/bind/Bind.ts')
    expect(result.tags).toEqual(['functions'])
    expect(result.i18nTitleKey).toBe('modules.bind.title')
    expect(result.i18nDescriptionKey).toBe('modules.bind.description')
    expect(result.component).toBe(component)
  })

  it('uses humanize for title when meta.title is missing', () => {
    const meta: import('@/types/meta').ModuleMeta = {}
    const result = buildTopicItem(path, meta, component)

    expect(result.title).toBe('Bind')
  })

  it('uses defaults when meta is empty', () => {
    const meta: import('@/types/meta').ModuleMeta = {}
    const result = buildTopicItem(path, meta, component)

    expect(result.order).toBe(99)
    expect(result.difficulty).toBe('easy')
    expect(result.xpReward).toBe(30)
    expect(result.tags).toEqual([])
    expect(result.description).toBe('')
  })

  it('calculates xp from difficulty when explicit xp is missing', () => {
    const meta: import('@/types/meta').ModuleMeta = { difficulty: 'hard' }
    const result = buildTopicItem(path, meta, component)

    expect(result.xpReward).toBe(100)
  })
})

describe('createFallbackCategory', () => {
  it('creates category with item and default meta', () => {
    const item = mockTopicItems[0]
    const result = createFallbackCategory('js-core', item)

    expect(result.slug).toBe('js-core')
    expect(result.title).toBe('Js core')
    expect(result.icon).toBe('📦')
    expect(result.order).toBe(99)
    expect(result.items).toEqual([item])
    expect(result.description).toBe('')
  })
})

describe('sortCategories', () => {
  it('sorts categories by order', () => {
    const unsorted: TopicCategory[] = [
      { slug: 'b', title: 'B', description: '', i18nTitleKey: '', i18nDescriptionKey: '', icon: '📦', order: 2, items: [] },
      { slug: 'a', title: 'A', description: '', i18nTitleKey: '', i18nDescriptionKey: '', icon: '📦', order: 1, items: [] },
    ]
    const result = sortCategories(unsorted)

    expect(result[0].slug).toBe('a')
    expect(result[1].slug).toBe('b')
  })

  it('sorts items within categories by order', () => {
    const cat: TopicCategory = {
      slug: 'js-core',
      title: 'JS',
      description: '',
      i18nTitleKey: '',
      i18nDescriptionKey: '',
      icon: '🟨',
      order: 1,
      items: [
        { ...mockTopicItems[0], slug: 'curry', order: 2 },
        { ...mockTopicItems[1], slug: 'bind', order: 1 },
      ],
    }
    const result = sortCategories([cat])

    expect(result[0].items[0].slug).toBe('bind')
    expect(result[0].items[1].slug).toBe('curry')
  })

  it('handles empty categories array', () => {
    const result = sortCategories([])
    expect(result).toEqual([])
  })
})

/**
 * composable useTopics tests
 *
 * Note: import.meta.glob cannot be tested directly in jsdom,
 * so we test the composable's public API by calling the underlying helpers
 * with the same data that import.meta.glob would provide.
 */

describe('useTopics composable (integration via helpers)', () => {
  // Simulate what import.meta.glob would return
  const modulePages = {
    'frontend/topics/js-core/bind/Bind.vue': () => Promise.resolve({ default: {} }),
    'frontend/topics/js-core/curry/Curry.vue': () => Promise.resolve({ default: {} }),
  }

  const categoryMetas = {
    'frontend/topics/js-core/_meta.json': {
      default: {
        title: 'JavaScript Core',
        description: 'Core JS concepts',
        icon: '🟨',
        order: 1,
      },
    },
    'frontend/topics/js-async/_meta.json': {
      default: {
        title: 'JavaScript Async',
        description: 'Async patterns',
        icon: '⚡',
        order: 2,
      },
    },
  }

  const moduleMetas = {
    'frontend/topics/js-core/bind/_meta.json': {
      default: {
        title: 'Bind',
        description: 'Function.prototype.bind',
        difficulty: 'easy',
        xp: 50,
        order: 1,
        tags: ['functions'],
      },
    },
    'frontend/topics/js-core/curry/_meta.json': {
      default: {
        title: 'Curry',
        description: 'Currying functions',
        difficulty: 'medium',
        xp: 60,
        order: 2,
        tags: ['functions', 'fp'],
      },
    },
  }

  function simulateUseTopics() {
    const catMap = new Map<string, TopicCategory>()

    // Build categories from meta files
    for (const [path, mod] of Object.entries(categoryMetas)) {
      const parts = path.split('/')
      const catSlug = parts[parts.length - 2]
      const meta = extractMeta<CategoryMeta>(mod)
      catMap.set(catSlug, buildCategory(catSlug, meta))
    }

    // Add modules to categories
    for (const path of Object.keys(modulePages)) {
      const catSlug = categoryFromPath(path)
      const folderPath = path.replace(/\/[^/]+\.vue$/, '')
      const metaPath = `${folderPath}/_meta.json`
      const meta = extractMeta<ModuleMeta>(moduleMetas[metaPath])
      const item = buildTopicItem(path, meta, modulePages[path] as TopicItem['component'])

      const existingCat = catMap.get(catSlug)
      if (existingCat) {
        existingCat.items.push(item)
      } else {
        catMap.set(catSlug, createFallbackCategory(catSlug, item))
      }
    }

    const categories = sortCategories([...catMap.values()])
    const routes = buildRoutes(categories)
    const allModules = categories.flatMap(c => c.items)

    return { categories, routes, allModules }
  }

  it('returns categories with items', () => {
    const { categories } = simulateUseTopics()

    expect(categories).toHaveLength(2)
    expect(categories[0].slug).toBe('js-core')
    expect(categories[0].items).toHaveLength(2)
    expect(categories[1].slug).toBe('js-async')
    expect(categories[1].items).toHaveLength(0)
  })

  it('returns routes for all modules', () => {
    const { routes } = simulateUseTopics()

    expect(routes).toHaveLength(2)
    expect(routes[0].path).toBe('/js-core/bind')
    expect(routes[1].path).toBe('/js-core/curry')
  })

  it('returns all modules flattened', () => {
    const { allModules } = simulateUseTopics()

    expect(allModules).toHaveLength(2)
    expect(allModules[0].slug).toBe('bind')
    expect(allModules[1].slug).toBe('curry')
  })

  it('sorts categories by order', () => {
    const { categories } = simulateUseTopics()

    expect(categories[0].order).toBeLessThanOrEqual(categories[1].order)
  })

  it('sorts items within categories by order', () => {
    const { categories } = simulateUseTopics()

    const jsCore = categories.find(c => c.slug === 'js-core')!
    expect(jsCore.items[0].order).toBeLessThanOrEqual(jsCore.items[1].order)
  })

  it('creates fallback category for unknown category', () => {
    // Simulate a module with no category meta
    const orphanPath = 'topics/unknown-category/SomeModule.vue'
    const orphanComponent = () => Promise.resolve({ default: {} })

    const catMap = new Map<string, TopicCategory>()
    const catSlug = categoryFromPath(orphanPath)
    const meta = extractMeta<ModuleMeta>(undefined)
    const item = buildTopicItem(orphanPath, meta, orphanComponent)

    catMap.set(catSlug, createFallbackCategory(catSlug, item))
    const categories = sortCategories([...catMap.values()])

    expect(categories).toHaveLength(1)
    expect(categories[0].slug).toBe('unknown-category')
    expect(categories[0].title).toBe('Unknown category')
    expect(categories[0].items).toHaveLength(1)
  })

  it('handles empty module pages', () => {
    // Simulate no modules at all
    const emptyCatMetas = {
      'frontend/topics/empty-cat/_meta.json': {
        default: { title: 'Empty Category', icon: '📭', order: 5 },
      },
    }

    const catMap = new Map<string, TopicCategory>()
    for (const [path, mod] of Object.entries(emptyCatMetas)) {
      const parts = path.split('/')
      const catSlug = parts[parts.length - 2]
      const meta = extractMeta<CategoryMeta>(mod)
      catMap.set(catSlug, buildCategory(catSlug, meta))
    }

    const categories = sortCategories([...catMap.values()])
    const routes = buildRoutes(categories)

    expect(categories).toHaveLength(1)
    expect(categories[0].slug).toBe('empty-cat')
    expect(categories[0].items).toHaveLength(0)
    expect(routes).toHaveLength(0)
  })
})
