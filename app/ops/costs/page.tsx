"use client";

import { useEffect, useState } from 'react';

type Totals = { totalCost: number; totalMsgs: number; totalTokensIn: number; totalTokensOut: number }
type RowMap = Record<string, { costUsd: number; msgs: number }>

export default function OpsCostsPage() {
  const [data, setData] = useState<{ totals: Totals; byTier: RowMap; byPlan: RowMap } | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/ops/costs', { cache: 'no-store' })
        if (r.ok) setData(await r.json())
      } catch {}
    })()
  }, [])

  if (!data) return <div className="p-6">Loading…</div>

  const { totals, byTier, byPlan } = data
  const planRows = Object.entries(byPlan)
  const tierRows = Object.entries(byTier)

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-semibold">Ops · Blended AI Costs (30 days)</h1>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card label="Total AI cost" value={`$${totals.totalCost.toFixed(2)}`} />
        <Card label="Total messages" value={totals.totalMsgs.toLocaleString()} />
        <Card label="$ / 1,000 messages" value={(totals.totalMsgs > 0 ? (totals.totalCost / (totals.totalMsgs / 1000)) : 0).toFixed(2)} />
      </div>

      <h2 className="mt-8 text-lg font-semibold">By plan</h2>
      <Table rows={planRows} />

      <h2 className="mt-8 text-lg font-semibold">By tier</h2>
      <Table rows={tierRows} note="Aim for ≥60–70% of traffic on economy/standard at Scale." />
    </main>
  )
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:bg-gray-900 dark:border-gray-800">
      <div className="text-xs uppercase text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{value}</div>
    </div>
  )
}

function Table({ rows, note }: { rows: [string, { costUsd: number; msgs: number }][]; note?: string }) {
  return (
    <div className="mt-2 overflow-x-auto rounded-xl border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          <tr>
            <th className="px-4 py-2 text-left">Key</th>
            <th className="px-4 py-2 text-right">Cost (USD)</th>
            <th className="px-4 py-2 text-right">Messages</th>
            <th className="px-4 py-2 text-right">$ / 1,000</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([key, v]) => (
            <tr key={key} className="border-t border-gray-100 dark:border-gray-800">
              <td className="px-4 py-2 text-gray-900 dark:text-white">{key}</td>
              <td className="px-4 py-2 text-right text-gray-900 dark:text-white">${v.costUsd.toFixed(2)}</td>
              <td className="px-4 py-2 text-right text-gray-900 dark:text-white">{v.msgs.toLocaleString()}</td>
              <td className="px-4 py-2 text-right text-gray-900 dark:text-white">{(v.msgs > 0 ? (v.costUsd / (v.msgs / 1000)) : 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {note && <div className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{note}</div>}
    </div>
  )
}

