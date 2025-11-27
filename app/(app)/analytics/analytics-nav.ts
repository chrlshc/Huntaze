/**
 * Analytics Sub-Navigation Configuration
 * Centralized navigation items for all analytics pages
 */

export interface SubNavItem {
  label: string;
  href: string;
  isActive?: boolean;
}

export function getAnalyticsSubNav(currentPath: string): SubNavItem[] {
  return [
    {
      label: 'Overview',
      href: '/analytics',
      isActive: currentPath === '/analytics',
    },
    {
      label: 'Pricing',
      href: '/analytics/pricing',
      isActive: currentPath === '/analytics/pricing',
    },
    {
      label: 'Churn Risk',
      href: '/analytics/churn',
      isActive: currentPath === '/analytics/churn',
    },
    {
      label: 'Upsells',
      href: '/analytics/upsells',
      isActive: currentPath === '/analytics/upsells',
    },
    {
      label: 'Forecast',
      href: '/analytics/forecast',
      isActive: currentPath === '/analytics/forecast',
    },
    {
      label: 'Payouts',
      href: '/analytics/payouts',
      isActive: currentPath === '/analytics/payouts',
    },
  ];
}
