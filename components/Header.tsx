'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, Search } from 'lucide-react';
import { GlobalSearch } from './dashboard/GlobalSearch';
import { useAssistant } from "@/contexts/AssistantContext";
import { AssistantIcon } from '@/components/icons/AssistantIcon';
import { useMobileSidebar } from '@/components/layout/MobileSidebarContext';

export default function Header() {
  const { data: session } = useSession();
  const { isOpen, toggleAssistant } = useAssistant();
  const { toggle: toggleMobileSidebar, isOpen: isSidebarOpen } = useMobileSidebar();

  const handleMenuClick = () => {
    void isSidebarOpen;
    toggleMobileSidebar();
  };

  return (
    <header className="huntaze-header safe-area-top">
      <div className="flex items-center w-full gap-2 lg:gap-[var(--spacing-4)]">
        {/* Mobile: hamburger */}
        <button
          type="button"
          onClick={handleMenuClick}
          className="lg:hidden flex items-center justify-center p-2 rounded-lg hover:bg-white/10 transition-colors shrink-0"
          style={{ minWidth: '44px', minHeight: '44px', color: '#ffffff' }}
          aria-label="Open navigation menu"
          aria-haspopup="dialog"
        >
          <Menu size={24} aria-hidden="true" />
        </button>

        {/* Desktop: logo */}
        <div className="hidden lg:flex items-center gap-[var(--spacing-3)] w-[240px] shrink-0">
          <Link href="/home" className="flex items-center gap-[var(--spacing-3)]" aria-label="Huntaze home">
            <Image
              src="/logos/huntaze-vertical.svg"
              alt="Huntaze logo"
              width={28}
              height={28}
            />
            <span className="text-base font-semibold" style={{ color: '#ffffff' }}>Beta</span>
          </Link>
        </div>

        {/* Mobile: Search pill (prend toute la largeur disponible) */}
        <button
          type="button"
          className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-full flex-1 min-w-0"
          style={{
            backgroundColor: '#303030',
            border: '1px solid #3a3a3a',
            color: '#a0a0a0',
            minHeight: '40px',
          }}
          aria-label="Search"
        >
          <Search size={16} aria-hidden="true" className="shrink-0" />
          <span className="text-sm truncate">Search</span>
        </button>

        {/* Desktop: full search */}
        <div className="hidden lg:flex flex-1 min-w-0 justify-center px-4">
          <div className="w-full max-w-[680px]">
            <GlobalSearch />
          </div>
        </div>

        {/* Right - Mobile: IA + Huntaze Beta | Desktop: full user menu */}
        <div className="flex items-center gap-2 lg:gap-[var(--spacing-4)] lg:w-[240px] shrink-0 lg:justify-end">
          {/* Majordome IA button */}
          <button
            type="button"
            onClick={toggleAssistant}
            className="rounded-lg relative group p-2 hover:bg-white/10 transition-colors"
            style={{ minWidth: '44px', minHeight: '44px' }}
            aria-label="Majordome"
            aria-haspopup="dialog"
            aria-controls="majordome-drawer"
            aria-expanded={isOpen}
            title="Majordome"
          >
            <AssistantIcon size={28} />
          </button>

          {/* Mobile: Logo Huntaze + Beta (à droite) */}
          <Link href="/home" className="lg:hidden flex items-center gap-1.5" aria-label="Huntaze home">
            <Image
              src="/logos/huntaze-vertical.svg"
              alt="Huntaze logo"
              width={22}
              height={22}
            />
            <span className="text-xs font-semibold" style={{ color: '#ffffff' }}>Beta</span>
          </Link>

          {/* Desktop only: Notifications */}
          <button
            className="hidden lg:flex rounded-lg items-center justify-center"
            style={{
              padding: 'var(--spacing-2)',
              color: 'var(--header-text-muted)',
              transition: 'all var(--transition-fast)',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--header-icon-hover-bg)';
              e.currentTarget.style.color = 'var(--header-text)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--header-text-muted)';
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 3px var(--header-focus-ring)';
              e.currentTarget.style.outline = 'none';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
            aria-label="Notifications"
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
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>

          {/* Desktop only: User Menu */}
          <div className="hidden lg:flex items-center gap-[var(--spacing-3)] min-w-0">
            <div 
              className="rounded-full flex items-center justify-center"
              style={{
                width: 'var(--spacing-8)',
                height: 'var(--spacing-8)',
                backgroundColor: 'var(--color-accent-primary)',
                color: 'var(--color-text-inverse)',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)'
              }}
            >
              {session?.user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p 
                className="truncate"
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--header-text)'
                }}
              >
                {session?.user?.name || 'User'}
              </p>
              <p 
                className="truncate"
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--header-text-muted)'
                }}
              >
                {session?.user?.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
