'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { navigationConfig } from '@/config/navigation';
import { NavLink } from './NavLink';
import { cn } from '@/lib/utils';

export interface MarketingHeaderProps {
  className?: string;
}

/**
 * MarketingHeader component
 * 
 * Provides consistent navigation across all marketing pages with:
 * - Sticky positioning at top of viewport
 * - Active state indication for current page
 * - Responsive behavior (hamburger menu on mobile)
 * - Hover effects on desktop
 * - Accessible keyboard navigation
 * 
 * Requirements: 1.1, 1.2, 1.5, 7.1
 */
export function MarketingHeader({ className }: MarketingHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const disableHover = pathname === '/';

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 w-full border-b border-[var(--border-subtle)] bg-black/80 backdrop-blur-xl',
        className
      )}
    >
      <div className="mx-auto max-w-7xl flex h-20 items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Logo */}
        <Link 
          href="/" 
          className={cn(
            'flex items-center space-x-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c6ecb] focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-sm',
            !disableHover && 'transition-opacity hover:opacity-80'
          )}
          aria-label="Beta Home"
        >
          <Image
            src="/logos/huntaze-vertical.svg"
            alt="Beta logo"
            width={28}
            height={28}
          />
          <span className="text-2xl font-bold text-white">Beta</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:gap-8" aria-label="Main navigation">
          {navigationConfig.main.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium text-gray-400',
                !disableHover && 'hover:text-white transition-colors'
              )}
              activeClassName="text-white font-semibold"
              disableHover={disableHover}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* CTA Button (Desktop) */}
        <div className="hidden md:flex md:items-center md:gap-6">
          <Link
            href="/auth/login"
            className={cn(
              'text-sm font-medium text-gray-400',
              !disableHover && 'hover:text-white transition-colors'
            )}
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className={cn(
              'inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_0_rgba(125,87,193,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c6ecb] focus-visible:ring-offset-2 focus-visible:ring-offset-black',
              !disableHover && 'transition-all duration-300 hover:shadow-[0_6px_20px_0_rgba(125,87,193,0.6)] hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:transform-none'
            )}
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className={cn(
            'inline-flex items-center justify-center rounded-md p-2 text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2c6ecb] md:hidden',
            !disableHover && 'hover:text-white hover:bg-white/10 transition-colors'
          )}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="border-t border-[var(--border-subtle)] bg-black/95 backdrop-blur-xl md:hidden"
        >
          <nav className="mx-auto max-w-7xl space-y-1 px-4 py-4" aria-label="Mobile navigation">
            {navigationConfig.main.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                className={cn(
                  'block rounded-md px-3 py-2 text-base font-medium text-gray-400',
                  !disableHover && 'hover:text-white hover:bg-white/10 transition-colors'
                )}
                activeClassName="bg-white/10 text-white font-semibold"
                disableHover={disableHover}
              >
                {item.label}
              </NavLink>
            ))}
            <div className="border-t border-[var(--border-subtle)] pt-4 space-y-2">
              <Link
                href="/auth/login"
                className={cn(
                  'block rounded-md px-3 py-2 text-base font-medium text-gray-400',
                  !disableHover && 'hover:text-white hover:bg-white/10 transition-colors'
                )}
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className={cn(
                  'block rounded-md bg-gradient-to-r from-purple-500 to-purple-600 px-3 py-2 text-base font-semibold text-white',
                  !disableHover && 'transition-all hover:shadow-lg'
                )}
              >
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
