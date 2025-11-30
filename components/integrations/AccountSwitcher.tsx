'use client';

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IntegrationIcon } from './IntegrationIcon';
import { Button } from "@/components/ui/button";
import { Card } from '@/components/ui/card';

export interface Account {
  providerAccountId: string;
  username?: string;
  displayName?: string;
  profilePictureUrl?: string;
  metadata?: Record<string, any>;
}

export interface AccountSwitcherProps {
  provider: 'instagram' | 'tiktok' | 'reddit' | 'onlyfans';
  accounts: Account[];
  selectedAccountId: string;
  onAccountChange: (accountId: string) => void;
  className?: string;
}

/**
 * Account Switcher Component
 * 
 * Allows users to switch between multiple accounts for the same platform.
 * Displays a dropdown with all connected accounts and highlights the selected one.
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */
export function AccountSwitcher({
  provider,
  accounts,
  selectedAccountId,
  onAccountChange,
  className,
}: AccountSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedAccount = accounts.find(
    (account) => account.providerAccountId === selectedAccountId
  );

  if (accounts.length <= 1) {
    // Don't show switcher if only one account
    return null;
  }

  const getDisplayName = (account: Account): string => {
    return (
      account.displayName ||
      account.username ||
      account.metadata?.username ||
      account.providerAccountId
    );
  };

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-sm font-medium text-content-primary transition hover:border-border-strong hover:bg-surface-muted"
        aria-label="Switch account"
        aria-expanded={isOpen}
      >
        <IntegrationIcon provider={provider} size="sm" />
        <span className="flex-1 text-left">
          {selectedAccount ? getDisplayName(selectedAccount) : 'Select account'}
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-content-secondary transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown */}
          <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-lg border border-border-subtle bg-surface-raised shadow-lg">
            <div className="max-h-64 overflow-y-auto">
              {accounts.map((account) => {
                const isSelected = account.providerAccountId === selectedAccountId;
                const displayName = getDisplayName(account);

                return (
                  <button
                    key={account.providerAccountId}
                    onClick={() => {
                      onAccountChange(account.providerAccountId);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition',
                      isSelected
                        ? 'bg-primary/10 text-primary'
                        : 'text-content-primary hover:bg-surface-muted'
                    )}
                  >
                    <IntegrationIcon provider={provider} size="sm" />
                    <span className="flex-1 truncate">{displayName}</span>
                    {isSelected && <Check className="h-4 w-4 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
