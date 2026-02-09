import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, Leaf, TrendingUp, Heart, Loader2, X, AlertCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { getLoginUrl } from '@/const';
import ProductCard from '@/components/ProductCard';
import BarcodeScanner from '@/components/BarcodeScanner';
import ProductContributionDialog from '@/components/ProductContributionDialog';
import { useLocation } from 'wouter';
import ScanHistory from '@/components/ScanHistory';
import { addToScanHistory } from '@/lib/scanHistory';

export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [isScanLoading, setIsScanLoading] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const searchMutation = trpc.products.search.useQuery(
    { query: searchQuery, limit: 12 },
    { enabled: searchQuery.length > 2 }
  );

  const barcodeQuery = trpc.products.searchByBarcode.useQuery(
    { barcode: scannedBarcode || '' },
    { 
      enabled: !!scannedBarcode,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  const alternativesQuery = trpc.products.getAlternatives.useQuery(
    { barcode: selectedProduct?.barcode },
    { enabled: !!selectedProduct?.barcode && showAlternatives }
  );

  useEffect(() => {
    if (searchMutation.data) {
      setSearchResults(searchMutation.data);
      setIsSearching(false);
    }
  }, [searchMutation.data]);

  useEffect(() => {
    if (barcodeQuery.data && scannedBarcode) {
      handleProductClick(scannedBarcode);
      setScannedBarcode(null);
      setIsScanLoading(false);
    } else if (barcodeQuery.isError && scannedBarcode) {
      const errorMessage = barcodeQuery.error?.message || 'Unknown error';
      if (errorMessage.includes('not found') || errorMessage.includes('NOT_FOUND')) {
        // Show contribution dialog when product not found
        setSelectedProduct({ barcode: scannedBarcode, name: 'Unknown Product', isContribution: true });
      } else {
        console.error('[Home] Error searching product by barcode:', errorMessage);
      }
      setScannedBarcode(null);
      setIsScanLoading(false);
    }
  }, [barcodeQuery.data, barcodeQuery.isError, barcodeQuery.error, scannedBarcode]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsSearching(true);
  };

  const handleProductClick = (barcode: string) => {
    // Find the product from search results or alternatives
    const product = searchResults.find(p => p.barcode === barcode) || 
                   (selectedProduct?.alternatives?.find((alt: any) => alt.barcode === barcode));
    
    if (product) {
      addToScanHistory({
        barcode: product.barcode,
        name: product.name,
        brand: product.brand,
        ecoScore: product.ecoScore,
        ecoScoreGrade: product.ecoScoreGrade,
        imageUrl: product.imageUrl,
      });
    }
    setLocation(`/product/${barcode}`);
  };

  const handleScanHistorySelect = (barcode: string) => {
    setLocation(`/product/${barcode}`);
  };

  const handleBarcodeScanned = (barcode: string) => {
    setIsScanLoading(true);
    setScannedBarcode(barcode);
  };

  const getEcoScoreColor = (score: number | null | undefined) => {
    if (!score) return 'bg-gray-200';
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-lime-500';
    if (score >= 40) return 'bg-yellow-500';
    if (score >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getEcoScoreLabel = (score: number | null | undefined) => {
    if (!score) return 'N/A';
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Poor';
    return 'Very Poor';
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-green-500 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-8 h-8 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">EcoScore Finder</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" onClick={() => setLocation('/favorites')} className="gap-2">
                  <Heart className="w-5 h-5" />
                  Favorites
                </Button>
                <Button variant="ghost" onClick={() => setLocation('/dashboard')} className="gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Dashboard
                </Button>
                <Button variant="ghost" onClick={() => setLocation('/analytics')} className="gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Analytics
                </Button>
              </>
            ) : (
              <Button asChild>
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Discover Sustainable Products
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Make eco-conscious shopping decisions with real-time sustainability scores and find better alternatives that match your values.
          </p>
        </div>

        {/* Search and Scanner */}
        <div className="max-w-2xl mx-auto mb-12 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products by name or barcode..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none text-lg"
            />
          </div>
          <div className="flex justify-center">
            <BarcodeScanner onScan={handleBarcodeScanned} isLoading={isScanLoading} />
          </div>
        </div>

        {/* Feature Cards */}
        {searchQuery.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <Leaf className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Eco-Scores</h3>
              <p className="text-gray-600">Real-time sustainability ratings from 0-100</p>
            </Card>
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <TrendingUp className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Alternatives</h3>
              <p className="text-gray-600">Find better products at comparable prices</p>
            </Card>
            <Card className="p-8 text-center hover:shadow-lg transition-shadow">
              <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Save & Compare</h3>
              <p className="text-gray-600">Track favorites and compare side-by-side</p>
            </Card>
          </div>
        )}

        {/* Search Results */}
        {searchQuery.length > 2 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Search Results {searchMutation.isLoading && <Loader2 className="inline w-5 h-5 animate-spin ml-2" />}
            </h2>
            {searchMutation.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-green-500 rounded-full" />
                </div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map((product) => (
                  <Card
                    key={product.barcode}
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleProductClick(product.barcode)}
                  >
                    <div className="flex gap-4">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-24 h-24 object-cover rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{product.brand || 'Unknown Brand'}</p>
                        <p className="text-xs text-gray-500 mb-3">{product.category || 'Uncategorized'}</p>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className={`w-12 h-12 rounded-full ${getEcoScoreColor(product.ecoScore)} flex items-center justify-center text-white font-bold text-lg`}>
                              {product.ecoScore ?? 'N/A'}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-600">Eco-Score</p>
                              <p className="text-sm font-bold text-gray-900">{getEcoScoreLabel(product.ecoScore)}</p>
                            </div>
                          </div>
                          {product.price && (
                            <div className="text-sm font-semibold text-gray-900">
                              ${product.price}
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(product);
                              setShowAlternatives(true);
                            }}
                            className="ml-auto"
                          >
                            See Alternatives
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-gray-600 mb-4">No products found matching your search.</p>
                <p className="text-sm text-gray-500">Try searching with different keywords or use the barcode scanner.</p>
              </Card>
            )}
          </div>
        )}
      </section>

      {/* Alternatives Modal */}
      {showAlternatives && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Eco-Friendly Alternatives</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAlternatives(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-semibold text-gray-600 mb-2">ORIGINAL PRODUCT</p>
                <div className="flex gap-3">
                  {selectedProduct.imageUrl && (
                    <img
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{selectedProduct.name}</p>
                    <p className="text-sm text-gray-600">{selectedProduct.brand || 'Unknown Brand'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className={`w-8 h-8 rounded-full ${getEcoScoreColor(selectedProduct.ecoScore)} flex items-center justify-center text-white font-bold text-xs`}>
                        {selectedProduct.ecoScore ?? 'N/A'}
                      </div>
                      <span className="text-xs font-semibold text-gray-700">Eco-Score: {getEcoScoreLabel(selectedProduct.ecoScore)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Better Alternatives</h3>
                {alternativesQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin">
                      <div className="w-12 h-12 border-4 border-gray-200 border-t-green-500 rounded-full" />
                    </div>
                  </div>
                ) : alternativesQuery.data && alternativesQuery.data.length > 0 ? (
                  <div className="space-y-4">
                    {alternativesQuery.data.map((alt) => (
                      <Card
                        key={alt.barcode}
                        className="p-4 border-2 border-green-200 bg-green-50 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          handleProductClick(alt.barcode);
                          setShowAlternatives(false);
                        }}
                      >
                        <div className="flex gap-3">
                          {alt.imageUrl && (
                            <img
                              src={alt.imageUrl}
                              alt={alt.name}
                              className="w-16 h-16 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{alt.name}</h4>
                            <p className="text-sm text-gray-600">{alt.brand || 'Unknown Brand'}</p>
                            <div className="flex items-center gap-4 mt-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full ${getEcoScoreColor(alt.ecoScore)} flex items-center justify-center text-white font-bold text-xs`}>
                                  {alt.ecoScore ?? 'N/A'}
                                </div>
                                <span className="text-xs font-semibold text-gray-700">{getEcoScoreLabel(alt.ecoScore)}</span>
                              </div>
                              {alt.price && (
                                <div>
                                  <span className="text-sm font-semibold text-gray-900">${alt.price}</span>
                                  {selectedProduct.price && (
                                    <p className="text-xs text-gray-600 mt-1">
                                      {parseFloat(alt.price) < parseFloat(selectedProduct.price) ? '✓ Cheaper' : 'Similar price'}
                                    </p>
                                  )}
                                </div>
                              )}
                              {alt.ecoScore > (selectedProduct.ecoScore || 0) && (
                                <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                                  +{alt.ecoScore - (selectedProduct.ecoScore || 0)} better
                                </div>
                              )}
                            </div>
                          </div>
                          <Button size="sm" className="h-fit">
                            View
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center bg-gray-50">
                    <p className="text-gray-600">No better alternatives found for this product.</p>
                    <p className="text-sm text-gray-500 mt-2">This product already has an excellent eco-score!</p>
                  </Card>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {selectedProduct?.isContribution && (
        <ProductContributionDialog barcode={selectedProduct.barcode} />
      )}

      {/* Scan History Section */}
      {searchQuery.length === 0 && !selectedProduct && (
        <section className="container mx-auto px-4 py-12">
          <ScanHistory onProductSelect={handleScanHistorySelect} />
        </section>
      )}
    </div>
  );
}
