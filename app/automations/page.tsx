'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function AutomationsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">← Back to Dashboard</Link>
            <div className="flex items-center gap-2 text-gray-700">
              <Zap className="w-5 h-5" />
              <span className="font-medium">Automations</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-gray-600">
          <p>Automation builder coming soon. Manage your active flows from the Dashboard.</p>
        </div>
      </main>
    </div>
  );
}

