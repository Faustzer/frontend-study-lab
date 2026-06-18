import type { RouteRecordRaw } from 'vue-router'
import type { TopicCategory, TopicItem } from '@/types/types'
import { computed } from 'vue'

/**
 * Автоматически сканирует папку topics/ и генерирует:
 * - массив категорий с модулями
 * - маршруты для vue-router
 *
 * Структура папок:
 *   topics/<category>/<module>/<ModuleName>.vue  — страница модуля
 *   topics/<category>/<module>/<module-name>.ts   — реализация
 *
 * Каждая папка категории может содержать _meta.json:
 *   { "title": "JavaScript", "icon": "🟨", "order": 1 }
 *
 * Каждая папка модуля может содержать _meta.json:
 *   { "title": "Debounce", "difficulty": "easy", "xp": 50, "order": 1 }
 */

// Все Vue-компоненты модулей
const modulePages = import.meta.glob('@/topics/**/*.vue', { eager: false })

// Все meta-файлы категорий
const categoryMetas = import.meta.glob('@/topics/*/_meta.json', { eager: true })

// Все meta-файлы модулей
const moduleMetas = import.meta.glob('@/topics/*/*/_meta.json', { eager: true })

interface ModuleMeta {
  title?: string
  description?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  xp?: number
  order?: number
  tags?: string[]
}

interface CategoryMeta {
  title?: string
  description?: string
  icon?: string
  order?: number
}

const DIFFICULTY_XP: Record<string, number> = {
  easy: 30,
  medium: 60,
  hard: 100,
}

function slugify(path: string): string {
  const parts = path.split('/')
  const fileName = parts[parts.length - 1]
  const name = fileName.replace(/\.vue$/, '')
  // PascalCase -> lowercase (Bind -> bind, DeepClone -> deepclone)
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/-/g, '')
}

function categoryFromPath(path: string): string {
  const match = path.match(/topics\/([^/]+)\//)
  return match ? match[1] : 'unknown'
}

function humanize(str: string): string {
  return str
    .replace(/[-_]/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^\w/, c => c.toUpperCase())
}

export function useTopics() {
  const categories = computed<TopicCategory[]>(() => {
    const catMap = new Map<string, TopicCategory>()

    for (const [path, mod] of Object.entries(categoryMetas)) {
      const catSlug = path.split('/').at(-2) ?? 'unknown'
      const meta = (mod as { default?: CategoryMeta }).default ?? (mod as CategoryMeta)
      catMap.set(catSlug, {
        slug: catSlug,
        title: meta.title ?? humanize(catSlug),
        description: meta.description ?? '',
        icon: meta.icon ?? '📦',
        order: meta.order ?? 99,
        items: [],
      })
    }

    for (const path of Object.keys(modulePages)) {
      const catSlug = categoryFromPath(path)
      const moduleSlug = slugify(path)
      const folderPath = path.replace(/\/[^/]+\.vue$/, '')
      const metaPath = `${folderPath}/_meta.json`

      const meta = (moduleMetas[metaPath] as { default?: ModuleMeta } | undefined)?.default ?? {}

      const item: TopicItem = {
        slug: moduleSlug,
        title: meta.title ?? humanize(moduleSlug),
        description: meta.description ?? '',
        category: catSlug,
        order: meta.order ?? 99,
        difficulty: (meta.difficulty as TopicItem['difficulty']) ?? 'easy',
        xpReward: meta.xp ?? DIFFICULTY_XP[meta.difficulty ?? 'easy'] ?? 30,
        component: modulePages[path] as TopicItem['component'],
        sourcePath: path.replace(/\.vue$/, '.ts'),
        tags: meta.tags ?? [],
      }

      const cat = catMap.get(catSlug)
      if (cat) {
        cat.items.push(item)
      }
      else {
        catMap.set(catSlug, {
          slug: catSlug,
          title: humanize(catSlug),
          description: '',
          icon: '📦',
          order: 99,
          items: [item],
        })
      }
    }

    for (const cat of catMap.values()) {
      cat.items.sort((a, b) => a.order - b.order)
    }

    return [...catMap.values()].sort((a, b) => a.order - b.order)
  })

  const routes = computed<RouteRecordRaw[]>(() => {
    const result: RouteRecordRaw[] = []

    for (const cat of categories.value) {
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
  })

  const allModules = computed<TopicItem[]>(() => {
    return categories.value.flatMap(c => c.items)
  })

  return { categories, routes, allModules }
}
