'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { SubNavItem } from '@/hooks/useNavigationContext';

interface SubNavigationProps {
  items: SubNavItem[];
  className?: string;
}

export function SubNavigation({ items, className = '' }: SubNavigationProps) {
  const pathname = usePathname();
  
  // Don't render if no items
  if (items.length === 0) {
    return null;
  }
  
  return (
    <nav 
      className={cn('sub-navigation', className)}
      aria-label="Sub-navigation"
    >
      <div className="sub-nav-container">
        <div className="sub-nav-scroll">
          {items.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'sub-nav-item',
                  isActive && 'active'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.icon && (
                  <span className="sub-nav-icon" aria-hidden="true">
                    {/* Icon placeholder - replace with actual icon component */}
                    <span className="icon-placeholder" />
                  </span>
                )}
                <span className="sub-nav-label">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="sub-nav-badge" aria-label={`${item.badge} items`}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
