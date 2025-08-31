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

const ObjectCard: React.FC<ObjectCardProps> = ({ product, isSelected, onClick }) => {
    const cardClasses = `
        bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300
        ${onClick ? 'hover:shadow-xl hover:scale-105' : ''}
        ${isSelected ? 'border-2 border-blue-500 shadow-xl scale-105' : 'border border-zinc-200'}
    `;

    return (
        <div className={cardClasses} onClick={onClick}>
            <div className="aspect-square w-full bg-white flex items-center justify-center p-4 relative">
                {product.isTile ? (
                    // Mixtiles photos get enhanced tile frames
                    <div className="w-full h-full relative">
                        {/* Photo frame with realistic styling */}
                        <div className="w-full h-full border-4 border-amber-100 rounded-lg overflow-hidden shadow-lg bg-amber-50">
                            <div className="w-full h-full border-2 border-amber-200 rounded-md overflow-hidden shadow-inner">
                                <img 
                                    src={product.imageUrl} 
                                    alt={product.name} 
                                    className="w-full h-full object-cover" 
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    // Plants get enhanced styling with natural elements
                    <div className="w-full h-full relative">
                        <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="w-full h-full object-contain object-center" 
                            style={{
                                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                                mixBlendMode: 'multiply'
                            }}
                        />
                        {/* Subtle plant background decoration */}
                        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-30 rounded-lg pointer-events-none"></div>
                    </div>
                )}
            </div>
            <div className="p-2 text-center">
                <h4 className="text-xs font-medium text-gray-700 truncate">{product.name}</h4>
                <div className="text-xs text-gray-500 mt-1">
                    {product.isTile ? 'Photo Tile' : 'Potted Plant'}
                </div>
            </div>
        </div>
    );
};

export default ObjectCard;