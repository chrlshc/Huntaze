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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ChevronLeft className="w-5 h-5" />
                <span className="font-medium">Dashboard</span>
              </Link>
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-purple-600" />
                <h1 className="text-xl font-bold text-gray-900">Fans</h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filter</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <Search className="w-4 h-4" />
                <span className="text-sm font-medium">Search</span>
              </button>
              <Link href="/fans/import" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all">
                <UserPlus className="w-4 h-4" />
                <span className="font-medium">Add Fan</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        {/* Alert for no platform */}
        {!hasConnectedPlatforms && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
            <p className="text-amber-900 font-medium">
              🔗 Connect a platform to start importing fans
            </p>
            <Link href="/platforms/connect" className="text-amber-700 text-sm hover:text-amber-800 underline">
              Connect now →
            </Link>
          </div>
        )}
        
        {/* Fans list */}
        {fans.length > 0 ? (
          <div className="elevated-card rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">All Fans ({fans.length})</h3>
              <Link href="/fans/import" className="text-sm text-purple-600 hover:text-purple-700 font-medium">Add another</Link>
            </div>
            <div className="divide-y divide-gray-100">
              {fans.map((f) => (
                <div key={f.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-semibold text-gray-900">{f.name}</p>
                    <p className="text-sm text-gray-500">{f.platform || 'custom'}</p>
                  </div>
                  {typeof f.valueCents === 'number' && f.valueCents > 0 && (
                    <span className="font-bold text-gray-900">${(f.valueCents/100).toFixed(2)}/mo</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="elevated-card rounded-xl overflow-hidden">
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl mb-6">
                <Users className="w-10 h-10 text-purple-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Build Your Fan Database</h2>
              <p className="text-lg text-gray-600 max-w-xl mx-auto mb-8">Start organizing and understanding your community better</p>
              
              <Link 
                href={hasConnectedPlatforms ? "/fans/import" : "/platforms/connect"}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all font-medium"
              >
                <Plus className="w-5 h-5" />
                {hasConnectedPlatforms ? "Add First Fan" : "Connect Platform"}
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
