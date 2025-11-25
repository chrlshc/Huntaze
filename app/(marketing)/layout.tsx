import type { ReactNode } from 'react';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { MarketingFooter } from '@/components/layout/MarketingFooter';

/**
 * Marketing Layout
 * 
 * Shared layout for all marketing pages with:
 * - Consistent header with navigation
 * - Page content
 * - Consistent footer
 * 
 * Requirements: 1.1, 5.1, 8.2
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col w-full mx-auto">
      <MarketingHeader />
      <main className="flex-1 w-full pt-20">{children}</main>
      <MarketingFooter />
    </div>
  );
}
