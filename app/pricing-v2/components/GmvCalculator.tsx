"use client";

import { useMemo, useState } from "react";
import { quote } from "@/src/lib/pricing/engine";
import { OVERAGE_PER_1K } from "@/src/lib/pricing/overage";

export default function GmvCalculator() {
  const [gmv, setGmv] = useState(5000);
  const [msgs, setMsgs] = useState(8000);
  const [entAnnual, setEntAnnual] = useState(true);
  const [applyPacks, setApplyPacks] = useState(false);

  const plans = ["starter", "pro", "scale", "enterprise"] as const;

  const quotes = useMemo(
    () =>
      plans.map((plan) => ({
        plan,
        q: quote({ plan, gmvUsd: gmv, aiMsgs: msgs, enterpriseAnnual: entAnnual }),
      })),
    [gmv, msgs, entAnnual]
  );

  const adjQuotes = useMemo(() => {
    if (!applyPacks) return quotes
    // Naive UI-only estimate: subtract up to $100 of overage to simulate small pack coverage
    return quotes.map(({ plan, q }) => ({ plan, q: { ...q, total: Math.max(0, q.total - Math.min(100, q.overage)) } }))
  }, [quotes, applyPacks])

  const recommended = useMemo(() => {
    const elig = quotes.filter(
      ({ plan, q }) => !(plan === "starter" && q.notes.some((n) => n.includes("Ineligible")))
    );
    return elig.sort((a, b) => a.q.total - b.q.total)[0];
  }, [quotes]);

  return (
    <section className="mt-12 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
        See your monthly cost & best plan
      </h3>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            GMV / month (USD)
          </label>
          <input
            type="range"
            min={0}
            max={50000}
            step={100}
            value={gmv}
            onChange={(e) => setGmv(Number(e.target.value))}
            className="mt-2 w-full"
          />
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            ${gmv.toLocaleString()}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            AI messages / month
          </label>
          <input
            type="range"
            min={0}
            max={100000}
            step={500}
            value={msgs}
            onChange={(e) => setMsgs(Number(e.target.value))}
            className="mt-2 w-full"
          />
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {msgs.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <input
          id="ent"
          type="checkbox"
          checked={entAnnual}
          onChange={(e) => setEntAnnual(e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="ent" className="text-sm text-gray-700 dark:text-gray-300">
          Enterprise: 2% with annual commitment
        </label>
        <span className="mx-2 text-gray-300">|</span>
        <input id="packs" type="checkbox" checked={applyPacks} onChange={(e) => setApplyPacks(e.target.checked)} className="h-4 w-4" />
        <label htmlFor="packs" className="text-sm text-gray-700 dark:text-gray-300">Apply message pack credits (est.)</label>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        {adjQuotes.map(({ plan, q }) => {
          const isRec = recommended?.plan === plan;
          return (
            <div
              key={plan}
              className={`rounded-xl border p-4 ${
                isRec ? "border-purple-500 shadow-lg" : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="text-sm font-medium uppercase text-gray-500 dark:text-gray-400">
                {plan}
              </div>
              <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                ${q.total.toFixed(0)}/mo
              </div>
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Platform fee: ${q.platformFee.toFixed(0)} · Base: ${q.base.toFixed(0)} · Overage est.: ${q.overage.toFixed(0)} ({OVERAGE_PER_1K[plan]}$/1k)
              </div>
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                Effective take: {(q.effectiveTakeRate * 100).toFixed(2)}%
              </div>
              {q.notes.length > 0 && (
                <div className="mt-2 rounded bg-gray-50 dark:bg-gray-900/50 p-2 text-xs text-gray-600 dark:text-gray-400">
                  {q.notes.map((n, i) => (
                    <div key={i}>• {n}</div>
                  ))}
                </div>
              )}
              {isRec && (
                <div className="mt-3 inline-flex rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold text-white">
                  Recommended
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-gray-500 dark:text-gray-500">
        No hidden fees. Payment processing (Stripe) not included (≈ 2.9% + $0.30/txn). Overage: $3 per additional 1,000 AI messages.
      </p>
    </section>
  );
}
