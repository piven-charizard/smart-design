/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full bg-white">
      {/* Navigation Bar */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img 
              src="/assets/logo.png" 
              alt="Mixtiles Designer" 
              className="h-8 w-8 rounded-lg object-cover"
            />
          </div>

        </div>
      </nav>
      

    </header>
  );
};

export default Header;
