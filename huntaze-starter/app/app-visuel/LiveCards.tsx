"use client";
import { useEffect, useState } from 'react';

type Badges = Record<string, number>;

export default function LiveCards() {
  const [badges, setBadges] = useState<Badges | null>(null);
  const [ofConn, setOfConn] = useState<{ connected?: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const base = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
    const origin = base || window.location.origin;

    (async () => {
      try {
        setError(null);
        const [b, s] = await Promise.all([
          fetch(`${origin}/api/nav/badges`, { credentials: 'include' }),
          fetch(`${origin}/api/integrations/onlyfans/status`, { credentials: 'include' }),
        ]);
        setBadges(b.ok ? await b.json() : {});
        setOfConn(s.ok ? await s.json() : {});
      } catch (e: any) {
        setError(e?.message || 'Échec du chargement des indicateurs');
      }
    })();
  }, []);

  const items = [
    { label: 'Messages non lus', value: badges?.['messages.unread'] ?? 0 },
    { label: 'Nouveaux fans (24h)', value: badges?.['fans.new'] ?? 0 },
    { label: 'Campagnes actives', value: badges?.['campaigns.active'] ?? 0 },
    { label: 'Alertes analytics', value: badges?.['analytics.alerts'] ?? 0 },
  ];

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{item.value}</p>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-200">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">OnlyFans</p>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">Session navigateur</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              ofConn?.connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {ofConn?.connected ? 'Connecté' : 'Non connecté'}
          </span>
        </div>
      </div>
      {error ? <p className="mt-3 text-xs text-red-600">{error}</p> : null}
    </section>
  );
}
