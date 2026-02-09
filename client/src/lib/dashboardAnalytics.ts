/**
 * Dashboard analytics utilities for aggregating and analyzing user scan history data
 */

export interface ScanHistoryItem {
  barcode: string;
  name: string;
  brand?: string;
  ecoScore: number;
  ecoScoreGrade?: string;
  imageUrl?: string;
  timestamp?: number;
}

export interface CategoryStats {
  category: string;
  count: number;
  averageEcoScore: number;
}

export interface EcoScoreTrend {
  date: string;
  averageScore: number;
  count: number;
}

export interface DashboardMetrics {
  totalScans: number;
  averageEcoScore: number;
  bestEcoScore: number;
  worstEcoScore: number;
  categoryStats: CategoryStats[];
  ecoScoreTrends: EcoScoreTrend[];
  gradeDistribution: Record<string, number>;
}

/**
 * Extract category from product name or brand
 */
function extractCategory(name: string, brand?: string): string {
  const combined = `${name} ${brand || ''}`.toLowerCase();
  
  // Common product categories
  const categories: Record<string, string[]> = {
    'Beverages': ['drink', 'juice', 'coffee', 'tea', 'water', 'soda', 'beer', 'wine', 'alcohol'],
    'Snacks': ['snack', 'chip', 'cookie', 'candy', 'bar', 'cracker', 'popcorn', 'nuts'],
    'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'dairy'],
    'Meat & Seafood': ['meat', 'chicken', 'beef', 'fish', 'seafood', 'salmon', 'tuna'],
    'Grains': ['bread', 'cereal', 'rice', 'pasta', 'grain', 'flour', 'oat'],
    'Fruits & Vegetables': ['fruit', 'vegetable', 'apple', 'banana', 'carrot', 'lettuce'],
    'Frozen': ['frozen', 'ice cream', 'pizza'],
    'Condiments': ['sauce', 'ketchup', 'mayo', 'dressing', 'condiment', 'oil', 'vinegar'],
    'Personal Care': ['shampoo', 'soap', 'toothpaste', 'deodorant', 'lotion', 'cream'],
    'Household': ['detergent', 'cleaner', 'paper', 'tissue', 'soap'],
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => combined.includes(keyword))) {
      return category;
    }
  }
  
  return 'Other';
}

/**
 * Calculate dashboard metrics from scan history
 */
export function calculateDashboardMetrics(scanHistory: ScanHistoryItem[]): DashboardMetrics {
  if (scanHistory.length === 0) {
    return {
      totalScans: 0,
      averageEcoScore: 0,
      bestEcoScore: 0,
      worstEcoScore: 0,
      categoryStats: [],
      ecoScoreTrends: [],
      gradeDistribution: {},
    };
  }

  // Calculate basic stats
  const totalScans = scanHistory.length;
  const ecoScores = scanHistory.map(item => item.ecoScore);
  const averageEcoScore = ecoScores.reduce((a, b) => a + b, 0) / totalScans;
  const bestEcoScore = Math.max(...ecoScores);
  const worstEcoScore = Math.min(...ecoScores);

  // Calculate category statistics
  const categoryMap = new Map<string, { scores: number[]; count: number }>();
  const gradeDistribution: Record<string, number> = {};

  scanHistory.forEach(item => {
    const category = extractCategory(item.name, item.brand || '');
    const existing = categoryMap.get(category) || { scores: [], count: 0 };
    existing.scores.push(item.ecoScore);
    existing.count += 1;
    categoryMap.set(category, existing);

    // Track grade distribution
    const grade = item.ecoScoreGrade || 'Unknown';
    if (grade) {
      gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
    }
  });

  const categoryStats: CategoryStats[] = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      count: data.count,
      averageEcoScore: data.scores.reduce((a, b) => a + b, 0) / data.count,
    }))
    .sort((a, b) => b.count - a.count);

  // Calculate eco-score trends (by date if timestamps available)
  const trendMap = new Map<string, { scores: number[]; count: number }>();
  
  scanHistory.forEach(item => {
    const timestamp = item.timestamp || Date.now();
    const date = new Date(timestamp).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    const existing = trendMap.get(date) || { scores: [], count: 0 };
    existing.scores.push(item.ecoScore);
    existing.count += 1;
    trendMap.set(date, existing);
  });

  const ecoScoreTrends: EcoScoreTrend[] = Array.from(trendMap.entries())
    .map(([date, data]) => ({
      date,
      averageScore: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.count),
      count: data.count,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30); // Keep last 30 days

  return {
    totalScans,
    averageEcoScore: Math.round(averageEcoScore * 10) / 10,
    bestEcoScore,
    worstEcoScore,
    categoryStats,
    ecoScoreTrends,
    gradeDistribution,
  };
}

/**
 * Get top categories by scan count
 */
export function getTopCategories(metrics: DashboardMetrics, limit: number = 5): CategoryStats[] {
  return metrics.categoryStats.slice(0, limit);
}

/**
 * Calculate sustainability improvement (comparing recent vs older scans)
 */
export function calculateSustainabilityImprovement(scanHistory: ScanHistoryItem[]): {
  improvement: number;
  recentAverage: number;
  olderAverage: number;
} {
  if (scanHistory.length < 2) {
    return { improvement: 0, recentAverage: 0, olderAverage: 0 };
  }

  const mid = Math.floor(scanHistory.length / 2);
  const recentScans = scanHistory.slice(mid);
  const olderScans = scanHistory.slice(0, mid);

  const recentAverage = recentScans.reduce((a, b) => a + b.ecoScore, 0) / recentScans.length;
  const olderAverage = olderScans.reduce((a, b) => a + b.ecoScore, 0) / olderScans.length;

  const improvement = Math.round((recentAverage - olderAverage) * 10) / 10;

  return {
    improvement,
    recentAverage: Math.round(recentAverage * 10) / 10,
    olderAverage: Math.round(olderAverage * 10) / 10,
  };
}
