/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { Product } from './types';

interface TileWallProps {
  products: Product[];
  onTileSelect: (product: Product) => void;
}

interface TilePosition {
  id: number;
  product: Product;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

const TileWall: React.FC<TileWallProps> = ({ products, onTileSelect }) => {
  const [placedTiles, setPlacedTiles] = useState<TilePosition[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTile, setDragTile] = useState<TilePosition | null>(null);
  const wallRef = useRef<HTMLDivElement>(null);

  const handleTileDragStart = useCallback(
    (e: React.DragEvent, product: Product) => {
      e.dataTransfer.effectAllowed = 'copy';
      setIsDragging(true);

      // Create a transparent drag image
      const transparentImage = new Image();
      transparentImage.src =
        'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      e.dataTransfer.setDragImage(transparentImage, 0, 0);
    },
    []
  );

  const handleWallDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (!wallRef.current) return;

      const rect = wallRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Find the product being dragged
      const draggedProduct = products.find(
        p => p.id === parseInt(e.dataTransfer.getData('text/plain'))
      );
      if (!draggedProduct) return;

      const newTile: TilePosition = {
        id: Date.now(),
        product: draggedProduct,
        x: x - 50, // Center the tile
        y: y - 50,
        rotation: Math.random() * 20 - 10, // Random rotation between -10 and 10 degrees
        scale: 0.8 + Math.random() * 0.4, // Random scale between 0.8 and 1.2
      };

      setPlacedTiles(prev => [...prev, newTile]);
    },
    [products]
  );

  const handleWallDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeTile = useCallback((tileId: number) => {
    setPlacedTiles(prev => prev.filter(tile => tile.id !== tileId));
  }, []);

  return (
    <div className="w-full">
      {/* Product Selection */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-center mb-4 text-gray-800">
          Choose Your Photos
        </h3>
        <div className="flex flex-wrap gap-4 justify-center">
          {products.map(product => (
            <div
              key={product.id}
              draggable
              onDragStart={e => {
                handleTileDragStart(e, product);
                e.dataTransfer.setData('text/plain', product.id.toString());
              }}
              className="cursor-move group"
            >
              <div className="w-24 h-24 bg-white rounded-lg shadow-md border-2 border-gray-200 group-hover:border-pink-300 transition-all duration-200 overflow-hidden">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-center mt-2 text-gray-600 max-w-24 truncate">
                {product.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tile Wall */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-center mb-4 text-gray-800">
          Your Photo Wall
        </h3>
        <div
          ref={wallRef}
          onDrop={handleWallDrop}
          onDragOver={handleWallDragOver}
          className="relative w-full h-96 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden"
        >
          {/* Wall Texture */}
          <div className="absolute inset-0 opacity-20">
            <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRkZGRkZGIi8+CjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0idXJsKCNncmlkKSIvPgo8ZGVmcz4KPHBhdHRlcm4gaWQ9ImdyaWQiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CiAgPHBhdGggZD0iTSAwIDQwIEwgNDAgNDAgNDAgMCIgc3Ryb2tlPSIjRjNGNEY2IiBzdHJva2Utd2lkdGg9IjEiLz4KPC9wYXR0ZXJuPgo8L2RlZnM+Cjwvc3ZnPgo=')]"></div>
          </div>

          {/* Placed Tiles */}
          {placedTiles.map(tile => (
            <div
              key={tile.id}
              className="absolute cursor-pointer group"
              style={{
                left: tile.x,
                top: tile.y,
                transform: `rotate(${tile.rotation}deg) scale(${tile.scale})`,
                zIndex: 10,
              }}
            >
              <div className="relative">
                <div className="w-24 h-24 bg-white rounded-lg shadow-lg border-2 border-gray-200 group-hover:border-pink-400 transition-all duration-200 overflow-hidden">
                  <img
                    src={tile.product.imageUrl}
                    alt={tile.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Remove button */}
                <button
                  onClick={() => removeTile(tile.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            </div>
          ))}

          {/* Drop Zone Indicator */}
          {isDragging && (
            <div className="absolute inset-0 bg-pink-50 border-2 border-pink-300 border-dashed rounded-lg flex items-center justify-center">
              <div className="text-center text-pink-600">
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-2 mx-auto">
                  <svg
                    className="w-8 h-8 text-pink-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <p className="font-medium">Drop photo here to add to wall</p>
              </div>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-500 text-center mt-2">
          Drag photos from above to create your photo wall. Click the × to
          remove tiles.
        </p>
      </div>
    </div>
  );
};

export default TileWall;
