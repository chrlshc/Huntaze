'use client';

import type { ComponentProps } from 'react';
import { Breadcrumb } from './Breadcrumb';
import { useMobileSidebar } from './MobileSidebarContext';
import { NotificationBell } from './NotificationBell';
import { UserMenu } from './UserMenu';
import ThemeToggle from '@/components/ThemeToggle';

export function TopHeader() {
  const { isOpen, toggle } = useMobileSidebar();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-gray-700 dark:bg-gray-800/95 dark:supports-[backdrop-filter]:bg-gray-800/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left: Mobile menu button + Breadcrumb */}
        <div className="flex items-center gap-4">
          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={toggle}
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white lg:hidden"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
          >
            {isOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>

          {/* Breadcrumb */}
          <Breadcrumb />
        </div>

        {/* Right: Header actions */}
        <div className="flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

function MenuIcon(props: ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function XIcon(props: ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
