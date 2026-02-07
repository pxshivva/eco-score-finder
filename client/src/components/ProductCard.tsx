import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Leaf } from 'lucide-react';
import { useState } from 'react';

interface ProductCardProps {
  product: {
    id?: number;
    barcode: string;
    name: string;
    brand?: string;
    category?: string;
    ecoScore?: number;
    ecoScoreGrade?: string;
    environmentalFootprint?: number;
    packagingSustainability?: number;
    carbonImpact?: number;
    imageUrl?: string;
    price?: string;
  };
  onClick?: () => void;
  onFavoriteToggle?: (isFavorite: boolean) => void;
  isFavorite?: boolean;
}

export default function ProductCard({
  product,
  onClick,
  onFavoriteToggle,
  isFavorite: initialIsFavorite = false,
}: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);

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

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isFavorite;
    setIsFavorite(newState);
    onFavoriteToggle?.(newState);
  };

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Leaf className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* Eco-Score Badge */}
        <div className={`absolute top-3 right-3 w-14 h-14 rounded-full ${getEcoScoreColor(product.ecoScore)} flex items-center justify-center font-bold text-lg shadow-lg`}>
          {product.ecoScore ?? 'N/A'}
        </div>

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-3 left-3 p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
        >
          <Heart
            className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Grade Badge */}
        {product.ecoScoreGrade && (
          <Badge className="mb-2 bg-green-100 text-green-800 hover:bg-green-100">
            Grade {product.ecoScoreGrade}
          </Badge>
        )}

        {/* Product Name */}
        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
          {product.name}
        </h3>

        {/* Brand */}
        {product.brand && (
          <p className="text-xs text-gray-500 mb-3">{product.brand}</p>
        )}

        {/* Score Label */}
        <p className="text-xs font-medium text-gray-600 mb-3">
          {getEcoScoreLabel(product.ecoScore)}
        </p>

        {/* Score Components */}
        <div className="space-y-2 mb-3">
          {product.environmentalFootprint !== undefined && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Environmental</span>
              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${product.environmentalFootprint}%` }}
                />
              </div>
            </div>
          )}
          {product.packagingSustainability !== undefined && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Packaging</span>
              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${product.packagingSustainability}%` }}
                />
              </div>
            </div>
          )}
          {product.carbonImpact !== undefined && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Carbon</span>
              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500"
                  style={{ width: `${100 - product.carbonImpact}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Price */}
        {product.price && (
          <p className="text-sm font-semibold text-gray-900">${product.price}</p>
        )}
      </div>
    </Card>
  );
}
