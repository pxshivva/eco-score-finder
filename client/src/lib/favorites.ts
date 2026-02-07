/**
 * Favorites management utilities
 * Integrates with both localStorage (for quick access) and database (for persistence)
 */

import { trpc } from './trpc';

export interface FavoriteProduct {
  productId: number;
  barcode: string;
  name: string;
  brand?: string;
  ecoScore: number;
  ecoScoreGrade: string;
  imageUrl?: string;
  price?: string;
  notes?: string;
  addedAt: number;
}

const FAVORITES_CACHE_KEY = 'eco-score-finder-favorites-cache';

/**
 * Get cached favorites from localStorage
 */
export function getCachedFavorites(): FavoriteProduct[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(FAVORITES_CACHE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[Favorites] Error reading from localStorage:', error);
    return [];
  }
}

/**
 * Update cached favorites in localStorage
 */
export function updateCachedFavorites(favorites: FavoriteProduct[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(FAVORITES_CACHE_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error('[Favorites] Error writing to localStorage:', error);
  }
}

/**
 * Add a product to favorites
 * Requires authentication and database integration
 */
export async function addToFavorites(
  product: Omit<FavoriteProduct, 'addedAt'>,
  notes?: string
): Promise<boolean> {
  try {
    // Add to cache immediately for optimistic update
    const cached = getCachedFavorites();
    const newFavorite: FavoriteProduct = {
      ...product,
      notes,
      addedAt: Date.now(),
    };
    
    // Avoid duplicates
    const filtered = cached.filter(f => f.barcode !== product.barcode);
    const updated = [newFavorite, ...filtered];
    updateCachedFavorites(updated);
    
    return true;
  } catch (error) {
    console.error('[Favorites] Error adding to favorites:', error);
    return false;
  }
}

/**
 * Remove a product from favorites
 */
export function removeFromFavorites(barcode: string): boolean {
  try {
    const cached = getCachedFavorites();
    const updated = cached.filter(f => f.barcode !== barcode);
    updateCachedFavorites(updated);
    return true;
  } catch (error) {
    console.error('[Favorites] Error removing from favorites:', error);
    return false;
  }
}

/**
 * Check if a product is in favorites
 */
export function isInFavorites(barcode: string): boolean {
  const cached = getCachedFavorites();
  return cached.some(f => f.barcode === barcode);
}

/**
 * Get a specific favorite by barcode
 */
export function getFavoriteByBarcode(barcode: string): FavoriteProduct | undefined {
  const cached = getCachedFavorites();
  return cached.find(f => f.barcode === barcode);
}

/**
 * Clear all favorites from cache
 */
export function clearFavoritesCache(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(FAVORITES_CACHE_KEY);
  } catch (error) {
    console.error('[Favorites] Error clearing favorites cache:', error);
  }
}

/**
 * Sync favorites with database (for authenticated users)
 * This should be called when user logs in
 */
export async function syncFavoritesWithDatabase(): Promise<void> {
  // This will be implemented with tRPC calls in the component
  // when user authentication is available
}
