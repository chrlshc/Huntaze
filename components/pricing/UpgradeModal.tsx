"use client";

import { useMemo, useState } from 'react';
import { quote, recommendPlan } from '@/src/lib/pricing/engine';

export default function UpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [gmv, setGmv] = useState(6000);
  const [msgs, setMsgs] = useState(8000);
  const plans: ('pro' | 'scale' | 'enterprise')[] = ['pro', 'scale', 'enterprise'];

  const quotes = useMemo(() => plans.map((p) => ({
    plan: p,
    q: quote({ plan: p as any, gmvUsd: gmv, aiMsgs: msgs, enterpriseAnnual: true })
  })), [gmv, msgs]);

  const recPlan = useMemo(() => recommendPlan({ gmvUsd: gmv, aiMsgs: msgs, enterpriseAnnual: true }), [gmv, msgs]);
  const rec = quotes.find((x) => x.plan === recPlan) ?? quotes[0];

  const [loading, setLoading] = useState(false);
  async function handleUpgrade(plan: 'pro' | 'scale' | 'enterprise') {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, enterpriseAnnual: true })
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" aria-modal>
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upgrade plan</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-200">✕</button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {quotes.map(({ plan, q }) => {
            const isRec = rec?.plan === plan;
            return (
              <div key={plan} className={`rounded-lg border p-4 ${isRec ? 'border-violet-500 shadow' : 'border-gray-200 dark:border-gray-800'}`}>
                <div className="text-sm uppercase text-gray-500 dark:text-gray-400">{plan}</div>
                <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">${q.total.toFixed(0)}/mo</div>
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  Platform: ${q.platformFee.toFixed(0)} · Base: ${q.base.toFixed(0)} · Overage: ${q.overage.toFixed(0)}
                </div>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">Effective take: {(q.effectiveTakeRate * 100).toFixed(2)}%</div>
                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={loading}
                  className={`mt-3 w-full rounded-md px-3 py-2 text-sm font-semibold text-white ${
                    plan === 'enterprise' ? 'bg-gray-900 hover:bg-black' : 'bg-violet-600 hover:bg-violet-700'
                  }`}
                >
                  {loading ? 'Redirecting…' : plan === 'enterprise' ? 'Contact Sales / Annual' : 'Upgrade'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">GMV / month</label>
            <input type="range" min={0} max={50000} step={100} value={gmv} onChange={(e) => setGmv(+e.target.value)} className="mt-2 w-full" />
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">${gmv.toLocaleString()}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">AI messages / month</label>
            <input type="range" min={0} max={100000} step={500} value={msgs} onChange={(e) => setMsgs(+e.target.value)} className="mt-2 w-full" />
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">{msgs.toLocaleString()}</div>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">
          No hidden fees. Payment processing (Stripe) not included (≈ 2.9% + $0.30/txn).
        </p>
      </div>
    </div>
  );
}

