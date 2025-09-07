"use client";

import Link from 'next/link';

const items = [
  { id: 'platform', label: 'Platform' },
  { id: 'for-everyone', label: 'For everyone' },
  { id: 'sell', label: 'Sell' },
  { id: 'customers', label: 'Customers' },
  { id: 'global', label: 'Global' },
  { id: 'manage', label: 'Manage' },
  { id: 'performance', label: 'Performance' },
  { id: 'support', label: 'Support' },
  { id: 'quickstart', label: 'Quick start' },
];

export default function MobileAnchorNav() {
  return (
    <nav className="lg:hidden sticky top-[64px] z-40 bg-white/85 dark:bg-black/85 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 overflow-x-auto">
        <div className="flex gap-2 py-3">
          {items.map((it) => (
            <Link key={it.id} href={`/#${it.id}`} className="whitespace-nowrap px-3 py-1.5 rounded-lg text-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-purple-400 dark:hover:border-purple-600">
              {it.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

