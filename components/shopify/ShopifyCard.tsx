'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ShopifyCardProps {
  title?: string;
  subtitle?: string;
  action?: string;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  onClick?: () => void;
}

export const ShopifyCard = ({ 
  title, 
  subtitle, 
  action, 
  children,
  className = '',
  noPadding = false,
  onClick
}: ShopifyCardProps) => {
  return (
    <div 
      className={cn(
        "bg-white rounded-lg border border-gray-200",
        onClick && "cursor-pointer hover:shadow-sm transition-shadow",
        className
      )}
      onClick={onClick}
    >
      {(title || action) && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">{title}</h3>
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
            {action && (
              <button className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors">
                {action}
              </button>
            )}
          </div>
        </div>
      )}
      <div className={noPadding ? "" : "p-6"}>
        {children}
      </div>
    </div>
  );
};