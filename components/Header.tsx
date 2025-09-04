/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="w-full bg-white border-b border-gray-200">
      {/* Navigation Bar */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <img 
              src="/assets/logo.png" 
              alt="Mixtiles Designer" 
              className="h-8 w-8 rounded-lg object-cover mr-3"
            />
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 rounded-lg mt-2">
              <a href="#" className="block px-3 py-2 text-gray-600 hover:text-gray-900 font-medium">Products</a>
              <a href="#" className="block px-3 py-2 text-gray-600 hover:text-gray-900 font-medium">Gallery</a>
              <a href="#" className="block px-3 py-2 text-gray-600 hover:text-gray-900 font-medium">About</a>
              <a href="#" className="block px-3 py-2 text-gray-600 hover:text-gray-900 font-medium">Contact</a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
