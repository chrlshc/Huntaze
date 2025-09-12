"use client";

import { useEffect, useMemo, useState } from "react";
import { quote } from "@/src/lib/pricing/engine";

type Plan = "starter" | "pro" | "scale" | "enterprise";
type Enforcement = "ok" | "warn_1" | "blocked";
type Snapshot = { month: string; gmvUsd: number; aiMsgs: number; plan: Plan; enforcement: Enforcement };
type ApiResp = { accountId: string; window: string; current: Snapshot; history: Snapshot[] };

export default function EffectiveTakeRateCard({ accountId }: { accountId: string }) {
  const [data, setData] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/metrics/monthly?accountId=${encodeURIComponent(accountId)}&window=90d`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed');
        const json = await res.json();
        if (mounted) setData(json);
      } catch (e) {
        // noop
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [accountId]);

  const current = data?.current;
  const q = useMemo(() => {
    if (!current) return null;
    return quote({ plan: current.plan, gmvUsd: current.gmvUsd, aiMsgs: current.aiMsgs, enterpriseAnnual: true });
  }, [current]);

  const prev = data?.history?.[1];
  const prevQ = useMemo(() => {
    if (!prev) return null;
    return quote({ plan: prev.plan, gmvUsd: prev.gmvUsd, aiMsgs: prev.aiMsgs, enterpriseAnnual: true });
  }, [prev]);

  const trendPct = q && prevQ && prev?.gmvUsd && prev.gmvUsd > 0 ? ((q.effectiveTakeRate - prevQ.effectiveTakeRate) * 100).toFixed(2) : null;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:bg-gray-900 dark:border-gray-800">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Effective Take Rate</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">All‑in monthly cost ÷ GMV</p>
        </div>
        {current?.enforcement !== 'ok' && (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
            current?.enforcement === 'warn_1' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'
          }`}>
            {current?.enforcement === 'warn_1' ? 'Starter limit: warning' : 'Starter: blocked'}
          </span>
        )}
      </div>

      {loading || !current || !q ? (
        <div className="mt-6 h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-6 md:grid-cols-4">
            <Stat label="Current plan" value={current.plan.toUpperCase()} />
            <Stat label="GMV (this month)" value={`$${current.gmvUsd.toLocaleString()}`} />
            <Stat label="Huntaze cost" value={`$${q.total.toFixed(0)}/mo`} />
            <Stat label="Effective take" value={`${(q.effectiveTakeRate * 100).toFixed(2)}%`} />
          </div>

          <div className="mt-4 text-xs text-gray-600 dark:text-gray-400">
            Platform fee: ${q.platformFee.toFixed(0)} · Base: ${q.base.toFixed(0)} · Overage: ${q.overage.toFixed(0)}
            {q.notes?.length ? (
              <div className="mt-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                {q.notes.map((n, i) => (
                  <div key={i}>• {n}</div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {trendPct !== null && (
                <>
                  Trend vs last month:&nbsp;
                  <span className={Number(trendPct) <= 0 ? 'text-emerald-600' : 'text-amber-700'}>
                    {Number(trendPct) > 0 ? '+' : ''}
                    {trendPct} pp
                  </span>
                </>
              )}
            </div>
            <a href="/pricing-v2#calculator" className="text-sm font-medium text-violet-700 hover:underline dark:text-violet-400">
              See savings & recommendations →
            </a>
          </div>
        </>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 p-4 dark:border-gray-800">
      <div className="text-xs uppercase text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{value}</div>
    </div>
  );
}

