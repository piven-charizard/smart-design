/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Product } from './types';
import ProductCarousel from './ProductCarousel';

interface ProductSelectorProps {
  products: Product[];
  onSelect: (product: Product) => void;
  selectedProducts: Product[];
}

const ProductSelector: React.FC<ProductSelectorProps> = ({
  products,
  onSelect,
  selectedProducts,
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto animate-fade-in">
      <ProductCarousel
        products={products}
        onSelect={onSelect}
        selectedProducts={selectedProducts}
      />
    </div>
  );
};

export default ProductSelector;
