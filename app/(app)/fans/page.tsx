'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

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
      <div>
        <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fans</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage and track your fan relationships
          </p>
        </div>
        <Link
          href="/fans/import"
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Fan
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : fans.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              All Fans ({fans.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {fans.map((fan) => (
              <div key={fan.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{fan.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {fan.platform || 'custom'} {fan.handle && `• @${fan.handle}`}
                  </p>
                </div>
                {typeof fan.valueCents === 'number' && fan.valueCents > 0 && (
                  <span className="font-bold text-gray-900 dark:text-white">
                    ${(fan.valueCents / 100).toFixed(2)}/mo
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
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
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            No fans yet
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Start building your fan database by adding your first fan.
          </p>
          <Link
            href="/fans/import"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add First Fan
          </Link>
        </div>
      )}
      </div>
    </ProtectedRoute>
  );
}
