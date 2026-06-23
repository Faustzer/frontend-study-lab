import type { TopicCategory, TopicItem } from '@/types/topic.ts'
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
} from '@/helpers/useTopics.ts'
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
 * useTopics tests
 */
// describe('useTopics', () => {
//   //
// })
