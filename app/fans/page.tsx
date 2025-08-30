'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  ChevronLeft,
  UserPlus,
  Filter,
  Search,
  Plus
} from 'lucide-react';

export default function FansPage() {
  const [profile, setProfile] = useState<any>(null);
  const [aiConfig, setAiConfig] = useState<any>(null);
  const [hasConnectedPlatforms, setHasConnectedPlatforms] = useState(false);
  const [fans, setFans] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [p, a] = await Promise.all([
          fetch('/api/users/profile', { cache: 'no-store' }),
          fetch('/api/ai/config', { cache: 'no-store' }),
        ]);
        if (p.ok) setProfile(await p.json());
        if (a.ok) {
          const config = await a.json();
          setAiConfig(config);
          setHasConnectedPlatforms(config.platforms?.length > 0);
        }
        const lf = await fetch('/api/crm/fans', { cache: 'no-store' });
        if (lf.ok) {
          const data = await lf.json();
          setFans(data.fans || []);
        }
      } catch {}
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-semibold">Fans</h1>
            </div>

            <div className="flex items-center gap-3">
              <button className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm">
                <Filter className="w-4 h-4 inline mr-1" />
                Filter
              </button>
              <button className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm">
                <Search className="w-4 h-4 inline mr-1" />
                Search
              </button>
              <Link href="/fans/import" className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                <UserPlus className="w-4 h-4 inline mr-1" />
                Add Fan
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 lg:px-8 py-6 max-w-6xl mx-auto">
        {/* Alert for no platform */}
        {!hasConnectedPlatforms && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
            <Link href="/platforms/connect" className="text-amber-800">
              Connect a platform to import fans →
            </Link>
          </div>
        )}
        
        {/* Fans list */}
        {fans.length > 0 ? (
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-medium">All Fans ({fans.length})</h3>
              <Link href="/fans/import" className="text-sm text-purple-600">Add</Link>
            </div>
            <div className="divide-y">
              {fans.map((f) => (
                <div key={f.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="font-medium">{f.name}</p>
                    <p className="text-sm text-gray-500">{f.platform || 'custom'}</p>
                  </div>
                  {typeof f.valueCents === 'number' && f.valueCents > 0 && (
                    <span className="text-sm font-medium">${(f.valueCents/100).toFixed(2)}/mo</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No fans yet</h2>
            <p className="text-gray-600 mb-6">Start building your fan database</p>
            
            <Link 
              href={hasConnectedPlatforms ? "/fans/import" : "/platforms/connect"}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus className="w-4 h-4" />
              {hasConnectedPlatforms ? "Add First Fan" : "Connect Platform"}
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
