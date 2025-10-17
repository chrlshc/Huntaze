'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ShopifyMobileCardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  onClick?: () => void;
}

export const ShopifyMobileCard = ({ 
  children, 
  className,
  noPadding = false,
  onClick
}: ShopifyMobileCardProps) => {
  return (
    <div 
      className={cn(
        "bg-white rounded-lg border border-gray-200",
        onClick && "active:scale-[0.98] transition-transform",
        className
      )}
      onClick={onClick}
    >
      <div className={noPadding ? "" : "p-4"}>
        {children}
      </div>
    </div>
  );
};

// Product Card
export const ShopifyProductCard = ({
  image,
  title,
  price,
  originalPrice,
  badge
}: {
  image: string;
  title: string;
  price: string;
  originalPrice?: string;
  badge?: string;
}) => {
  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <div className="aspect-square relative bg-gray-100">
        {badge && (
          <span className="absolute top-2 left-2 bg-green-600 text-white text-xs font-medium px-2 py-1 rounded">
            {badge}
          </span>
        )}
        <img src={image} alt={title} className="w-full h-full object-cover" />
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">{title}</h3>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-base font-semibold text-gray-900">{price}</span>
          {originalPrice && (
            <span className="text-sm text-gray-500 line-through">{originalPrice}</span>
          )}
        </div>
      </div>
    </div>
  );
};

// List Item
export const ShopifyListItem = ({
  icon,
  title,
  subtitle,
  value,
  onClick
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  value?: string;
  onClick?: () => void;
}) => {
  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-4 bg-white",
        onClick && "active:bg-gray-50"
      )}
      onClick={onClick}
    >
      {icon && (
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {value && (
        <span className="text-sm font-medium text-gray-900">{value}</span>
      )}
    </div>
  );
};