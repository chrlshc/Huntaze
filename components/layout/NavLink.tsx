'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  activeClassName?: string;
  className?: string;
  prefetch?: boolean;
}

/**
 * NavLink component with active state detection
 * Highlights the current page in navigation
 * Implements prefetching for instant page transitions
 */
export function NavLink({
  href,
  children,
  activeClassName = 'text-primary font-semibold',
  className = '',
  prefetch = true,
}: NavLinkProps) {
  const pathname = usePathname();
  
  // Check if current route matches this link
  // Special case for root path to avoid matching all routes
  const isActive = href === '/' 
    ? pathname === '/'
    : pathname === href || pathname?.startsWith(`${href}/`);
  
  return (
    <Link
      href={href}
      prefetch={prefetch}
      className={cn(
        'transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm',
        isActive && activeClassName,
        className
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      {children}
    </Link>
  );
}
