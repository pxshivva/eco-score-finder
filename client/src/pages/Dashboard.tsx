import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, BarChart3, Heart, TrendingUp, Settings } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { getLoginUrl } from '@/const';

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const favoritesQuery = trpc.favorites.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const preferencesQuery = trpc.preferences.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 flex flex-col items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
          <p className="text-gray-600 mb-6">
            Please sign in to view your sustainability dashboard.
          </p>
          <Button asChild>
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </Card>
      </div>
    );
  }

  const favorites = favoritesQuery.data || [];
  const preferences = preferencesQuery.data;

  // Calculate average eco-score
  const averageEcoScore = favorites.length > 0
    ? Math.round(
        favorites.reduce((sum, p) => sum + (p.ecoScore || 0), 0) / favorites.length
      )
    : 0;

  // Count products by grade
  const gradeDistribution = {
    A: favorites.filter(p => p.ecoScoreGrade === 'A').length,
    B: favorites.filter(p => p.ecoScoreGrade === 'B').length,
    C: favorites.filter(p => p.ecoScoreGrade === 'C').length,
    D: favorites.filter(p => p.ecoScoreGrade === 'D').length,
    E: favorites.filter(p => p.ecoScoreGrade === 'E').length,
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
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <Button
            variant="ghost"
            onClick={() => setLocation('/settings')}
            className="gap-2"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {user?.name || 'User'}!
          </h2>
          <p className="text-gray-600">
            Track your sustainable shopping journey and discover eco-friendly alternatives.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Total Saved Products */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-600">Saved Products</h3>
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{favorites.length}</p>
            <p className="text-xs text-gray-500 mt-2">Total favorites tracked</p>
          </Card>

          {/* Average Eco-Score */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-600">Avg. Eco-Score</h3>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{averageEcoScore}</p>
            <p className="text-xs text-gray-500 mt-2">Out of 100</p>
          </Card>

          {/* Top Grade */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-600">Top Grade</h3>
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {gradeDistribution.A > 0 ? 'A' : gradeDistribution.B > 0 ? 'B' : 'N/A'}
            </p>
            <p className="text-xs text-gray-500 mt-2">Highest grade in collection</p>
          </Card>
        </div>

        {/* Grade Distribution */}
        <Card className="p-8 mb-12">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Grade Distribution
          </h3>
          <div className="space-y-4">
            {Object.entries(gradeDistribution).map(([grade, count]) => (
              <div key={grade}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">Grade {grade}</span>
                  <span className="text-sm text-gray-600">{count} products</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-green-600"
                    style={{ width: `${(count / (favorites.length || 1)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Explore More
            </h3>
            <p className="text-gray-600 mb-6">
              Discover new sustainable products and expand your eco-friendly collection.
            </p>
            <Button onClick={() => setLocation('/')} className="w-full">
              Search Products
            </Button>
          </Card>

          <Card className="p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              View Favorites
            </h3>
            <p className="text-gray-600 mb-6">
              Review all your saved products and manage your sustainability choices.
            </p>
            <Button onClick={() => setLocation('/favorites')} className="w-full">
              View Favorites
            </Button>
          </Card>

          <Card className="p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Get Recommendations
            </h3>
            <p className="text-gray-600 mb-6">
              Receive personalized eco-friendly shopping tips and insights.
            </p>
            <Button onClick={() => setLocation('/recommendations')} className="w-full">
              View Recommendations
            </Button>
          </Card>
        </div>

        {/* Preferences Info */}
        {preferences && (
          <Card className="p-8 mt-12 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Your Preferences
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-semibold">Price Drop Notifications:</span>{' '}
                {preferences.enablePriceDropNotifications ? 'Enabled' : 'Disabled'}
              </p>
              <p>
                <span className="font-semibold">New Alternatives:</span>{' '}
                {preferences.enableNewAlternativeNotifications ? 'Enabled' : 'Disabled'}
              </p>
              <p>
                <span className="font-semibold">Minimum Eco-Score:</span>{' '}
                {preferences.minEcoScore || 50}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setLocation('/settings')}
              className="mt-4 w-full"
            >
              Update Preferences
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
