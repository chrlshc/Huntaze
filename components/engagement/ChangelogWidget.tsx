'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import type { ChangelogEntry, ChangelogResponse } from '@/app/api/changelog/types';
import { Button } from "@/components/ui/button";

/**
 * Cookie utility functions for managing lastViewedChangelog
 */
const COOKIE_NAME = 'lastViewedChangelog';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year in seconds

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  
  return null;
}

function setCookie(name: string, value: string, maxAge: number): void {
  if (typeof document === 'undefined') return;
  
  document.cookie = `${name}=${value}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

/**
 * ChangelogWidget Component
 * 
 * Displays a "What's New" widget with a pulsing badge when new updates are available.
 * Uses cookie-based tracking to dismiss the badge once the user opens the widget.
 * 
 * Requirements satisfied:
 * - Requirement 7.1: Checks lastViewedChangelog cookie against latest release date
 * - Requirement 7.2: Displays pulsing badge when new update is available
 * - Requirement 7.3: Updates cookie when user opens the widget
 * - Requirement 7.4: Displays changelog widget as sidebar component
 * - Requirement 7.5: Handles CMS unavailability gracefully
 */
export function ChangelogWidget() {
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function checkForUpdates() {
      try {
        const response = await fetch('/api/changelog');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: ChangelogResponse = await response.json();
        
        setEntries(data.entries);
        
        // Requirement 7.1: Check lastViewedChangelog cookie against latest release date
        const lastViewed = getCookie(COOKIE_NAME);
        const latestRelease = new Date(data.latestReleaseDate);
        
        // Parse last viewed date, defaulting to epoch if invalid or missing
        let lastViewedDate = new Date(0);
        if (lastViewed) {
          const parsedDate = new Date(lastViewed);
          // Check if date is valid
          if (!isNaN(parsedDate.getTime())) {
            lastViewedDate = parsedDate;
          }
        }
        
        // Requirement 7.2: Display badge when new update is available
        setHasNewUpdate(latestRelease > lastViewedDate);
      } catch (error) {
        // Requirement 7.5: Handle CMS unavailability gracefully
        console.error('Failed to fetch changelog:', error);
        // Keep empty entries array as fallback
      } finally {
        setIsLoading(false);
      }
    }

    checkForUpdates();
  }, []);

  function handleOpen() {
    setIsOpen(true);
    // Requirement 7.3: Update cookie when user opens the widget
    setHasNewUpdate(false);
    setCookie(COOKIE_NAME, new Date().toISOString(), COOKIE_MAX_AGE);
  }

  function handleClose() {
    setIsOpen(false);
  }

  if (isLoading) {
    return (
      <Button variant="primary">
  <Bell strokeWidth={1.5} size={20} />
        <span className="text-sm">What's New</span>
</Button>
    );
  }

  return (
    <>
      <Button variant="primary" onClick={handleOpen} aria-label="New updates available">
  <Bell strokeWidth={1.5} size={20} />
        <span className="text-sm">What's New</span>
        {/* Requirement 7.2: Pulsing badge for new updates */}
        {hasNewUpdate && (
          <span 
            className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse" 
            aria-label="New updates available"
          />
        )}
</Button>

      {/* Sidebar Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={handleClose}
            aria-hidden="true"
          />
          
          {/* Sidebar */}
          <div className="fixed top-0 right-0 h-full w-full sm:max-w-md bg-background border-l border-border z-50 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">What's New</h2>
                <Button variant="primary" onClick={handleClose} aria-label="Close changelog">
  <X strokeWidth={1.5} size={20} />
</Button>
              </div>
              
              {entries.length === 0 ? (
                <div className="text-center text-muted">
                  <p>No changelog entries available.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {entries.map((entry) => (
                    <ChangelogEntryComponent key={entry.id} entry={entry} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

/**
 * ChangelogEntry Component
 * 
 * Displays a single changelog entry with title, date, description, and features.
 */
function ChangelogEntryComponent({ entry }: { entry: ChangelogEntry }) {
  return (
    <div className="border-l-2 border-primary pl-4">
      <h3 className="font-semibold text-foreground">{entry.title}</h3>
      <p className="text-xs text-muted mt-1">
        {new Date(entry.releaseDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
      <p className="text-sm text-muted mt-2">{entry.description}</p>
      {entry.features.length > 0 && (
        <ul className="mt-3 space-y-1">
          {entry.features.map((feature, idx) => (
            <li key={idx} className="text-sm text-foreground flex items-start gap-2">
              <span className="text-primary">•</span>
              {feature}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
