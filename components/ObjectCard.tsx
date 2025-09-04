/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Product } from '../components/types';

interface ObjectCardProps {
  product: Product;
  isSelected: boolean;
  onClick?: () => void;
}

const ObjectCard: React.FC<ObjectCardProps> = ({
  product,
  isSelected,
  onClick,
}) => {
  const cardClasses = `
        bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 cursor-pointer
        ${onClick ? 'hover:shadow-lg hover:scale-[1.02]' : ''}
        ${isSelected ? 'ring-2 ring-pink-500 shadow-lg' : ''}
    `;

  const renderTag = () => {
    if (product.petFriendly) {
      return (
        <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-800 shadow-sm flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Pet Friendly
        </div>
      );
    }
    if (product.lightLevel) {
      return (
        <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-800 shadow-sm flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0V7a4 4 0 118 0v3zm-1 0a1 1 0 11-2 0v-3a1 1 0 112 0v3z"
              clipRule="evenodd"
            />
          </svg>
          {product.lightLevel}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cardClasses} onClick={onClick}>
      {/* Product Image Area */}
      <div className="aspect-square w-full bg-gray-50 flex items-center justify-center p-2 relative">
        {product.isTile ? (
          // Mixtiles photos with simple frame
          <div className="w-full h-full relative">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        ) : (
          // Plants with clean background
          <div className="w-full h-full relative">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-contain object-center"
            />
          </div>
        )}
        {renderTag()}
      </div>

      {/* Image Carousel Indicator (simplified) */}
      <div className="flex justify-center py-1">
        <div className="flex space-x-0.5">
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        </div>
      </div>

      {/* Product Information */}
      <div className="px-4 pb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2 truncate">
          {product.name}
        </h4>
        {product.price && (
          <p className="text-sm text-gray-900 font-medium">{product.price}</p>
        )}
      </div>
    </div>
  );
};

export default ObjectCard;
