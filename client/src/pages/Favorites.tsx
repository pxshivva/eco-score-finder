import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Heart } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import ProductCard from '@/components/ProductCard';
import { getLoginUrl } from '@/const';

export default function Favorites() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const favoritesQuery = trpc.favorites.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const removeFavoriteMutation = trpc.favorites.remove.useMutation({
    onSuccess: () => {
      favoritesQuery.refetch();
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 flex flex-col items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
          <p className="text-gray-600 mb-6">
            Please sign in to view your saved favorite products.
          </p>
          <Button asChild>
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </Card>
      </div>
    );
  }

  const favorites = favoritesQuery.data || [];

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
          <h1 className="text-xl font-bold text-gray-900">Saved Products</h1>
          <div className="w-12" />
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        {favoritesQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-green-500 rounded-full" />
            </div>
          </div>
        ) : favorites.length > 0 ? (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Your Favorites
            </h2>
            <p className="text-gray-600 mb-8">
              You have {favorites.length} saved product{favorites.length !== 1 ? 's' : ''}.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((product) => {
                const productData = {
                  id: product.id,
                  barcode: product.barcode,
                  name: product.name,
                  brand: product.brand || undefined,
                  category: product.category || undefined,
                  ecoScore: product.ecoScore || undefined,
                  ecoScoreGrade: product.ecoScoreGrade || undefined,
                  environmentalFootprint: product.environmentalFootprint || undefined,
                  packagingSustainability: product.packagingSustainability || undefined,
                  carbonImpact: product.carbonImpact || undefined,
                  imageUrl: product.imageUrl || undefined,
                  price: product.price?.toString(),
                };
                return (
                  <ProductCard
                    key={product.barcode}
                    product={productData}
                    isFavorite={true}
                    onClick={() => setLocation(`/product/${product.barcode}`)}
                    onFavoriteToggle={(isFavorite) => {
                      if (!isFavorite && product.id) {
                        removeFavoriteMutation.mutate({ productId: product.id });
                      }
                    }}
                  />
                );
              })}
            </div>
          </>
        ) : (
          <Card className="p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Favorites Yet
            </h2>
            <p className="text-gray-600 mb-6">
              Start exploring products and save your favorites to track sustainable choices.
            </p>
            <Button onClick={() => setLocation('/')}>
              Explore Products
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
