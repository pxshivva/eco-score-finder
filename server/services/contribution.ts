/**
 * Open Food Facts Contribution Service
 * Handles product data contributions to Open Food Facts
 */

interface ContributionData {
  barcode: string;
  productName: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  ingredients?: string;
  nutritionFacts?: string;
  userEmail?: string;
  userComment?: string;
}

interface ContributionResponse {
  success: boolean;
  message: string;
  offUrl?: string;
  error?: string;
}

/**
 * Validate barcode format (EAN-13, UPC-A, etc.)
 */
export function validateBarcode(barcode: string): boolean {
  // Remove any non-digit characters
  const cleanBarcode = barcode.replace(/\D/g, '');
  
  // Check if barcode is valid length (EAN-13: 13 digits, UPC-A: 12 digits, EAN-8: 8 digits)
  if (![8, 12, 13, 14].includes(cleanBarcode.length)) {
    return false;
  }
  
  // Validate EAN-13 checksum
  if (cleanBarcode.length === 13) {
    return validateEAN13Checksum(cleanBarcode);
  }
  
  // Validate UPC-A checksum (12 digits)
  if (cleanBarcode.length === 12) {
    return validateUPCChecksum(cleanBarcode);
  }
  
  // Validate EAN-8 checksum
  if (cleanBarcode.length === 8) {
    return validateEAN8Checksum(cleanBarcode);
  }
  
  return true; // Accept other formats without strict validation
}

/**
 * Validate EAN-13 checksum
 */
function validateEAN13Checksum(ean: string): boolean {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(ean[i], 10);
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(ean[12], 10);
}

/**
 * Validate UPC-A checksum
 */
function validateUPCChecksum(upc: string): boolean {
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const digit = parseInt(upc[i], 10);
    sum += digit * (i % 2 === 0 ? 3 : 1);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(upc[11], 10);
}

/**
 * Validate EAN-8 checksum
 */
function validateEAN8Checksum(ean: string): boolean {
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const digit = parseInt(ean[i], 10);
    sum += digit * (i % 2 === 0 ? 3 : 1);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(ean[7], 10);
}

/**
 * Submit product contribution to Open Food Facts
 * Uses the Open Food Facts edit API
 */
export async function submitProductContribution(
  data: ContributionData
): Promise<ContributionResponse> {
  try {
    // Validate barcode
    if (!validateBarcode(data.barcode)) {
      return {
        success: false,
        message: 'Invalid barcode format. Please check the barcode and try again.',
        error: 'INVALID_BARCODE',
      };
    }

    // Validate required fields
    if (!data.productName || data.productName.trim().length === 0) {
      return {
        success: false,
        message: 'Product name is required.',
        error: 'MISSING_PRODUCT_NAME',
      };
    }

    // Prepare form data for Open Food Facts API
    const formData = new FormData();
    formData.append('barcode', data.barcode.replace(/\D/g, ''));
    formData.append('product_name', data.productName);
    
    if (data.brand) {
      formData.append('brands', data.brand);
    }
    
    if (data.category) {
      formData.append('categories', data.category);
    }
    
    if (data.ingredients) {
      formData.append('ingredients_text', data.ingredients);
    }
    
    if (data.nutritionFacts) {
      formData.append('nutrition_facts', data.nutritionFacts);
    }
    
    if (data.userComment) {
      formData.append('comment', data.userComment);
    }

    // Add user agent to identify the contribution source
    const userAgent = 'EcoScore Finder/1.0';

    // Submit to Open Food Facts API
    const response = await fetch('https://world.openfoodfacts.org/cgi/product_jqm2.pl', {
      method: 'POST',
      body: formData,
      headers: {
        'User-Agent': userAgent,
      },
    });

    if (!response.ok) {
      return {
        success: false,
        message: 'Failed to submit contribution. Please try again later.',
        error: `HTTP_${response.status}`,
      };
    }

    const result = await response.json();

    // Open Food Facts returns status in the response
    if (result.status === 0 || result.code === '0') {
      // Success - product was created or updated
      const offUrl = `https://world.openfoodfacts.org/product/${data.barcode.replace(/\D/g, '')}`;
      return {
        success: true,
        message: 'Thank you! Your product data has been submitted to Open Food Facts. It may take a few minutes to appear in the database.',
        offUrl,
      };
    } else if (result.status === 1 || result.code === '1') {
      // Product already exists
      const offUrl = `https://world.openfoodfacts.org/product/${data.barcode.replace(/\D/g, '')}`;
      return {
        success: true,
        message: 'Product already exists in Open Food Facts. Your contribution has been recorded.',
        offUrl,
      };
    } else {
      return {
        success: false,
        message: result.error || 'Failed to submit contribution. Please try again.',
        error: result.status?.toString(),
      };
    }
  } catch (error) {
    console.error('Error submitting product contribution:', error);
    return {
      success: false,
      message: 'An error occurred while submitting your contribution. Please try again.',
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Generate Open Food Facts contribution URL for manual entry
 */
export function generateContributionUrl(barcode: string): string {
  const cleanBarcode = barcode.replace(/\D/g, '');
  return `https://world.openfoodfacts.org/cgi/product.pl?action=process&type=add&code=${cleanBarcode}`;
}
