'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface ShopifyQuickActionProps {
  icon: React.ReactNode;
  iconColor?: string;
  title: string;
  description: string;
  href: string;
  className?: string;
}

export function ShopifyQuickAction({
  icon,
  iconColor = '#6b7177',
  title,
  description,
  href,
  className = '',
}: ShopifyQuickActionProps) {
  return (
    <Link
      href={href}
      className={`
        block
        bg-white
        border
        border-[#e1e3e5]
        rounded-lg
        p-4
        shadow-[0_1px_3px_rgba(0,0,0,0.08)]
        hover:shadow-[0_2px_6px_rgba(0,0,0,0.12)]
        hover:border-[#d1d5db]
        transition-all
        duration-200
        group
        ${className}
      `.trim()}
      data-testid="shopify-quick-action"
    >
      <div className="flex items-start gap-3">
        <div 
          className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#f6f6f7] flex items-center justify-center"
          style={{ color: iconColor }}
          data-testid="quick-action-icon"
        >
          {React.isValidElement(icon) 
            ? React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })
            : icon
          }
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 
            className="text-sm font-semibold text-[#1a1a1a] group-hover:text-[#2c6ecb] transition-colors"
            data-testid="quick-action-title"
          >
            {title}
          </h3>
          <p 
            className="text-sm text-[#6b7177] mt-0.5 line-clamp-2"
            data-testid="quick-action-description"
          >
            {description}
          </p>
        </div>
        
        <ChevronRight 
          className="w-5 h-5 text-[#8c9196] flex-shrink-0 group-hover:text-[#2c6ecb] transition-colors"
          data-testid="quick-action-chevron"
        />
      </div>
    </Link>
  );
}

export default ShopifyQuickAction;
