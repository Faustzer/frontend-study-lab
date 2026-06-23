import type { TopicCategory, TopicItem } from '@/types/topic'

export const mockTopicItems: TopicItem[] = [
  {
    slug: 'bind',
    title: 'Bind',
    description: 'Function.prototype.bind',
    i18nTitleKey: 'modules.bind.title',
    i18nDescriptionKey: 'modules.bind.description',
    category: 'js-core',
    order: 1,
    difficulty: 'easy',
    xpReward: 30,
    component: () => Promise.resolve({ default: {} }),
    sourcePath: 'topics/js-core/bind/bind.ts',
    tags: ['functions', 'context'],
  },
  {
    slug: 'curry',
    title: 'Curry',
    description: 'Каррирование функций',
    i18nTitleKey: 'modules.curry.title',
    i18nDescriptionKey: 'modules.curry.description',
    category: 'js-core',
    order: 2,
    difficulty: 'medium',
    xpReward: 60,
    component: () => Promise.resolve({ default: {} }),
    sourcePath: 'topics/js-core/curry/curry.ts',
    tags: ['functions', 'fp'],
  },
]

export const mockTopicCategories: TopicCategory[] = [
  {
    slug: 'js-core',
    title: 'JavaScript Core',
    description: 'Фундаментальные концепции JS',
    i18nTitleKey: 'categories.js-core.title',
    i18nDescriptionKey: 'categories.js-core.description',
    icon: '🟨',
    order: 1,
    items: mockTopicItems,
  },
  {
    slug: 'js-async',
    title: 'JavaScript Async',
    description: 'Асинхронность в JavaScript',
    i18nTitleKey: 'categories.js-async.title',
    i18nDescriptionKey: 'categories.js-async.description',
    icon: '⚡',
    order: 2,
    items: [],
  },
]
