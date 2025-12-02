'use client';
/**
 * Fetches real-time data from API or database
 * Requires dynamic rendering
 * Requirements: 2.1, 2.2
 */
export const dynamic = 'force-dynamic';


import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppPageHeader } from '@/components/layout/AppPageHeader';

export default function FansPage() {
  const [fans, setFans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/crm/fans', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setFans(data.fans || []);
        }
      } catch (error) {
        console.error('Failed to load fans:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <ProtectedRoute requireOnboarding={false}>
      <main className="flex flex-col gap-6 pb-8">
        <AppPageHeader
          title="Fans"
          description="Manage your fan base, imports and segments."
          actions={
            <>
              <Link href="/fans/import">
                <Button variant="outline" size="sm">
                  Import fans
                </Button>
              </Link>
              <Link href="/fans/import">
                <Button variant="primary" size="sm">
                  Add fan
                </Button>
              </Link>
            </>
          }
        />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : fans.length > 0 ? (
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
            <h3 className="text-lg font-semibold text-[var(--color-text-heading)]">
              All Fans ({fans.length})
            </h3>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {fans.map((fan) => (
              <div
                key={fan.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-[var(--bg-app)] transition-colors"
              >
                <div>
                  <p className="font-semibold text-[var(--color-text-main)]">{fan.name}</p>
                  <p className="text-sm text-[var(--color-text-sub)]">
                    {fan.platform || 'custom'} {fan.handle && `• @${fan.handle}`}
                  </p>
                </div>
                {typeof fan.valueCents === 'number' && fan.valueCents > 0 && (
                  <span className="font-bold text-[var(--color-text-main)]">
                    ${(fan.valueCents / 100).toFixed(2)}/mo
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-[var(--color-text-sub)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-[var(--color-text-heading)]">
            No fans yet
          </h3>
          <p className="mt-2 text-[var(--color-text-sub)]">
            Start building your fan database by adding your first fan.
          </p>
          <Link
            href="/fans/import"
            className="mt-6 inline-flex items-center gap-2"
          >
            <Button variant="primary" size="sm" className="inline-flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add First Fan
            </Button>
          </Link>
        </Card>
      )}
      </main>
    </ProtectedRoute>
  );
}
