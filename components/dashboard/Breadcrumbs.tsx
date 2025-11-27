'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/hooks/useNavigationContext';

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  // Don't render if no items or only one item (current page)
  if (items.length === 0) {
    return null;
  }
  
  return (
    <nav 
      className={cn('breadcrumbs', className)}
      aria-label="Breadcrumb"
    >
      <ol className="breadcrumbs-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={item.href || item.label} className="breadcrumb-item">
              {!isLast && item.href ? (
                <>
                  <Link 
                    href={item.href}
                    className="breadcrumb-link"
                  >
                    {item.label}
                  </Link>
                  <span className="breadcrumb-separator" aria-hidden="true">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6 12L10 8L6 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </>
              ) : (
                <span className="breadcrumb-current" aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
