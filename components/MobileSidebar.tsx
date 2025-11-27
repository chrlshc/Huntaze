'use client';

import { useState } from 'react';
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
const navigation: NavItem[] = [
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

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile menu button - Hamburger icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden"
        style={{
          padding: '8px',
          color: 'var(--color-text-sub)',
          borderRadius: 'var(--radius-button)',
          transition: 'color var(--transition-fast)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        <svg
          style={{
            width: '24px',
            height: '24px'
          }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 lg:hidden"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 'var(--huntaze-z-index-overlay)',
            animation: 'fadeIn var(--transition-drawer)'
          }}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className="fixed inset-y-0 left-0 lg:hidden"
        style={{
          width: isOpen ? 'min(80vw, 300px)' : '0',
          maxWidth: '300px',
          backgroundColor: 'var(--bg-surface)',
          boxShadow: isOpen ? 'var(--shadow-mobile-drawer)' : 'none',
          zIndex: 'var(--huntaze-z-index-modal)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform var(--transition-drawer)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        aria-hidden={!isOpen}
      >
        {/* Sidebar header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--color-border-light)'
          }}
        >
          <Link
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            style={{
              fontSize: '20px',
              fontWeight: 'var(--font-weight-heading)',
              color: 'var(--color-indigo)',
              fontFamily: 'var(--font-heading)',
              textDecoration: 'none'
            }}
          >
            Huntaze
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              padding: '8px',
              color: 'var(--color-text-sub)',
              borderRadius: 'var(--radius-button)',
              transition: 'color var(--transition-fast)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            aria-label="Close menu"
          >
            <svg
              style={{
                width: '20px',
                height: '20px'
              }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav
          style={{
            flex: 1,
            padding: '16px 12px',
            overflowY: 'auto'
          }}
        >
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '4px', listStyle: 'none', padding: 0, margin: 0 }}>
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const showSubNav = hasSubItems && isActive;

              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="nav-item"
                    data-active={isActive}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 16px',
                      gap: '12px',
                      color: isActive ? 'var(--color-indigo)' : '#4B5563',
                      backgroundColor: isActive ? 'var(--color-indigo-fade)' : 'transparent',
                      textDecoration: 'none',
                      borderRadius: '0 var(--radius-nav-item) var(--radius-nav-item) 0',
                      marginRight: '12px',
                      transition: 'all var(--transition-fast)',
                      fontSize: 'var(--font-size-body)',
                      fontWeight: isActive ? 'var(--font-weight-medium)' : 'var(--font-weight-body)',
                      fontFamily: 'var(--font-body)'
                    }}
                  >
                    {/* Active indicator border */}
                    {isActive && (
                      <span
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: '10%',
                          height: '80%',
                          width: '3px',
                          backgroundColor: 'var(--color-indigo)',
                          borderRadius: '0 4px 4px 0'
                        }}
                        aria-hidden="true"
                      />
                    )}
                    <DuotoneIcon 
                      name={item.icon} 
                      size={20}
                      primaryColor={isActive ? 'var(--color-indigo)' : '#9CA3AF'}
                      secondaryColor={isActive ? 'var(--color-indigo)' : '#9CA3AF'}
                    />
                    {item.name}
                  </Link>

                  {/* Sub-navigation */}
                  {showSubNav && item.subItems && (
                    <ul style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '2px',
                      marginTop: '4px',
                      marginLeft: '32px',
                      marginRight: '12px',
                      listStyle: 'none',
                      padding: 0,
                    }}>
                      {item.subItems.map((subItem) => {
                        const isSubActive = pathname === subItem.href;
                        return (
                          <li key={subItem.href}>
                            <Link
                              href={subItem.href}
                              onClick={() => setIsOpen(false)}
                              className="nav-sub-item"
                              data-active={isSubActive}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '8px 16px',
                                color: isSubActive ? 'var(--color-indigo)' : '#6B7280',
                                backgroundColor: isSubActive ? 'var(--color-indigo-fade)' : 'transparent',
                                textDecoration: 'none',
                                transition: 'all var(--transition-fast)',
                                borderRadius: '6px',
                                fontSize: '13px',
                                fontWeight: isSubActive ? 'var(--font-weight-medium)' : 'var(--font-weight-body)',
                                fontFamily: 'var(--font-body)'
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

        {/* Footer */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid var(--color-border-light)'
          }}
        >
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              gap: '12px',
              color: 'var(--color-text-sub)',
              textDecoration: 'none',
              borderRadius: 'var(--radius-button)',
              transition: 'background var(--transition-fast)',
              fontSize: 'var(--font-size-small)',
              fontFamily: 'var(--font-body)'
            }}
          >
            <svg
              style={{
                width: '20px',
                height: '20px'
              }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </Link>
        </div>
      </aside>

      {/* Fade in animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
