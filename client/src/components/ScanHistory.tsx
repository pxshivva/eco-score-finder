import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, History, Heart } from 'lucide-react';
import { getScanHistory, clearScanHistory, removeFromScanHistory, type ScanHistoryItem } from '@/lib/scanHistory';
import { addToFavorites, removeFromFavorites, isInFavorites } from '@/lib/favorites';

interface ScanHistoryProps {
  onProductSelect: (barcode: string) => void;
}

function getEcoScoreColor(score: number): string {
  if (score >= 75) return 'bg-green-500';
  if (score >= 50) return 'bg-yellow-500';
  if (score >= 25) return 'bg-orange-500';
  return 'bg-red-500';
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function ScanHistory({ onProductSelect }: ScanHistoryProps) {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    setIsLoading(true);
    const items = getScanHistory();
    setHistory(items);
    
    const favSet = new Set<string>();
    items.forEach(item => {
      if (isInFavorites(item.barcode)) {
        favSet.add(item.barcode);
      }
    });
    setFavorites(favSet);
    setIsLoading(false);
  }, []);

  const handleProductClick = (barcode: string) => {
    onProductSelect(barcode);
  };

  const handleRemoveItem = (barcode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromScanHistory(barcode);
    setHistory(history.filter(item => item.barcode !== barcode));
  };

  const handleToggleFavorite = (item: ScanHistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const isFav = favorites.has(item.barcode);
    
    if (isFav) {
      removeFromFavorites(item.barcode);
      const newFavs = new Set(favorites);
      newFavs.delete(item.barcode);
      setFavorites(newFavs);
    } else {
      addToFavorites({
        productId: 0,
        barcode: item.barcode,
        name: item.name,
        brand: item.brand,
        ecoScore: item.ecoScore,
        ecoScoreGrade: item.ecoScoreGrade,
        imageUrl: item.imageUrl,
      });
      const newFavs = new Set(favorites);
      newFavs.add(item.barcode);
      setFavorites(newFavs);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all scan history?')) {
      clearScanHistory();
      setHistory([]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="p-8 text-center bg-gray-50">
        <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">No scan history yet</p>
        <p className="text-sm text-gray-500 mt-2">
          Scanned products will appear here for quick access
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Recent Scans</h3>
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">
            {history.length}
          </span>
        </div>
        {history.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearHistory}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {history.map((item) => (
          <Card
            key={item.barcode}
            className="p-3 cursor-pointer hover:shadow-md transition-shadow border-2 border-gray-200 hover:border-green-300"
            onClick={() => handleProductClick(item.barcode)}
          >
            <div className="space-y-2">
              {item.imageUrl && (
                <div className="w-full h-24 bg-gray-100 rounded overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div>
                <h4 className="text-xs font-semibold text-gray-900 line-clamp-2">
                  {item.name}
                </h4>
                {item.brand && (
                  <p className="text-xs text-gray-600 line-clamp-1">
                    {item.brand}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className={`w-7 h-7 rounded-full ${getEcoScoreColor(item.ecoScore)} flex items-center justify-center text-white font-bold text-xs`}>
                  {item.ecoScore}
                </div>
                <span className="text-xs text-gray-500">
                  {formatTimeAgo(item.timestamp)}
                </span>
              </div>

              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleToggleFavorite(item, e)}
                  className={`flex-1 h-7 text-xs ${
                    favorites.has(item.barcode)
                      ? 'text-red-600 bg-red-50 hover:bg-red-100'
                      : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                  }`}
                >
                  <Heart className={`w-3 h-3 mr-1 ${favorites.has(item.barcode) ? 'fill-current' : ''}`} />
                  {favorites.has(item.barcode) ? 'Saved' : 'Save'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleRemoveItem(item.barcode, e)}
                  className="flex-1 h-7 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
