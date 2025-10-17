'use client';

import React from 'react';
import { ShopifySidebar } from './ShopifySidebar';
import { ShopifyTopBar } from './ShopifyTopBar';

interface ShopifyLayoutProps {
  children: React.ReactNode;
}

export const ShopifyLayout = ({ children }: ShopifyLayoutProps) => {
  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <ShopifySidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <ShopifyTopBar />
        
        {/* Page Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};