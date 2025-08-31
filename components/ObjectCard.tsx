/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Product } from '../types';

interface ObjectCardProps {
    product: Product;
    isSelected: boolean;
    onClick?: () => void;
}

const ObjectCard: React.FC<ObjectCardProps> = ({ product, isSelected, onClick }) => {
    const cardClasses = `
        bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300
        ${onClick ? 'cursor-pointer hover:shadow-xl hover:scale-105' : ''}
        ${isSelected ? 'border-2 border-blue-500 shadow-xl scale-105' : 'border border-zinc-200'}
    `;

    return (
        <div className={cardClasses} onClick={onClick}>
            <div className="aspect-square w-full bg-white flex items-center justify-center p-4">
                <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-4/5 h-4/5 object-contain object-center" 
                    style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                        mixBlendMode: 'multiply'
                    }}
                />
            </div>
            <div className="p-2 text-center">
                <h4 className="text-xs font-medium text-gray-700 truncate">{product.name}</h4>
            </div>
        </div>
    );
};

export default ObjectCard;