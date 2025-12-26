'use client';

import React from 'react';
import Image from 'next/image';

/**
 * Fan context data model
 */
export interface FanContext {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  ltv: number;
  averageOrder?: number;
  lastPurchase?: Date | null;
  memberSince?: string;
  isVIP?: boolean;
  status: 'vip' | 'active' | 'at-risk' | 'churned';
  notes: string[];
  purchaseHistory: {
    date: Date;
    amount: number;
    item: string;
  }[];
}

/**
 * FanContextSidebar component props
 */
export interface FanContextSidebarProps {
  fan: FanContext | null;
  loading?: boolean;
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}


/**
 * Skeleton loader for the sidebar
 */
function SidebarSkeleton() {
  return (
    <div className="p-4 space-y-4 animate-pulse" data-testid="fan-context-loading">
      <div className="h-32 bg-gray-100 rounded-xl" />
      <div className="h-28 bg-gray-100 rounded-xl" />
      <div className="h-32 bg-gray-100 rounded-xl" />
      <div className="h-40 bg-gray-100 rounded-xl" />
    </div>
  );
}

/**
 * Empty state when no fan is selected
 */
function EmptyState() {
  return (
    <div 
      className="flex flex-col items-center justify-center h-full p-6 text-center"
      data-testid="fan-context-empty"
    >
      <div className="w-12 h-12 mb-3 rounded-full bg-gray-100 flex items-center justify-center">
        <svg 
          className="w-6 h-6 text-gray-400" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
          />
        </svg>
      </div>
      <p className="text-sm text-gray-500">Select a conversation to view fan details</p>
    </div>
  );
}

export function FanContextSidebar({ fan, loading = false }: FanContextSidebarProps) {
  if (loading) {
    return (
      <aside className="flex h-full flex-col bg-white border-l border-slate-200">
        <div className="flex-1 flex items-center justify-center text-xs text-slate-500">Loading…</div>
      </aside>
    );
  }

  if (!fan) {
    return (
      <aside className="flex h-full flex-col bg-white border-l border-slate-200">
        <div className="flex-1 flex items-center justify-center text-xs text-slate-500 px-4 text-center">
          Select a conversation to view fan details.
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="w-96 flex-shrink-0 border-l border-slate-200 bg-white h-full flex flex-col font-sans text-slate-900 overflow-hidden"
      data-testid="fan-context-sidebar"
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-200 flex items-center gap-3">
        <div className="h-11 w-11 rounded-full overflow-hidden bg-slate-100 shrink-0">
          {fan.avatar ? (
            <Image src={fan.avatar} alt={fan.name} width={44} height={44} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-slate-200 text-sm font-semibold text-slate-600">
              {fan.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900 truncate">{fan.name}</div>
          {fan.username ? <div className="text-xs text-slate-500 truncate">@{fan.username}</div> : null}
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 space-y-6">
          {/* Lifetime Value */}
          <section>
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 mb-2">
              Lifetime value
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-slate-500 mb-1">Total</div>
                <div className="text-base font-semibold text-slate-900">{formatCurrency(fan.ltv)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Avg. order</div>
                <div className="text-base font-semibold text-slate-900">
                  {fan.averageOrder ? formatCurrency(fan.averageOrder) : '—'}
                </div>
              </div>
            </div>
          </section>

          <div className="h-px bg-slate-200" />

          {/* Notes */}
          <section data-testid="fan-notes-section">
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 mb-2">Notes</div>
            <div className="space-y-1 text-sm text-slate-900">
              {fan.notes.length ? (
                fan.notes.map((note, idx) => (
                  <p key={idx} className="leading-snug">
                    • {note}
                  </p>
                ))
              ) : (
                <p className="text-xs text-slate-500">No notes yet.</p>
              )}
            </div>
          </section>

          <div className="h-px bg-slate-200" />

          {/* Recent History */}
          <section data-testid="fan-purchase-history-section">
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 mb-2">Recent history</div>
            <div className="space-y-2 text-sm">
              {fan.purchaseHistory.length ? (
                fan.purchaseHistory.map(purchase => (
                  <div key={purchase.date.toISOString()} className="flex items-center justify-between">
                    <div>
                      <div className="text-slate-900">{purchase.item}</div>
                      <div className="text-xs text-slate-500">{formatDate(purchase.date)}</div>
                    </div>
                    <div className="text-sm font-medium text-slate-900">{formatCurrency(purchase.amount)}</div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500">No recent purchases.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
        <p>Subscriber since {fan.memberSince || '—'}</p>
      </div>
    </aside>
  );
}

export default FanContextSidebar;
