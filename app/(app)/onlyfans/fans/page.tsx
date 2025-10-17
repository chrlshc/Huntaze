'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MobileFans from './mobile-page';
import { 
  Users, 
  ChevronLeft,
  UserPlus,
  Filter,
  Search,
  Plus
} from 'lucide-react';
import AppTopbar from '@/src/components/app-topbar';
import { VirtualList } from '@/src/components/ui/virtual-list';
import { motion } from 'framer-motion';

export default function FansPage() {
  const [profile, setProfile] = useState<any>(null);
  const [aiConfig, setAiConfig] = useState<any>(null);
  const [hasConnectedPlatforms, setHasConnectedPlatforms] = useState(false);
  const [fans, setFans] = useState<any[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  if (isMobile) {
    return <MobileFans />;
  }

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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <AppTopbar
        title="Fans"
        secondaryActions={[
          { label: 'Filter', icon: <Filter className="w-4 h-4" aria-hidden /> },
          { label: 'Search', icon: <Search className="w-4 h-4" aria-hidden /> },
        ]}
        primaryAction={{ label: 'Add Fan', href: '/fans/import', icon: <UserPlus className="w-4 h-4" aria-hidden /> }}
      />

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
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Fans ({fans.length})</h3>
              <Link href="/fans/import" className="text-sm text-purple-600 hover:text-purple-700 font-medium">Add another</Link>
            </div>
            <div className="max-h-[70vh] overflow-auto divide-y divide-gray-100 dark:divide-gray-800">
              <VirtualList
                items={fans}
                itemSize={64}
                overscan={8}
                renderRow={(f) => (
                  <motion.div key={f.id} layout className="p-4 flex items-center justify-between list-row">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{f.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{f.platform || 'custom'}</p>
                    </div>
                    {typeof f.valueCents === 'number' && f.valueCents > 0 && (
                      <span className="font-bold text-gray-900 dark:text-white">${(f.valueCents/100).toFixed(2)}/mo</span>
                    )}
                  </motion.div>
                )}
              />
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
                className="btn-gradient inline-flex items-center gap-2"
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
