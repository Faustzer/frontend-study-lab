import type { RouteRecordRaw } from 'vue-router'
import type { TopicCategory, TopicItem } from '@/types/topic'
import type { CategoryMeta, ModuleMeta } from '@/types/meta'

// ==================== Constants ====================

export const DIFFICULTY_XP: Record<string, number> = {
  easy: 30,
  medium: 60,
  hard: 100,
}

// ==================== String Helpers ====================

/**
 * PascalCase filename -> lowercase slug
 * @example slugify('topics/js-core/bind/Bind.vue') => 'bind'
 * @example slugify('topics/js-core/deep-clone/DeepClone.vue') => 'deepclone'
 */
export function slugify(path: string): string {
  const parts = path.split('/')
  const fileName = parts[parts.length - 1]
  const name = fileName.replace(/\.vue$/, '')

  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/-/g, '')
}

/**
 * Extract category slug from file path
 * @example categoryFromPath('topics/js-core/bind/Bind.vue') => 'js-core'
 */
export function categoryFromPath(path: string): string {
  const match = path.match(/topics\/([^/]+)\//)
  return match ? match[1] : 'unknown'
}

/**
 * Convert slug/kebab-case to human-readable string
 * @example humanize('js-core') => 'Js core'
 * @example humanize('deep-clone') => 'Deep clone'
 */
export function humanize(str: string): string {
  return str
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^\w/, c => c.toUpperCase())
}

// ==================== Meta Extraction ====================

/**
 * Extract meta object from Vite's eager module
 * Handles both { default: Meta } and direct Meta formats
 */
export function extractMeta<T>(mod: unknown): T {
  if (mod && typeof mod === 'object' && 'default' in mod) {
    return (mod as { default?: T }).default ?? ({} as T)
  }
  return (mod as T) ?? ({} as T)
}

/**
 * Calculate XP reward based on difficulty or explicit xp value
 */
export function calculateXp(difficulty: string | undefined, explicitXp?: number): number {
  if (explicitXp !== undefined) {
    return explicitXp
  }
  return DIFFICULTY_XP[difficulty ?? 'easy'] ?? 30
}

// ==================== Topic Building ====================

/**
 * Build TopicItem from module path and metadata
 */
export function buildTopicItem(
  path: string,
  meta: ModuleMeta,
  component: TopicItem['component'],
): TopicItem {
  const catSlug = categoryFromPath(path)
  const moduleSlug = slugify(path)

  return {
    slug: moduleSlug,
    title: meta.title ?? humanize(moduleSlug),
    description: meta.description ?? '',
    i18nTitleKey: `modules.${moduleSlug}.title`,
    i18nDescriptionKey: `modules.${moduleSlug}.description`,
    category: catSlug,
    order: meta.order ?? 99,
    difficulty: (meta.difficulty as TopicItem['difficulty']) ?? 'easy',
    xpReward: calculateXp(meta.difficulty, meta.xp),
    component,
    sourcePath: path.replace(/\.vue$/, '.ts'),
    tags: meta.tags ?? [],
  }
}

/**
 * Build TopicCategory from slug and metadata
 */
export function buildCategory(
  slug: string,
  meta: CategoryMeta,
  items: TopicItem[] = [],
): TopicCategory {
  return {
    slug,
    title: meta.title ?? humanize(slug),
    description: meta.description ?? '',
    i18nTitleKey: `categories.${slug}.title`,
    i18nDescriptionKey: `categories.${slug}.description`,
    icon: meta.icon ?? '📦',
    order: meta.order ?? 99,
    items,
  }
}

/**
 * Create a fallback category for modules without a category meta file
 */
export function createFallbackCategory(slug: string, item: TopicItem): TopicCategory {
  return buildCategory(slug, {}, [item])
}

// ==================== Route Building ====================

/**
 * Generate vue-router routes from categories and their items
 */
export function buildRoutes(categories: TopicCategory[]): RouteRecordRaw[] {
  const result: RouteRecordRaw[] = []

  for (const cat of categories) {
    for (const item of cat.items) {
      result.push({
        path: `/${cat.slug}/${item.slug}`,
        name: `${cat.slug}-${item.slug}`,
        component: item.component,
        meta: {
          category: cat.slug,
          categoryTitle: cat.title,
          title: item.title,
          difficulty: item.difficulty,
          xpReward: item.xpReward,
        },
      })
    }
  }

  return result
}

// ==================== Sorting ====================

/**
 * Sort categories and their items by order
 */
export function sortCategories(categories: TopicCategory[]): TopicCategory[] {
  for (const cat of categories) {
    cat.items.sort((a, b) => a.order - b.order)
  }
  return categories.sort((a, b) => a.order - b.order)
}
