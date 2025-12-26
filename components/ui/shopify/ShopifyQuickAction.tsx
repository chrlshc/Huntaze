'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface ShopifyQuickActionProps {
  /**
   * Accepts either a React element (`<Send />`) or an icon component (`Send`).
   * Passing a component type avoids "Objects are not valid as a React child"
   * when icons are forwardRef objects (e.g. lucide-react).
   */
  icon: React.ReactNode | React.ElementType<{ className?: string; 'aria-hidden'?: boolean }>;
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
  const renderIcon = () => {
    if (icon == null) return null;

    if (React.isValidElement(icon)) {
      return React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5', 'aria-hidden': true });
    }

    // Handle component types (including forwardRef icons from lucide-react).
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null && '$$typeof' in (icon as any))) {
      const IconComponent = icon as React.ElementType<{ className?: string; 'aria-hidden'?: boolean }>;
      return <IconComponent className="w-5 h-5" aria-hidden={true} />;
    }

    return icon;
  };

  return (
    <Link
      href={href}
      className={`
        block
        bg-white
        border
        border-[var(--color-border-default)]
        rounded-2xl
        p-5
        shadow-[0_1px_3px_rgba(0,0,0,0.08)]
        hover:shadow-[0_2px_6px_rgba(0,0,0,0.12)]
        hover:border-[var(--color-border-hover)]
        transition-all
        duration-200
        group
        ${className}
      `.trim()}
      data-testid="shopify-quick-action"
    >
      <div className="flex items-start gap-3">
        <div 
          className="flex-shrink-0 w-10 h-10 rounded-xl bg-[var(--color-bg-subtle)] flex items-center justify-center"
          style={{ color: iconColor }}
          data-testid="quick-action-icon"
        >
          {renderIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 
            className="text-[var(--font-size-body)] font-semibold text-[var(--color-text-heading)] group-hover:text-[var(--accent-info)] transition-colors"
            data-testid="quick-action-title"
          >
            {title}
          </h3>
          <p 
            className="text-[var(--font-size-body)] text-[var(--color-text-sub)] mt-0.5 line-clamp-2"
            data-testid="quick-action-description"
          >
            {description}
          </p>
        </div>
        
        <ChevronRight 
          className="w-5 h-5 text-[var(--color-text-inactive)] flex-shrink-0 group-hover:text-[var(--accent-info)] transition-colors"
          data-testid="shopify-quick-action-chevron"
        />
      </div>
    </Link>
  );
}

export default ShopifyQuickAction;
