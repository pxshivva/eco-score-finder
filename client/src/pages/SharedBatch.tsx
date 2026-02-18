import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Share2, Eye, Calendar } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { showErrorToast, showSuccessToast } from '@/lib/toast';

export default function SharedBatch() {
  const [match, params] = useRoute('/shared/:token');
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [share, setShare] = useState<any>(null);

  const batchShareQuery = trpc.batchShare.getByToken.useQuery(
    { shareToken: params?.token || '' },
    { 
      enabled: !!params?.token,
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  const searchProductQuery = trpc.products.searchByBarcode.useQuery(
    { barcode: '' },
    { enabled: false }
  );

  useEffect(() => {
    const loadBatch = async () => {
      if (batchShareQuery.data) {
        setShare(batchShareQuery.data);
        setIsLoading(false);
        
        // Fetch product details for each barcode
        const barcodes = batchShareQuery.data.productBarcodes || [];
        const productDetails = await Promise.all(
          barcodes.map(async (barcode: string) => {
            try {
              const result = await fetch(`/api/trpc/products.searchByBarcode?input=${JSON.stringify({ barcode })}`);
              const data = await result.json();
              return data.result?.data || null;
            } catch {
              return null;
            }
          })
        );
        setProducts(productDetails.filter(Boolean));
      } else if (batchShareQuery.isError) {
        showErrorToast('Batch not found or has expired');
        setIsLoading(false);
      }
    };

    loadBatch();
  }, [batchShareQuery.data, batchShareQuery.isError]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-green-500 rounded-full" />
        </div>
      </div>
    );
  }

  if (!share) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
        <div className="container mx-auto px-4 py-12">
          <Card className="p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Batch Not Found</h2>
            <p className="text-gray-600 mb-6">This batch comparison has expired or is no longer available.</p>
            <Button onClick={() => window.location.href = '/'}>
              Return to Home
            </Button>
          </Card>
        </div>
      </div>
    );
  }

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

  const averageScore = products.length > 0
    ? products.reduce((sum, p) => sum + (p?.ecoScore || 0), 0) / products.length
    : 0;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/shared/${share.shareToken}`;
    navigator.clipboard.writeText(url);
    showSuccessToast('Link copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{share.title || 'Batch Comparison'}</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-2"
            >
              <Share2 className="w-4 h-4" />
              Copy Link
            </Button>
          </div>
          {share.description && (
            <p className="text-gray-600 text-sm">{share.description}</p>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 bg-white">
            <p className="text-gray-600 text-sm font-medium">Total Products</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{products.length}</p>
          </Card>
          <Card className="p-6 bg-white">
            <p className="text-gray-600 text-sm font-medium">Average Eco-Score</p>
            <div className="flex items-center gap-3 mt-2">
              <div className={`w-12 h-12 rounded-full ${getEcoScoreColor(averageScore)} flex items-center justify-center text-white font-bold`}>
                {averageScore.toFixed(1)}
              </div>
              <span className="text-sm font-semibold text-gray-900">{getEcoScoreLabel(averageScore)}</span>
            </div>
          </Card>
          <Card className="p-6 bg-white">
            <p className="text-gray-600 text-sm font-medium">Views</p>
            <div className="flex items-center gap-2 mt-2">
              <Eye className="w-5 h-5 text-blue-600" />
              <p className="text-2xl font-bold text-gray-900">{share.viewCount}</p>
            </div>
          </Card>
          <Card className="p-6 bg-white">
            <p className="text-gray-600 text-sm font-medium">Shared</p>
            <div className="flex items-center gap-2 mt-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <p className="text-sm font-semibold text-gray-900">
                {new Date(share.createdAt).toLocaleDateString()}
              </p>
            </div>
          </Card>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, idx) => (
              <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{product.brand || 'Unknown Brand'}</p>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full ${getEcoScoreColor(product.ecoScore)} flex items-center justify-center text-white font-bold text-sm`}>
                    {product.ecoScore ?? 'N/A'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-600">Eco-Score</p>
                    <p className="text-sm font-bold text-gray-900">{getEcoScoreLabel(product.ecoScore)}</p>
                  </div>
                </div>

                {product.price && (
                  <p className="text-sm font-semibold text-gray-900 mb-3">Price: ${product.price}</p>
                )}

                {product.environmentalFootprint && (
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>Environmental: {product.environmentalFootprint}</p>
                    {product.packagingSustainability && (
                      <p>Packaging: {product.packagingSustainability}</p>
                    )}
                    {product.carbonImpact && (
                      <p>Carbon: {product.carbonImpact}</p>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-gray-600">No products in this batch.</p>
          </Card>
        )}

        {/* Share Info */}
        <Card className="mt-12 p-6 bg-blue-50 border-blue-200">
          <h3 className="font-bold text-blue-900 mb-2">Share This Batch</h3>
          <p className="text-sm text-blue-800 mb-4">
            Copy the link below to share this batch comparison with others:
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={`${window.location.origin}/shared/${share.shareToken}`}
              readOnly
              className="flex-1 px-3 py-2 border border-blue-300 rounded-lg bg-white text-sm text-gray-900"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-2"
            >
              <Share2 className="w-4 h-4" />
              Copy
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
