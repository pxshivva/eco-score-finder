import { createContext, useContext, useState, ReactNode } from 'react';

export interface BatchScannedProduct {
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  ecoScore?: number;
  ecoScoreGrade?: string;
  price?: string;
  imageUrl?: string;
  environmentalFootprint?: string;
  packagingSustainability?: string;
  carbonImpact?: string;
  scannedAt: number;
}

interface BatchScanContextType {
  isBatchMode: boolean;
  setIsBatchMode: (mode: boolean) => void;
  scannedProducts: BatchScannedProduct[];
  addScannedProduct: (product: BatchScannedProduct) => void;
  removeScannedProduct: (barcode: string) => void;
  clearScannedProducts: () => void;
  getScannedProductCount: () => number;
  getAverageEcoScore: () => number;
  getBestProduct: () => BatchScannedProduct | null;
  getWorstProduct: () => BatchScannedProduct | null;
}

const BatchScanContext = createContext<BatchScanContextType | undefined>(undefined);

export function BatchScanProvider({ children }: { children: ReactNode }) {
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [scannedProducts, setScannedProducts] = useState<BatchScannedProduct[]>([]);

  const addScannedProduct = (product: BatchScannedProduct) => {
    // Avoid duplicates - if barcode exists, update it
    setScannedProducts((prev) => {
      const existing = prev.findIndex((p) => p.barcode === product.barcode);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = product;
        return updated;
      }
      return [...prev, product];
    });
  };

  const removeScannedProduct = (barcode: string) => {
    setScannedProducts((prev) => prev.filter((p) => p.barcode !== barcode));
  };

  const clearScannedProducts = () => {
    setScannedProducts([]);
  };

  const getScannedProductCount = () => scannedProducts.length;

  const getAverageEcoScore = () => {
    if (scannedProducts.length === 0) return 0;
    const sum = scannedProducts.reduce((acc, p) => acc + (p.ecoScore || 0), 0);
    return Math.round((sum / scannedProducts.length) * 10) / 10;
  };

  const getBestProduct = () => {
    if (scannedProducts.length === 0) return null;
    return scannedProducts.reduce((best, current) => {
      const currentScore = current.ecoScore || 0;
      const bestScore = best.ecoScore || 0;
      return currentScore > bestScore ? current : best;
    });
  };

  const getWorstProduct = () => {
    if (scannedProducts.length === 0) return null;
    return scannedProducts.reduce((worst, current) => {
      const currentScore = current.ecoScore || 0;
      const worstScore = worst.ecoScore || 0;
      return currentScore < worstScore ? current : worst;
    });
  };

  return (
    <BatchScanContext.Provider
      value={{
        isBatchMode,
        setIsBatchMode,
        scannedProducts,
        addScannedProduct,
        removeScannedProduct,
        clearScannedProducts,
        getScannedProductCount,
        getAverageEcoScore,
        getBestProduct,
        getWorstProduct,
      }}
    >
      {children}
    </BatchScanContext.Provider>
  );
}

export function useBatchScan() {
  const context = useContext(BatchScanContext);
  if (!context) {
    throw new Error('useBatchScan must be used within BatchScanProvider');
  }
  return context;
}
