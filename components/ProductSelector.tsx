/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Product } from './types';
import ObjectCard from './ObjectCard';

interface ProductSelectorProps {
    products: Product[];
    onSelect: (product: Product) => void;
    onAddOwnProductClick: () => void;
}

const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

const ProductSelector: React.FC<ProductSelectorProps> = ({ products, onSelect, onAddOwnProductClick }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScrollButtons = useCallback(() => {
        const el = scrollContainerRef.current;
        if (el) {
            const atStart = el.scrollLeft < 10;
            const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 10;
            setCanScrollLeft(!atStart);
            setCanScrollRight(!atEnd);
        }
    }, []);
    
    useEffect(() => {
        const el = scrollContainerRef.current;
        if (!el) return;

        // Initial check
        checkScrollButtons();
        
        // Handle case where items don't fill the container
        if (el.scrollWidth <= el.clientWidth) {
            setCanScrollRight(false);
        }

        el.addEventListener('scroll', checkScrollButtons);
        window.addEventListener('resize', checkScrollButtons);
        return () => {
            el.removeEventListener('scroll', checkScrollButtons);
            window.removeEventListener('resize', checkScrollButtons);
        };
    }, [products, checkScrollButtons]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto text-center animate-fade-in">
            <div className="relative flex items-center">
                <button 
                    onClick={() => scroll('left')}
                    disabled={!canScrollLeft}
                    className="absolute -left-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-zinc-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Scroll left"
                >
                    <ArrowLeftIcon />
                </button>
                <div
                    ref={scrollContainerRef}
                    className="flex space-x-4 overflow-x-auto snap-x snap-mandatory py-4 scrollbar-hide"
                >
                    {products.map(product => (
                         <div key={product.id} className="snap-center shrink-0 w-40 md:w-48">
                            <div 
                                draggable="true" 
                                onDragStart={(e) => {
                                    e.dataTransfer.effectAllowed = 'move';
                                    // Auto-select this product when drag starts
                                    onSelect(product);
                                    // Completely hide the plant image during drag
                                    e.currentTarget.style.opacity = '0';
                                    // Set a completely transparent drag image
                                    const transparentImage = new Image();
                                    transparentImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                                    e.dataTransfer.setDragImage(transparentImage, 0, 0);
                                }}
                                onDragEnd={(e) => {
                                    // Restore opacity when drag ends
                                    e.currentTarget.style.opacity = '1';
                                }}
                                onTouchStart={(e) => {
                                    // Auto-select this product when touch starts
                                    onSelect(product);
                                }}
                                className="cursor-move transition-opacity duration-200"
                            >
                                <ObjectCard
                                    product={product}
                                    isSelected={false}
                                    onClick={() => onSelect(product)}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                 <button 
                    onClick={() => scroll('right')}
                    disabled={!canScrollRight}
                    className="absolute -right-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-zinc-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Scroll right"
                >
                    <ArrowRightIcon />
                </button>
            </div>
       
        </div>
    );
};

export default ProductSelector;
