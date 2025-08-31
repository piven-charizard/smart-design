/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full bg-white border-b border-gray-100">
      {/* Navigation Bar */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-gray-900">Mixtiles</h1>
          </div>
          {/* CTA Button */}
          <div className="flex items-center space-x-4">
            <button className="bg-pink-500 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-pink-600 transition-colors">
              Shop Now
            </button>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Space Design Reinvented
        </h1>
      </div>
    </header>
  );
};

export default Header;
