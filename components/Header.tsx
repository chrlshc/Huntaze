'use client';

import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

/**
 * Header Component
 * 
 * Global header with navigation and theme toggle.
 */

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-theme-surface border-b border-theme-border backdrop-blur-sm bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-theme-text">Huntaze</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
