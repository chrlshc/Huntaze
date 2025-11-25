'use client';

import { useState } from 'react';
import Link from 'next/link';
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

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link 
          href="/" 
          className="flex items-center space-x-2 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          aria-label="Huntaze Home"
        >
          <span className="text-xl font-bold">Huntaze</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:items-center md:gap-6" aria-label="Main navigation">
          {navigationConfig.main.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground"
              activeClassName="text-foreground font-semibold"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* CTA Button (Desktop) */}
        <div className="hidden md:flex md:items-center md:gap-4">
          <Link
            href="/auth/login"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:hidden"
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
          className="border-t md:hidden"
        >
          <nav className="container space-y-1 px-4 py-4" aria-label="Mobile navigation">
            {navigationConfig.main.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                className="block rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                activeClassName="bg-accent text-foreground font-semibold"
              >
                {item.label}
              </NavLink>
            ))}
            <div className="border-t pt-4 space-y-2">
              <Link
                href="/auth/login"
                className="block rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="block rounded-md bg-primary px-3 py-2 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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
