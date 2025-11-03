'use client';

import { useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Skeleton, SkeletonCard, SkeletonTable, SkeletonList } from '../../../components/ui/skeleton';

/**
 * Skeleton Loading Demo
 * 
 * Demonstrates skeleton screens with shimmer animation and dark mode support.
 * Requirements: 4.6
 */

export default function SkeletonDemo() {
  const [isLoading, setIsLoading] = useState(true);

  const toggleLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-theme-bg p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/demo/modal-animations"
              className="p-2 rounded-lg hover:bg-theme-border/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-theme-text" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-theme-text">Skeleton Screens</h1>
              <p className="text-theme-muted mt-1">
                Shimmer animation with dark mode support
              </p>
            </div>
          </div>
          <button
            onClick={toggleLoading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reload
          </button>
        </div>

        {/* Basic Skeletons */}
        <section className="bg-theme-surface rounded-xl p-6 border border-theme-border">
          <h2 className="text-xl font-semibold text-theme-text mb-4">Basic Variants</h2>
          <div className="space-y-6">
            {/* Text */}
            <div>
              <h3 className="text-sm font-medium text-theme-muted mb-2">Text (Single Line)</h3>
              <Skeleton variant="text" />
            </div>

            {/* Multiple Lines */}
            <div>
              <h3 className="text-sm font-medium text-theme-muted mb-2">Text (Multiple Lines)</h3>
              <Skeleton variant="text" lines={3} />
            </div>

            {/* Circular */}
            <div>
              <h3 className="text-sm font-medium text-theme-muted mb-2">Circular</h3>
              <div className="flex gap-3">
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton variant="circular" width={56} height={56} />
                <Skeleton variant="circular" width={72} height={72} />
              </div>
            </div>

            {/* Rectangular */}
            <div>
              <h3 className="text-sm font-medium text-theme-muted mb-2">Rectangular</h3>
              <Skeleton variant="rectangular" height={200} />
            </div>

            {/* Rounded */}
            <div>
              <h3 className="text-sm font-medium text-theme-muted mb-2">Rounded</h3>
              <Skeleton variant="rounded" height={120} />
            </div>
          </div>
        </section>

        {/* Card Skeleton */}
        <section className="bg-theme-surface rounded-xl p-6 border border-theme-border">
          <h2 className="text-xl font-semibold text-theme-text mb-4">Card Skeleton</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-theme-bg rounded-lg border border-theme-border">
              <SkeletonCard showAvatar={true} lines={3} />
            </div>
            <div className="bg-theme-bg rounded-lg border border-theme-border">
              <SkeletonCard showAvatar={false} lines={2} />
            </div>
          </div>
        </section>

        {/* List Skeleton */}
        <section className="bg-theme-surface rounded-xl p-6 border border-theme-border">
          <h2 className="text-xl font-semibold text-theme-text mb-4">List Skeleton</h2>
          <div className="bg-theme-bg rounded-lg border border-theme-border p-4">
            {isLoading ? (
              <SkeletonList items={5} showAvatar={true} />
            ) : (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {item}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-theme-text">Item {item}</h3>
                      <p className="text-sm text-theme-muted">This is item number {item}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Table Skeleton */}
        <section className="bg-theme-surface rounded-xl p-6 border border-theme-border">
          <h2 className="text-xl font-semibold text-theme-text mb-4">Table Skeleton</h2>
          <div className="bg-theme-bg rounded-lg border border-theme-border p-4">
            {isLoading ? (
              <SkeletonTable rows={5} columns={4} />
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-theme-border">
                    <th className="text-left py-2 px-3 text-sm font-medium text-theme-muted">Name</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-theme-muted">Email</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-theme-muted">Role</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-theme-muted">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((row) => (
                    <tr key={row} className="border-b border-theme-border last:border-0">
                      <td className="py-2 px-3 text-sm text-theme-text">User {row}</td>
                      <td className="py-2 px-3 text-sm text-theme-text">user{row}@example.com</td>
                      <td className="py-2 px-3 text-sm text-theme-text">Member</td>
                      <td className="py-2 px-3 text-sm">
                        <span className="px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded text-xs">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Social Feed Example */}
        <section className="bg-theme-surface rounded-xl p-6 border border-theme-border">
          <h2 className="text-xl font-semibold text-theme-text mb-4">Social Feed Example</h2>
          <div className="space-y-4">
            {isLoading ? (
              <>
                <div className="bg-theme-bg rounded-lg border border-theme-border p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton variant="circular" width={48} height={48} />
                    <div className="flex-1 space-y-3">
                      <Skeleton variant="text" width="40%" />
                      <Skeleton variant="text" lines={2} />
                      <Skeleton variant="rounded" height={200} />
                      <div className="flex gap-4">
                        <Skeleton variant="text" width={60} />
                        <Skeleton variant="text" width={60} />
                        <Skeleton variant="text" width={60} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-theme-bg rounded-lg border border-theme-border p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton variant="circular" width={48} height={48} />
                    <div className="flex-1 space-y-3">
                      <Skeleton variant="text" width="40%" />
                      <Skeleton variant="text" lines={3} />
                      <div className="flex gap-4">
                        <Skeleton variant="text" width={60} />
                        <Skeleton variant="text" width={60} />
                        <Skeleton variant="text" width={60} />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-theme-bg rounded-lg border border-theme-border p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      A
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-theme-text">Alice Johnson</h3>
                      <p className="text-sm text-theme-muted mt-1">
                        Just launched my new project! Check it out 🚀
                      </p>
                      <div className="mt-3 aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg" />
                      <div className="flex gap-4 mt-3 text-sm text-theme-muted">
                        <button className="hover:text-theme-text">❤️ 42 likes</button>
                        <button className="hover:text-theme-text">💬 8 comments</button>
                        <button className="hover:text-theme-text">🔗 Share</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-theme-bg rounded-lg border border-theme-border p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                      B
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-theme-text">Bob Smith</h3>
                      <p className="text-sm text-theme-muted mt-1">
                        Amazing sunset today! Nature is beautiful 🌅
                      </p>
                      <div className="flex gap-4 mt-3 text-sm text-theme-muted">
                        <button className="hover:text-theme-text">❤️ 156 likes</button>
                        <button className="hover:text-theme-text">💬 23 comments</button>
                        <button className="hover:text-theme-text">🔗 Share</button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Code Example */}
        <section className="bg-theme-surface rounded-xl p-6 border border-theme-border">
          <h2 className="text-xl font-semibold text-theme-text mb-4">Usage Example</h2>
          <pre className="bg-theme-bg p-4 rounded-lg overflow-x-auto text-sm">
            <code className="text-theme-text">{`import { Skeleton, SkeletonCard, SkeletonList } from '@/components/ui/Skeleton';

// Basic skeleton
<Skeleton variant="text" lines={3} />

// Circular avatar
<Skeleton variant="circular" width={48} height={48} />

// Pre-built card
<SkeletonCard showAvatar={true} lines={3} />

// Pre-built list
<SkeletonList items={5} showAvatar={true} />

// Conditional rendering
{isLoading ? (
  <SkeletonList items={5} />
) : (
  <div>{content}</div>
)}`}</code>
          </pre>
        </section>
      </div>
    </div>
  );
}
