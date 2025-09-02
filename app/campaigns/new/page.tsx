'use client';

import Link from 'next/link';

export default function NewCampaignPage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Create New Campaign</h1>
      <div className="elevated-card p-8 rounded-lg text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Campaign creation coming soon!
        </p>
        <Link href="/campaigns" className="text-purple-600">
          ← Back to campaigns
        </Link>
      </div>
    </div>
  );
}

