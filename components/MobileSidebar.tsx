'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DuotoneIcon } from './dashboard/DuotoneIcon';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: 'home',
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: 'analytics',
  },
  {
    name: 'Content',
    href: '/content',
    icon: 'content',
  },
  {
    name: 'Messages',
    href: '/messages',
    icon: 'messages',
  },
  {
    name: 'Integrations',
    href: '/integrations',
    icon: 'integrations',
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: 'settings',
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
