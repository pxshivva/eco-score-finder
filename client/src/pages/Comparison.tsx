import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useState } from 'react';
import { getLoginUrl } from '@/const';

export default function Comparison() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const comparisonsQuery = trpc.comparisons.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const searchQuery_trpc = trpc.products.search.useQuery(
    { query: searchQuery, limit: 10 },
    { enabled: searchQuery.length > 2 }
  );

  const createComparisonMutation = trpc.comparisons.create.useMutation({
    onSuccess: () => {
      comparisonsQuery.refetch();
      setSelectedProducts([]);
      setSearchQuery('');
    },
  });

  const deleteComparisonMutation = trpc.comparisons.delete.useMutation({
    onSuccess: () => {
      comparisonsQuery.refetch();
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 flex flex-col items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <Plus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
          <p className="text-gray-600 mb-6">
            Please sign in to create and manage product comparisons.
          </p>
          <Button asChild>
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </Card>
      </div>
    );
  }

  const comparisons = comparisonsQuery.data || [];

  const handleAddProduct = (product: any) => {
    const productId = product.id || product.barcode;
    if (!selectedProducts.includes(productId)) {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const handleRemoveProduct = (productId: number) => {
    setSelectedProducts(selectedProducts.filter(id => id !== productId));
  };

  const handleCreateComparison = async () => {
    if (selectedProducts.length < 2) {
      alert('Please select at least 2 products to compare');
      return;
    }

    const name = prompt('Give this comparison a name (e.g., "Dairy Alternatives")');
    if (!name) return;

    createComparisonMutation.mutate({
      name,
      productIds: selectedProducts,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Compare Products</h1>
          <div className="w-12" />
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Create New Comparison */}
        <Card className="p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Create New Comparison
          </h2>

          {/* Search Products */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Search Products
            </label>
            <input
              type="text"
              placeholder="Search by product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-green-500 focus:ring-0"
            />
          </div>

          {/* Search Results */}
          {searchQuery.length > 2 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Search Results
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {searchQuery_trpc.data?.map((product) => (
                  <div
                    key={product.barcode}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-600">
                        Score: {product.ecoScore || 'N/A'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddProduct(product)}
                      disabled={selectedProducts.includes((product as any).id || product.barcode)}
                    >
                      {selectedProducts.includes((product as any).id || product.barcode) ? 'Added' : 'Add'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Products */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Selected Products ({selectedProducts.length})
            </h3>
            {selectedProducts.length > 0 ? (
              <div className="space-y-2">
                {selectedProducts.map((productId) => {
                  const product = searchQuery_trpc.data?.find(p => ((p as any).id || p.barcode) === productId);
                  return (
                    <div
                      key={productId}
                      className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <p className="font-medium text-gray-900">
                        {product?.name || `Product ${productId}`}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveProduct(productId)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No products selected yet</p>
            )}
          </div>

          {/* Create Button */}
          <Button
            onClick={handleCreateComparison}
            disabled={selectedProducts.length < 2}
            className="w-full"
          >
            Create Comparison
          </Button>
        </Card>

        {/* Saved Comparisons */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Your Comparisons
          </h2>

          {comparisonsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-green-500 rounded-full" />
              </div>
            </div>
          ) : comparisons.length > 0 ? (
            <div className="space-y-4">
              {comparisons.map((comparison) => (
                <Card key={comparison.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {comparison.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {comparison.productIds.length} products
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          // TODO: Navigate to detailed comparison view
                        }}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() =>
                          deleteComparisonMutation.mutate({
                            comparisonId: comparison.id,
                          })
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Plus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No Comparisons Yet
              </h3>
              <p className="text-gray-600">
                Create your first comparison to analyze products side-by-side.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
