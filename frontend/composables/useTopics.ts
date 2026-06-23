import type { TopicCategory, TopicItem } from '@/types/topic'
import type { CategoryMeta, ModuleMeta } from '@/types/meta'
import { computed } from 'vue'
import {
  buildCategory,
  buildRoutes,
  buildTopicItem,
  categoryFromPath,

  createFallbackCategory,
  extractMeta,

  sortCategories,
} from '@/helpers/useTopics'

/**
 * Automatically scans the topics/ folder and generates:
 * - array of categories with modules
 * - routes for vue-router
 *
 * Folder structure:
 *   topics/<category>/<module>/<ModuleName>.vue  — module page
 *   topics/<category>/<module>/<module-name>.ts   — implementation
 *
 * Each category folder can contain _meta.json:
 *   { "title": "JavaScript", "icon": "🟨", "order": 1 }
 *
 * Each module folder can contain _meta.json:
 *   { "title": "Debounce", "difficulty": "easy", "xp": 50, "order": 1 }
 */

// All Vue module components
const modulePages = import.meta.glob('@/topics/**/*.vue', { eager: false })

// All category meta files
const categoryMetas = import.meta.glob('@/topics/*/_meta.json', { eager: true })

// All module meta files
const moduleMetas = import.meta.glob('@/topics/*/*/_meta.json', { eager: true })

export function useTopics() {
  const categories = computed<TopicCategory[]>(() => {
    const catMap = new Map<string, TopicCategory>()

    // Build categories from meta files
    for (const [path, mod] of Object.entries(categoryMetas)) {
      const catSlug = path.split('/').at(-2) ?? 'unknown'
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
      }
      else {
        catMap.set(catSlug, createFallbackCategory(catSlug, item))
      }
    }

    return sortCategories([...catMap.values()])
  })

  const routes = computed(() => buildRoutes(categories.value))

  const allModules = computed<TopicItem[]>(() => categories.value.flatMap(c => c.items))

  return { categories, routes, allModules }
}
