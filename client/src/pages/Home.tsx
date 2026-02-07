import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Leaf, TrendingUp, Heart } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { getLoginUrl } from '@/const';
import ProductCard from '@/components/ProductCard';
import { useLocation } from 'wouter';

export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [, setLocation] = useLocation();

  const searchMutation = trpc.products.search.useQuery(
    { query: searchQuery, limit: 12 },
    { enabled: searchQuery.length > 2 }
  );

  useEffect(() => {
    if (searchMutation.data) {
      setSearchResults(searchMutation.data);
    }
  }, [searchMutation.data]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsSearching(true);
  };

  const handleProductClick = (barcode: string) => {
    setLocation(`/product/${barcode}`);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">EcoScore Finder</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setLocation('/favorites')}
                  className="gap-2"
                >
                  <Heart className="w-5 h-5" />
                  Favorites
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setLocation('/dashboard')}
                >
                  Dashboard
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
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Discover Sustainable Products
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Make eco-conscious shopping decisions with real-time sustainability scores and find better alternatives that match your values.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products by name or barcode..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-12 pr-4 py-3 text-lg rounded-lg border-2 border-gray-200 focus:border-green-500 focus:ring-0"
              />
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Leaf className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Eco-Scores</h3>
              <p className="text-sm text-gray-600">Real-time sustainability ratings from 0-100</p>
            </Card>
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Alternatives</h3>
              <p className="text-sm text-gray-600">Find better products at comparable prices</p>
            </Card>
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Save & Compare</h3>
              <p className="text-sm text-gray-600">Track favorites and compare side-by-side</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Search Results */}
      {searchQuery.length > 2 && (
        <section className="py-12 px-4">
          <div className="container mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Search Results {searchResults.length > 0 && `(${searchResults.length})`}
            </h3>
            {searchMutation.isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-green-500 rounded-full" />
                </div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((product) => (
                  <ProductCard
                    key={product.barcode}
                    product={product}
                    onClick={() => handleProductClick(product.barcode)}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-gray-600">No products found. Try a different search.</p>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      {searchQuery.length === 0 && (
        <section className="py-12 px-4 bg-white/50">
          <div className="container mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              How It Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 text-lg font-bold text-green-600">
                  1
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Search</h4>
                <p className="text-sm text-gray-600">Find any product by name or barcode</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 text-lg font-bold text-green-600">
                  2
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">View Score</h4>
                <p className="text-sm text-gray-600">See detailed sustainability breakdown</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 text-lg font-bold text-green-600">
                  3
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Find Alternatives</h4>
                <p className="text-sm text-gray-600">Discover better eco-friendly options</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 text-lg font-bold text-green-600">
                  4
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Save & Track</h4>
                <p className="text-sm text-gray-600">Build your sustainable shopping list</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
