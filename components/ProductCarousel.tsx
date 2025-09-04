/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { Product } from './types';
import ObjectCard from './ObjectCard';

interface ProductCarouselProps {
  products: Product[];
  onSelect: (product: Product) => void;
  selectedProducts: Product[];
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({
  products,
  onSelect,
  selectedProducts,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    // Calculate scroll amount based on card width + gap
    const cardWidth = 256; // w-64 = 256px
    const gap = 24; // gap-6 = 24px
    const scrollAmount = cardWidth + gap;

    const currentScroll = scrollContainerRef.current.scrollLeft;
    const newScroll =
      direction === 'left'
        ? currentScroll - scrollAmount
        : currentScroll + scrollAmount;

    scrollContainerRef.current.scrollTo({
      left: newScroll,
      behavior: 'smooth',
    });
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  return (
    <div className="relative w-full">
      {/* Left Arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all duration-200"
          aria-label="Scroll left"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {/* Right Arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all duration-200"
          aria-label="Scroll right"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex gap-6 overflow-x-auto scrollbar-hide py-4 px-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map(product => {
          const isSelected = selectedProducts.some(p => p.id === product.id);
          return (
            <div
              key={product.id}
              className="flex-shrink-0 w-48 md:w-56 lg:w-64"
            >
              <ObjectCard
                product={product}
                isSelected={isSelected}
                onClick={() => onSelect(product)}
              />
            </div>
          );
        })}
      </div>

      {/* Scroll Indicators */}
      <div className="flex justify-center mt-4 space-x-1">
        <div
          className={`w-2 h-2 rounded-full ${canScrollLeft ? 'bg-gray-400' : 'bg-gray-200'}`}
        ></div>
        <div
          className={`w-2 h-2 rounded-full ${canScrollRight ? 'bg-gray-400' : 'bg-gray-200'}`}
        ></div>
      </div>
    </div>
  );
};

export default ProductCarousel;
