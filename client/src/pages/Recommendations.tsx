import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Lightbulb, RefreshCw } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useState } from 'react';
import { getLoginUrl } from '@/const';
import { Streamdown } from 'streamdown';

export default function Recommendations() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'personalized' | 'tips'>('personalized');

  const personalizedQuery = trpc.recommendations.getPersonalized.useQuery(undefined, {
    enabled: isAuthenticated && activeTab === 'personalized',
  });

  const tipsQuery = trpc.recommendations.getShoppingTips.useQuery(undefined, {
    enabled: isAuthenticated && activeTab === 'tips',
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 flex flex-col items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
          <p className="text-gray-600 mb-6">
            Please sign in to get personalized eco-friendly recommendations.
          </p>
          <Button asChild>
            <a href={getLoginUrl()}>Sign In</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setLocation('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Recommendations</h1>
          <div className="w-12" />
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Tabs */}
        <div className="flex gap-4 mb-8">
          <Button
            onClick={() => setActiveTab('personalized')}
            variant={activeTab === 'personalized' ? 'default' : 'outline'}
            className="gap-2"
          >
            <Lightbulb className="w-4 h-4" />
            Personalized Tips
          </Button>
          <Button
            onClick={() => setActiveTab('tips')}
            variant={activeTab === 'tips' ? 'default' : 'outline'}
            className="gap-2"
          >
            <Lightbulb className="w-4 h-4" />
            General Tips
          </Button>
        </div>

        {/* Personalized Recommendations */}
        {activeTab === 'personalized' && (
          <Card className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Your Personalized Recommendations
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => personalizedQuery.refetch()}
                disabled={personalizedQuery.isLoading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${personalizedQuery.isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {personalizedQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-green-500 rounded-full" />
                </div>
              </div>
            ) : personalizedQuery.data?.success ? (
              <div className="prose prose-sm max-w-none">
                <Streamdown>
                  {personalizedQuery.data.recommendations}
                </Streamdown>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  {personalizedQuery.data?.recommendations || 'Unable to generate recommendations'}
                </p>
                <Button onClick={() => personalizedQuery.refetch()}>
                  Try Again
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* General Shopping Tips */}
        {activeTab === 'tips' && (
          <Card className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Eco-Friendly Shopping Tips
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => tipsQuery.refetch()}
                disabled={tipsQuery.isLoading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${tipsQuery.isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {tipsQuery.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin">
                  <div className="w-12 h-12 border-4 border-gray-200 border-t-green-500 rounded-full" />
                </div>
              </div>
            ) : tipsQuery.data?.success ? (
              <div className="prose prose-sm max-w-none">
                <Streamdown>
                  {tipsQuery.data.tips}
                </Streamdown>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  {tipsQuery.data?.tips || 'Unable to generate tips'}
                </p>
                <Button onClick={() => tipsQuery.refetch()}>
                  Try Again
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <Card className="p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              View Your Favorites
            </h3>
            <p className="text-gray-600 mb-6">
              Review all your saved sustainable products and track your eco-friendly choices.
            </p>
            <Button onClick={() => setLocation('/favorites')} className="w-full">
              View Favorites
            </Button>
          </Card>

          <Card className="p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Compare Products
            </h3>
            <p className="text-gray-600 mb-6">
              Analyze multiple products side-by-side to make informed sustainable choices.
            </p>
            <Button onClick={() => setLocation('/comparison')} className="w-full">
              Compare Products
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
