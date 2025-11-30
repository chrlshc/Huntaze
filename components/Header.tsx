'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { MobileSidebar } from './MobileSidebar';
import { GlobalSearch } from './dashboard/GlobalSearch';
import { Button } from "@/components/ui/button";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="huntaze-header">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-[var(--spacing-4)]">
          <MobileSidebar />
          <h2 
            className="hidden md:block"
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--nav-text)'
            }}
          >
            Huntaze
          </h2>
        </div>

        {/* Global Search - Hidden on mobile */}
        <div className="hidden md:block flex-1 max-w-md mx-8">
          <GlobalSearch />
        </div>

        <div className="flex items-center gap-[var(--spacing-4)]">
          {/* Notifications */}
          <button
            className="rounded-lg"
            style={{
              padding: 'var(--spacing-2)',
              color: 'var(--nav-text-muted)',
              transition: 'all var(--transition-fast)',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--nav-hover)';
              e.currentTarget.style.color = 'var(--nav-text)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--nav-text-muted)';
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 3px var(--nav-border-strong)';
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

          {/* User Menu */}
          <div className="flex items-center gap-[var(--spacing-3)]">
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
            <div className="hidden md:block">
              <p 
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--nav-text)'
                }}
              >
                {session?.user?.name || 'User'}
              </p>
              <p 
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--nav-text-muted)'
                }}
              >
                {session?.user?.email}
              </p>
            </div>
            <Button 
              variant="primary" 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="rounded-lg"
              style={{
                padding: 'var(--spacing-2)',
                color: 'var(--nav-text-muted)',
                transition: 'all var(--transition-fast)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.backgroundColor = 'var(--nav-hover)';
                e.currentTarget.style.color = 'var(--nav-text)';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--nav-text-muted)';
              }}
              onFocus={(e: React.FocusEvent<HTMLButtonElement>) => {
                e.currentTarget.style.boxShadow = '0 0 0 3px var(--nav-border-strong)';
                e.currentTarget.style.outline = 'none';
              }}
              onBlur={(e: React.FocusEvent<HTMLButtonElement>) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
              aria-label="Sign out"
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
</Button>
          </div>
        </div>
      </div>
    </header>
  );
}
