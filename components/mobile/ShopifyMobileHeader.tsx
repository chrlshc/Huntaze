'use client';

import React, { useState } from 'react';
import { ArrowLeft, Search, ShoppingCart, Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ShopifyMobileHeaderProps {
  title?: string;
  showBack?: boolean;
  showSearch?: boolean;
  showCart?: boolean;
  cartCount?: number;
}

export const ShopifyMobileHeader = ({
  title = 'Huntaze',
  showBack = false,
  showSearch = true,
  showCart = true,
  cartCount = 0
}: ShopifyMobileHeaderProps) => {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
        <div className="h-14 px-4 flex items-center justify-between">
          {/* Left */}
          <div className="flex items-center gap-3">
            {showBack ? (
              <button
                onClick={() => router.back()}
                className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            ) : (
              <button className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Menu className="w-5 h-5" />
              </button>
            )}
            
            {!isSearchOpen && (
              <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {showSearch && (
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
            
            {showCart && (
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-green-600 text-white text-xs font-medium rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Search Overlay */}
        {isSearchOpen && (
          <div className="absolute inset-0 bg-white flex items-center px-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="search"
                placeholder="Rechercher..."
                autoFocus
                className="w-full h-10 pl-10 pr-4 bg-gray-100 rounded-lg text-base outline-none"
              />
            </div>
            <button
              onClick={() => setIsSearchOpen(false)}
              className="ml-2 p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </header>
      
      {/* Spacer */}
      <div className="h-14" />
    </>
  );
};