import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Download, Trash2, X, Zap, Share2, Copy, Mail, MessageCircle } from 'lucide-react';
import { useBatchScan } from '@/contexts/BatchScanContext';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import { trpc } from '@/lib/trpc';

export default function BatchComparison() {
  const [, setLocation] = useLocation();
  const { 
    scannedProducts, 
    removeScannedProduct, 
    clearScannedProducts, 
    getAverageEcoScore,
    getBestProduct,
    getWorstProduct 
  } = useBatchScan();
  const [sortBy, setSortBy] = useState<'name' | 'ecoScore' | 'price'>('ecoScore');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareTitle, setShareTitle] = useState('My Batch Comparison');
  const [shareDescription, setShareDescription] = useState('');
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const createBatchShareMutation = trpc.batchShare.create.useMutation();

  if (scannedProducts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
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
            <h1 className="text-xl font-bold text-gray-900">Batch Comparison</h1>
            <div className="w-12" />
          </div>
        </header>

        <div className="container mx-auto px-4 py-12">
          <Card className="p-12 text-center">
            <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Products to Compare</h2>
            <p className="text-gray-600 mb-6">
              Enable batch mode and scan or search for products to start comparing.
            </p>
            <Button onClick={() => setLocation('/')}>
              Return to Home
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const sortedProducts = [...scannedProducts].sort((a, b) => {
    switch (sortBy) {
      case 'ecoScore':
        return (b.ecoScore || 0) - (a.ecoScore || 0);
      case 'price':
        return parseFloat(a.price || '0') - parseFloat(b.price || '0');
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      default:
        return 0;
    }
  });

  const averageScore = getAverageEcoScore();
  const bestProduct = getBestProduct();
  const worstProduct = getWorstProduct();

  const handleRemoveProduct = (barcode: string) => {
    removeScannedProduct(barcode);
    showSuccessToast('Product removed from batch');
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all products from the batch?')) {
      clearScannedProducts();
      showSuccessToast('All products cleared');
      setLocation('/');
    }
  };

  const handleCreateShare = async () => {
    setIsSharing(true);
    try {
      const result = await createBatchShareMutation.mutateAsync({
        productBarcodes: scannedProducts.map(p => p.barcode),
        title: shareTitle,
        description: shareDescription,
      });
      
      if (result.shareToken) {
        const url = `${window.location.origin}/shared/${result.shareToken}`;
        setShareLink(url);
        showSuccessToast('Batch shared successfully!');
      }
    } catch (error) {
      showErrorToast('Failed to create share link');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyShareLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      showSuccessToast('Link copied to clipboard');
    }
  };

  const handleShareViaEmail = () => {
    if (shareLink) {
      const subject = encodeURIComponent(`Check out my batch comparison: ${shareTitle}`);
      const body = encodeURIComponent(`I found some great products to compare! Check out my batch comparison:\n\n${shareLink}\n\nDescription: ${shareDescription}`);
      window.open(`mailto:?subject=${subject}&body=${body}`);
    }
  };

  const handleShareViaTwitter = () => {
    if (shareLink) {
      const text = encodeURIComponent(`Check out my eco-friendly product batch comparison! ${shareLink}`);
      window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Brand', 'Category', 'Eco-Score', 'Grade', 'Price', 'Environmental Footprint', 'Packaging Sustainability', 'Carbon Impact'];
    const rows = scannedProducts.map(p => [
      p.name,
      p.brand || 'N/A',
      p.category || 'N/A',
      p.ecoScore || 'N/A',
      p.ecoScoreGrade || 'N/A',
      p.price || 'N/A',
      p.environmentalFootprint || 'N/A',
      p.packagingSustainability || 'N/A',
      p.carbonImpact || 'N/A',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-comparison-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showSuccessToast('Comparison exported as CSV');
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
          <Button
            variant="ghost"
            onClick={() => setLocation('/')}
            className="gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Batch Comparison</h1>
          <div className="w-12" />
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 bg-white">
            <p className="text-gray-600 text-sm font-medium">Total Products</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{scannedProducts.length}</p>
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
            <p className="text-gray-600 text-sm font-medium">Score Range</p>
            <p className="text-sm text-gray-900 mt-2">
              Best: {bestProduct?.ecoScore || 'N/A'} | Worst: {worstProduct?.ecoScore || 'N/A'}
            </p>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'ecoScore' | 'price')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none text-sm"
            >
              <option value="ecoScore">Eco-Score (High to Low)</option>
              <option value="price">Price (Low to High)</option>
              <option value="name">Name (A to Z)</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowShareDialog(true)}
              className="gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="gap-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Product</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Brand</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Eco-Score</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Price</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map((product) => (
                <tr key={product.barcode} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <span className="text-sm font-medium text-gray-900 truncate">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{product.brand || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{product.category || 'N/A'}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-8 h-8 rounded-full ${getEcoScoreColor(product.ecoScore)} flex items-center justify-center text-white font-bold text-xs`}>
                        {product.ecoScore ?? 'N/A'}
                      </div>
                      <span className="text-xs font-semibold text-gray-900">{product.ecoScoreGrade || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{product.price ? `$${product.price}` : 'N/A'}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleRemoveProduct(product.barcode)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors"
                      title="Remove product"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Details Grid */}
        {scannedProducts.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Best Product */}
            {bestProduct && (
              <Card className="p-6 bg-green-50 border-green-200">
                <h3 className="text-lg font-bold text-green-900 mb-3">Best Product</h3>
                <p className="text-sm text-green-800 font-medium">{bestProduct.name}</p>
                <p className="text-xs text-green-700 mt-1">{bestProduct.brand || 'Unknown Brand'}</p>
                <div className="flex items-center gap-3 mt-3">
                  <div className={`w-10 h-10 rounded-full ${getEcoScoreColor(bestProduct.ecoScore)} flex items-center justify-center text-white font-bold text-sm`}>
                    {bestProduct.ecoScore ?? 'N/A'}
                  </div>
                  <span className="text-sm font-semibold text-green-900">{getEcoScoreLabel(bestProduct.ecoScore)}</span>
                </div>
              </Card>
            )}

            {/* Worst Product */}
            {worstProduct && (
              <Card className="p-6 bg-red-50 border-red-200">
                <h3 className="text-lg font-bold text-red-900 mb-3">Lowest Eco-Score</h3>
                <p className="text-sm text-red-800 font-medium">{worstProduct.name}</p>
                <p className="text-xs text-red-700 mt-1">{worstProduct.brand || 'Unknown Brand'}</p>
                <div className="flex items-center gap-3 mt-3">
                  <div className={`w-10 h-10 rounded-full ${getEcoScoreColor(worstProduct.ecoScore)} flex items-center justify-center text-white font-bold text-sm`}>
                    {worstProduct.ecoScore ?? 'N/A'}
                  </div>
                  <span className="text-sm font-semibold text-red-900">{getEcoScoreLabel(worstProduct.ecoScore)}</span>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Share Dialog */}
        {showShareDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Share Batch Comparison</h2>
                <button
                  onClick={() => {
                    setShowShareDialog(false);
                    setShareLink(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!shareLink ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={shareTitle}
                      onChange={(e) => setShareTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none"
                      placeholder="My Batch Comparison"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                    <textarea
                      value={shareDescription}
                      onChange={(e) => setShareDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-100 focus:outline-none text-sm"
                      placeholder="Add a description..."
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={handleCreateShare}
                    disabled={isSharing}
                    className="w-full gap-2"
                  >
                    {isSharing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        Create Share Link
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-900 mb-2">✓ Share link created!</p>
                    <div className="flex items-center gap-2 mb-4">
                      <input
                        type="text"
                        value={shareLink}
                        readOnly
                        className="flex-1 px-3 py-2 border border-green-300 rounded-lg bg-white text-sm text-gray-900 font-mono"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyShareLink}
                        className="gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Share via:</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShareViaEmail}
                      className="w-full gap-2 justify-start"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShareViaTwitter}
                      className="w-full gap-2 justify-start"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Twitter
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowShareDialog(false);
                      setShareLink(null);
                    }}
                    className="w-full"
                  >
                    Done
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
