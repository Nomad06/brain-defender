/**
 * Site categorization system for Brain Defender
 * Allows users to organize blocked sites into categories
 */

import { z } from 'zod'

// Zod schema for category validation
export const CategorySchema = z.string().min(1).max(50)

export type Category = z.infer<typeof CategorySchema>

// Default categories (in Russian - primary language)
export const DEFAULT_CATEGORIES: readonly Category[] = [
  'Соцсети',
  'Развлечения',
  'Новости',
  'Игры',
  'Видео',
  'Покупки',
  'Другое',
] as const

// Special category for uncategorized sites
export const UNCATEGORIZED_CATEGORY = 'Без категории'
export const ALL_CATEGORIES_FILTER = 'Все'

/**
 * Get all categories from localStorage
 * Falls back to default categories if none are stored
 */
export function getCategories(): Category[] {
  try {
    const stored = localStorage.getItem('siteCategories')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        // Validate each category
        return parsed.filter(cat => CategorySchema.safeParse(cat).success)
      }
    }
  } catch (err) {
    console.error('[Categories] Error loading categories:', err)
  }
  return [...DEFAULT_CATEGORIES]
}

/**
 * Save categories to localStorage
 * @param categories - Array of category names
 * @returns true if successful
 */
export function saveCategories(categories: Category[]): boolean {
  try {
    // Validate all categories before saving
    const validCategories = categories.filter(cat => CategorySchema.safeParse(cat).success)
    localStorage.setItem('siteCategories', JSON.stringify(validCategories))
    return true
  } catch (err) {
    console.error('[Categories] Error saving categories:', err)
    return false
  }
}

/**
 * Add a new category if it doesn't already exist
 * @param category - Category name to add
 * @returns Updated list of categories
 */
export function addCategory(category: string): Category[] {
  const categories = getCategories()

  // Validate the new category
  const validation = CategorySchema.safeParse(category)
  if (!validation.success) {
    console.error('[Categories] Invalid category:', validation.error)
    return categories
  }

  if (!categories.includes(category)) {
    categories.push(category)
    saveCategories(categories)
  }

  return categories
}

/**
 * Remove a category from the list
 * Note: This doesn't remove the category from existing sites
 * @param category - Category name to remove
 * @returns Updated list of categories
 */
export function removeCategory(category: string): Category[] {
  const categories = getCategories()
  const filtered = categories.filter(cat => cat !== category)
  saveCategories(filtered)
  return filtered
}

/**
 * Type for sites with category support
 */
type SiteWithCategory = {
  host: string
  category?: string | null
  [key: string]: unknown
}

/**
 * Group sites by their category
 * @param sites - Array of site objects
 * @returns Object with categories as keys and arrays of sites as values
 */
export function groupSitesByCategory(
  sites: SiteWithCategory[]
): Record<string, SiteWithCategory[]> {
  const grouped: Record<string, SiteWithCategory[]> = {}
  const uncategorized: SiteWithCategory[] = []

  sites.forEach(site => {
    const category = site.category || null

    if (!category) {
      uncategorized.push(site)
      return
    }

    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(site)
  })

  if (uncategorized.length > 0) {
    grouped[UNCATEGORIZED_CATEGORY] = uncategorized
  }

  return grouped
}

/**
 * Filter sites by category
 * @param sites - Array of sites
 * @param category - Category to filter by (or 'Все' for all)
 * @returns Filtered array of sites
 */
export function filterSitesByCategory(
  sites: SiteWithCategory[],
  category: string | null
): SiteWithCategory[] {
  if (!category || category === ALL_CATEGORIES_FILTER) {
    return sites
  }

  if (category === UNCATEGORIZED_CATEGORY) {
    return sites.filter(site => !site.category)
  }

  return sites.filter(site => site.category === category)
}

/**
 * Get category statistics
 * @param sites - Array of sites
 * @returns Object with category names as keys and counts as values
 */
export function getCategoryStats(sites: SiteWithCategory[]): Record<string, number> {
  const stats: Record<string, number> = {}

  sites.forEach(site => {
    const category = site.category || UNCATEGORIZED_CATEGORY
    stats[category] = (stats[category] || 0) + 1
  })

  return stats
}

/**
 * Rename a category across all sites
 * @param oldName - Current category name
 * @param newName - New category name
 * @param sites - Array of sites (will be modified)
 * @returns Updated sites array
 */
export function renameCategory(
  oldName: string,
  newName: string,
  sites: SiteWithCategory[]
): SiteWithCategory[] {
  // Validate new name
  const validation = CategorySchema.safeParse(newName)
  if (!validation.success) {
    console.error('[Categories] Invalid new category name:', validation.error)
    return sites
  }

  return sites.map(site => {
    if (site.category === oldName) {
      return { ...site, category: newName }
    }
    return site
  })
}
