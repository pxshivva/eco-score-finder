import { useParams, useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Leaf, Heart, ArrowLeft, Share2, Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useState } from 'react';
import ProductCard from '@/components/ProductCard';

export default function ProductDetail() {
  const { barcode } = useParams<{ barcode: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showAddToComparison, setShowAddToComparison] = useState(false);

  const productQuery = trpc.products.searchByBarcode.useQuery(
    { barcode: barcode || '' },
    { enabled: !!barcode }
  );

  const alternativesQuery = trpc.products.getAlternatives.useQuery(
    { barcode: barcode || '', minSimilarity: 0.7 },
    { enabled: !!barcode && productQuery.isSuccess }
  );

  const isFavoriteQuery = trpc.favorites.isFavorite.useQuery(
    { productId: productQuery.data?.id || 0 },
    { enabled: !!user && !!productQuery.data?.id }
  );

  const addFavoriteMutation = trpc.favorites.add.useMutation({
    onSuccess: () => {
      isFavoriteQuery.refetch();
    },
  });

  const removeFavoriteMutation = trpc.favorites.remove.useMutation({
    onSuccess: () => {
      isFavoriteQuery.refetch();
    },
  });

  const product = productQuery.data;
  const alternatives = alternativesQuery.data || [];

  if (productQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 flex items-center justify-center">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-green-500 rounded-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
        <Button onClick={() => setLocation('/')}>Back to Search</Button>
      </div>
    );
  }

  const getEcoScoreColor = (score: number | null | undefined) => {
    if (!score) return 'bg-gray-200 text-gray-700';
    if (score >= 80) return 'bg-green-500 text-white';
    if (score >= 60) return 'bg-lime-500 text-white';
    if (score >= 40) return 'bg-yellow-500 text-white';
    if (score >= 20) return 'bg-orange-500 text-white';
    return 'bg-red-500 text-white';
  };

  const getEcoScoreLabel = (score: number | null | undefined) => {
    if (!score) return 'N/A';
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Poor';
    return 'Very Poor';
  };

  const handleFavoriteToggle = async () => {
    if (!user) {
      setLocation('/');
      return;
    }

    if (isFavoriteQuery.data) {
      removeFavoriteMutation.mutate({ productId: product.id! });
    } else {
      addFavoriteMutation.mutate({ productId: product.id! });
    }
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
          <h1 className="text-xl font-bold text-gray-900">Product Details</h1>
          <div className="w-12" />
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Image and Basic Info */}
          <div className="lg:col-span-1">
            <Card className="overflow-hidden sticky top-24">
              {/* Image */}
              <div className="relative h-80 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Leaf className="w-24 h-24 text-gray-300" />
                )}

                {/* Eco-Score Circle */}
                <div className={`absolute top-4 right-4 w-20 h-20 rounded-full ${getEcoScoreColor(product.ecoScore)} flex flex-col items-center justify-center font-bold shadow-lg`}>
                  <span className="text-3xl">{product.ecoScore ?? 'N/A'}</span>
                  <span className="text-xs">Score</span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-6">
                {product.ecoScoreGrade && (
                  <Badge className="mb-3 bg-green-100 text-green-800 hover:bg-green-100 text-sm">
                    Grade {product.ecoScoreGrade}
                  </Badge>
                )}

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h2>

                {product.brand && (
                  <p className="text-gray-600 mb-4">{product.brand}</p>
                )}

                {product.category && (
                  <p className="text-sm text-gray-500 mb-4">Category: {product.category}</p>
                )}

                {product.price && (
                  <p className="text-2xl font-bold text-gray-900 mb-6">${product.price}</p>
                )}

                {product.country && (
                  <p className="text-sm text-gray-600 mb-6">Origin: {product.country}</p>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleFavoriteToggle}
                    variant={isFavoriteQuery.data ? 'default' : 'outline'}
                    className="w-full gap-2"
                  >
                    <Heart className={`w-5 h-5 ${isFavoriteQuery.data ? 'fill-current' : ''}`} />
                    {isFavoriteQuery.data ? 'Saved' : 'Save to Favorites'}
                  </Button>

                  <Button
                    onClick={() => setShowAddToComparison(!showAddToComparison)}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add to Comparison
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Share2 className="w-5 h-5" />
                    Share
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Eco-Score Breakdown */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overall Score Card */}
            <Card className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Sustainability Score
              </h3>
              <p className="text-gray-600 mb-6">
                {getEcoScoreLabel(product.ecoScore)} - This product has a {getEcoScoreLabel(product.ecoScore).toLowerCase()} environmental impact.
              </p>

              {/* Score Breakdown */}
              <div className="space-y-6">
                {/* Environmental Footprint */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-900">
                      Environmental Footprint
                    </label>
                    <span className="text-sm font-bold text-gray-900">
                      {product.environmentalFootprint ?? 0}/100
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-400 to-green-600"
                      style={{ width: `${(product.environmentalFootprint ?? 0)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Measures the overall environmental impact of production and transportation.
                  </p>
                </div>

                {/* Packaging Sustainability */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-900">
                      Packaging Sustainability
                    </label>
                    <span className="text-sm font-bold text-gray-900">
                      {product.packagingSustainability ?? 0}/100
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                      style={{ width: `${(product.packagingSustainability ?? 0)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Evaluates the recyclability and eco-friendliness of packaging materials.
                  </p>
                </div>

                {/* Carbon Impact */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-900">
                      Carbon Impact
                    </label>
                    <span className="text-sm font-bold text-gray-900">
                      {product.carbonImpact ?? 0}/100
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-400 to-purple-600"
                      style={{ width: `${100 - (product.carbonImpact ?? 0)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Indicates the carbon emissions produced during manufacturing and shipping.
                  </p>
                </div>
              </div>
            </Card>

            {/* Alternatives Section */}
            {alternatives.length > 0 && (
              <Card className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Sustainable Alternatives
                </h3>
                <p className="text-gray-600 mb-6">
                  We found {alternatives.length} similar products with comparable sustainability scores.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {alternatives.slice(0, 4).map((alt) => (
                    <ProductCard
                      key={alt.barcode}
                      product={alt}
                      onClick={() => setLocation(`/product/${alt.barcode}`)}
                    />
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
