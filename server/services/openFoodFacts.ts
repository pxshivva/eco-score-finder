/**
 * Open Food Facts API integration for fetching product data and eco-scores
 */

interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  brands?: string;
  categories?: string;
  image_url?: string;
  price?: string;
  countries?: string;
  ecoscore_score?: number;
  ecoscore_grade?: string;
  environment_impact_level?: string;
}

interface EcoScoreData {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  ecoScore: number;
  ecoScoreGrade: string;
  environmentalFootprint: number;
  packagingSustainability: number;
  carbonImpact: number;
  imageUrl?: string;
  price?: string;
  country?: string;
}

export async function fetchProductFromOpenFoodFacts(barcode: string): Promise<EcoScoreData | null> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      {
        headers: {
          'User-Agent': 'EcoScoreFinder/1.0'
        }
      }
    );

    if (!response.ok) {
      console.warn(`[OpenFoodFacts] Product not found: ${barcode}`);
      return null;
    }

    const data = (await response.json()) as { product?: OpenFoodFactsProduct };
    const product = data.product;

    if (!product) {
      return null;
    }

    // Calculate eco-score components based on available data
    const ecoScore = product.ecoscore_score ?? 50;
    const ecoScoreGrade = product.ecoscore_grade ?? 'C';

    // Estimate component scores based on eco-score and available data
    // These are approximations; ideally we'd get detailed breakdowns from the API
    const environmentalFootprint = calculateEnvironmentalFootprint(ecoScore);
    const packagingSustainability = calculatePackagingSustainability(ecoScore);
    const carbonImpact = calculateCarbonImpact(ecoScore);

    // Truncate long values to fit database constraints
    const truncateString = (str: string | undefined, maxLength: number): string | undefined => {
      if (!str) return undefined;
      return str.length > maxLength ? str.substring(0, maxLength) : str;
    };

    return {
      barcode,
      name: truncateString(product.product_name || 'Unknown Product', 255) || 'Unknown Product',
      brand: truncateString(product.brands, 255),
      category: truncateString(product.categories, 255),
      ecoScore,
      ecoScoreGrade: truncateString(ecoScoreGrade?.toUpperCase(), 10) || 'C',
      environmentalFootprint,
      packagingSustainability,
      carbonImpact,
      imageUrl: truncateString(product.image_url, 500),
      price: product.price,
      country: truncateString(product.countries, 100),
    };
  } catch (error) {
    console.error(`[OpenFoodFacts] Error fetching product ${barcode}:`, error);
    return null;
  }
}

export async function searchProductsOpenFoodFacts(query: string, limit = 10) {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=${limit}`,
      {
        headers: {
          'User-Agent': 'EcoScoreFinder/1.0'
        }
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as { products?: OpenFoodFactsProduct[] };
    const products = data.products || [];

    // Truncate long values to fit database constraints
    const truncateString = (str: string | undefined, maxLength: number): string | undefined => {
      if (!str) return undefined;
      return str.length > maxLength ? str.substring(0, maxLength) : str;
    };

    const results = products
      .filter(p => p.code && p.product_name)
      .slice(0, limit);

    return results.map(product => ({
      barcode: product.code,
      name: truncateString(product.product_name || 'Unknown Product', 255) || 'Unknown Product',
      brand: truncateString(product.brands, 255),
      category: truncateString(product.categories, 255),
      ecoScore: product.ecoscore_score ?? 50,
      ecoScoreGrade: truncateString((product.ecoscore_grade ?? 'C').toUpperCase(), 10) || 'C',
      environmentalFootprint: calculateEnvironmentalFootprint(product.ecoscore_score ?? 50),
      packagingSustainability: calculatePackagingSustainability(product.ecoscore_score ?? 50),
      carbonImpact: calculateCarbonImpact(product.ecoscore_score ?? 50),
      imageUrl: truncateString(product.image_url, 500),
      price: product.price,
      country: truncateString(product.countries, 100),
    }));
  } catch (error) {
    console.error('[OpenFoodFacts] Error searching products:', error);
    return [];
  }
}

/**
 * Calculate estimated environmental footprint (0-100) based on eco-score
 * Higher eco-score = higher environmental footprint score
 */
function calculateEnvironmentalFootprint(ecoScore: number): number {
  return Math.round(ecoScore * 1.2);
}

/**
 * Calculate estimated packaging sustainability (0-100) based on eco-score
 */
function calculatePackagingSustainability(ecoScore: number): number {
  return Math.round(Math.max(0, Math.min(100, ecoScore + 10)));
}

/**
 * Calculate estimated carbon impact (0-100) based on eco-score
 * Lower eco-score = higher carbon impact
 */
function calculateCarbonImpact(ecoScore: number): number {
  return Math.round(100 - ecoScore);
}

/**
 * Find alternative products with similar eco-scores
 */
export async function findAlternatives(
  originalProduct: EcoScoreData,
  minSimilarity = 0.8
): Promise<EcoScoreData[]> {
  try {
    // Search for products in the same category
    const category = originalProduct.category || originalProduct.brand || 'products';
    const searchResults = await searchProductsOpenFoodFacts(category, 20);

    // Filter for similar eco-scores and exclude the original product
    return searchResults.filter(product => {
      const scoreDifference = Math.abs(product.ecoScore - originalProduct.ecoScore) / 100;
      const isSimilar = scoreDifference <= (1 - minSimilarity);
      const isDifferent = product.barcode !== originalProduct.barcode;

      return isSimilar && isDifferent;
    });
  } catch (error) {
    console.error('[OpenFoodFacts] Error finding alternatives:', error);
    return [];
  }
}
