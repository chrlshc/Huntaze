'use client';

import React from 'react';
import { ShopifyMobileHeader } from './ShopifyMobileHeader';
import { ShopifyMobileNav } from './ShopifyMobileNav';

interface ShopifyMobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
}

export const ShopifyMobileLayout = ({ 
  children, 
  title = 'Huntaze',
  showBack = false 
}: ShopifyMobileLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <ShopifyMobileHeader title={title} showBack={showBack} />
      
      {/* Main Content */}
      <main className="pb-16">
        {children}
      </main>
      
      {/* Bottom Navigation */}
      <ShopifyMobileNav />
    </div>
  );
};