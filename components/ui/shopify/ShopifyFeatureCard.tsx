'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface ShopifyFeatureCardProps {
  icon: React.ReactNode;
  iconColor?: string;
  title: string;
  description: string;
  href: string;
  className?: string;
}

export function ShopifyFeatureCard({
  icon,
  iconColor = '#6b7177',
  title,
  description,
  href,
  className = '',
}: ShopifyFeatureCardProps) {
  return (
    <Link
      href={href}
      className={`
        block
        bg-white
        border
        border-[#e1e3e5]
        rounded-lg
        p-5
        shadow-[0_1px_3px_rgba(0,0,0,0.08)]
        hover:shadow-[0_2px_6px_rgba(0,0,0,0.12)]
        hover:border-[#d1d5db]
        transition-all
        duration-200
        group
        ${className}
      `.trim()}
      data-testid="shopify-feature-card"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div 
            className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#f6f6f7] flex items-center justify-center"
            style={{ color: iconColor }}
            data-testid="feature-card-icon"
          >
            {React.isValidElement(icon) 
              ? React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })
              : icon
            }
          </div>
          
          <div>
            <h3 
              className="text-base font-semibold text-[#1a1a1a] group-hover:text-[#2c6ecb] transition-colors"
              data-testid="feature-card-title"
            >
              {title}
            </h3>
            <p 
              className="text-sm text-[#6b7177] mt-0.5"
              data-testid="feature-card-description"
            >
              {description}
            </p>
          </div>
        </div>
        
        <ChevronRight 
          className="w-5 h-5 text-[#8c9196] flex-shrink-0 group-hover:text-[#2c6ecb] group-hover:translate-x-0.5 transition-all"
          data-testid="feature-card-chevron"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}

export default ShopifyFeatureCard;
