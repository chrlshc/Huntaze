'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DuotoneIcon } from './dashboard/DuotoneIcon';

interface SubNavItem {
  name: string;
  href: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: string;
  subItems?: SubNavItem[];
}

// 5-section navigation structure
const navigation = [
  {
    name: 'Home',
    href: '/home',
    icon: 'home',
  },
  {
    name: 'OnlyFans',
    href: '/onlyfans',
    icon: 'onlyfans',
    subItems: [
      { name: 'Overview', href: '/onlyfans' },
      { name: 'Messages', href: '/onlyfans/messages' },
      { name: 'Fans', href: '/onlyfans/fans' },
      { name: 'PPV', href: '/onlyfans/ppv' },
      { name: 'Settings', href: '/onlyfans/settings' },
    ],
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: 'analytics',
    subItems: [
      { name: 'Overview', href: '/analytics' },
      { name: 'Pricing', href: '/analytics/pricing' },
      { name: 'Churn', href: '/analytics/churn' },
      { name: 'Upsells', href: '/analytics/upsells' },
      { name: 'Forecast', href: '/analytics/forecast' },
      { name: 'Payouts', href: '/analytics/payouts' },
    ],
  },
  {
    name: 'Marketing',
    href: '/marketing',
    icon: 'marketing',
    subItems: [
      { name: 'Campaigns', href: '/marketing/campaigns' },
      { name: 'Social', href: '/marketing/social' },
      { name: 'Calendar', href: '/marketing/calendar' },
    ],
  },
  {
    name: 'Content',
    href: '/content',
    icon: 'content',
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="huntaze-sidebar hidden md:flex md:flex-col">
      <nav 
        className="flex-1"
        style={{ padding: '16px 0 16px 16px' }}
      >
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const hasSubItems = item.subItems && item.subItems.length > 0;
            const showSubNav = hasSubItems && isActive;

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="nav-item"
                  data-active={isActive}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    gap: '12px',
                    color: isActive ? 'var(--nav-text)' : 'var(--nav-text-muted)',
                    backgroundColor: isActive ? 'var(--nav-active-bg)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                    borderRadius: '0 8px 8px 0',
                    marginRight: '12px',
                    fontSize: '14px',
                    fontWeight: isActive ? '500' : '400',
                    ...(isActive && {
                      borderLeft: '3px solid var(--nav-active-indicator)',
                      paddingLeft: '13px',
                    }),
                  }}
                >
                  <DuotoneIcon
                    name={item.icon}
                    size={20}
                    primaryColor={isActive ? 'var(--nav-text)' : 'var(--nav-text-subtle)'}
                    secondaryColor={isActive ? 'var(--nav-text)' : 'var(--nav-text-subtle)'}
                  />
                  {item.name}
                </Link>

                {/* Sub-navigation */}
                {showSubNav && (
                  <ul style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '2px',
                    marginTop: '4px',
                    marginLeft: '32px',
                    marginRight: '12px',
                  }}>
                    {item.subItems.map((subItem) => {
                      const isSubActive = pathname === subItem.href;
                      return (
                        <li key={subItem.href}>
                          <Link
                            href={subItem.href}
                            className="nav-sub-item"
                            data-active={isSubActive}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '8px 16px',
                              color: isSubActive ? 'var(--nav-text)' : 'var(--nav-text-muted)',
                              backgroundColor: isSubActive ? 'var(--nav-active-bg-subtle)' : 'transparent',
                              textDecoration: 'none',
                              transition: 'all 0.15s ease',
                              borderRadius: '6px',
                              fontSize: '13px',
                              fontWeight: isSubActive ? '500' : '400',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSubActive) {
                                e.currentTarget.style.backgroundColor = 'var(--nav-hover)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSubActive) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }
                            }}
                          >
                            {subItem.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div 
        className="border-t"
        style={{
          padding: 'var(--spacing-4)',
          borderColor: 'var(--nav-border)'
        }}
      >
        <Link
          href="/"
          className="flex items-center rounded-lg"
          style={{
            padding: 'var(--spacing-3)',
            gap: 'var(--spacing-3)',
            color: 'var(--nav-text-muted)',
            fontSize: 'var(--font-size-sm)',
            transition: 'all var(--transition-fast)',
            textDecoration: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--nav-hover)';
            e.currentTarget.style.color = 'var(--nav-text)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--nav-text-muted)';
          }}
        >
          <svg
            style={{
              width: 'var(--spacing-5)',
              height: 'var(--spacing-5)'
            }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Home
        </Link>
      </div>
    </aside>
  );
}
