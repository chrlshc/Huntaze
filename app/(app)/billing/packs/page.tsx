"use client";

import { useState } from 'react'

async function checkout(pack: '25k' | '100k' | '500k') {
  const res = await fetch('/api/billing/message-packs/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pack }),
  })
  const { url } = await res.json()
  if (url) window.location.href = url
}

export default function MessagePacksPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const packs = [
    { key: '25k', name: '25,000 messages', price: '$—', desc: 'Great for bursts' },
    { key: '100k', name: '100,000 messages', price: '$—', desc: 'Best seller' },
    { key: '500k', name: '500,000 messages', price: '$—', desc: 'For agencies' },
  ] as const

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-semibold">Message Packs</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Prepay messages at a discount. Credits never expire.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {packs.map((p) => (
          <div key={p.key} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">{p.name}</div>
            <div className="mt-1 text-gray-700 dark:text-gray-300">{p.price}</div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{p.desc}</p>
            <button
              onClick={async () => {
                setLoading(p.key)
                await checkout(p.key as any)
                setLoading(null)
              }}
              className="mt-4 w-full rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
              disabled={loading === p.key}
            >
              {loading === p.key ? 'Redirecting…' : 'Buy pack'}
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}

