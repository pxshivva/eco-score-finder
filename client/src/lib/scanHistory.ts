/**
 * Scan history management utilities
 * Stores the last 10 scanned products in localStorage for quick access
 */

export interface ScanHistoryItem {
  barcode: string;
  name: string;
  brand?: string;
  ecoScore: number;
  ecoScoreGrade: string;
  imageUrl?: string;
  timestamp: number;
}

const SCAN_HISTORY_KEY = 'eco-score-finder-scan-history';
const MAX_HISTORY_ITEMS = 10;

/**
 * Get all scan history items from localStorage
 */
export function getScanHistory(): ScanHistoryItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(SCAN_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[ScanHistory] Error reading from localStorage:', error);
    return [];
  }
}

/**
 * Add a product to scan history
 * Keeps only the last 10 unique products by barcode
 */
export function addToScanHistory(item: Omit<ScanHistoryItem, 'timestamp'>): void {
  if (typeof window === 'undefined') return;

  try {
    const history = getScanHistory();
    
    // Remove duplicate if it exists (to move it to the top)
    const filtered = history.filter(h => h.barcode !== item.barcode);
    
    // Add new item with current timestamp
    const newItem: ScanHistoryItem = {
      ...item,
      timestamp: Date.now(),
    };
    
    // Keep only the last MAX_HISTORY_ITEMS
    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('[ScanHistory] Error writing to localStorage:', error);
  }
}

/**
 * Remove a specific item from scan history by barcode
 */
export function removeFromScanHistory(barcode: string): void {
  if (typeof window === 'undefined') return;

  try {
    const history = getScanHistory();
    const updated = history.filter(item => item.barcode !== barcode);
    localStorage.setItem(SCAN_HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('[ScanHistory] Error removing from scan history:', error);
  }
}

/**
 * Clear all scan history
 */
export function clearScanHistory(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(SCAN_HISTORY_KEY);
  } catch (error) {
    console.error('[ScanHistory] Error clearing scan history:', error);
  }
}

/**
 * Get a specific item from scan history by barcode
 */
export function getScanHistoryItem(barcode: string): ScanHistoryItem | undefined {
  const history = getScanHistory();
  return history.find(item => item.barcode === barcode);
}

/**
 * Check if a barcode exists in scan history
 */
export function isInScanHistory(barcode: string): boolean {
  const history = getScanHistory();
  return history.some(item => item.barcode === barcode);
}
