"use client";

/**
 * Fetches real-time data from API or database
 * Requires dynamic rendering
 * Requirements: 2.1, 2.2
 */
export const dynamic = 'force-dynamic';

import { useState } from 'react'
import { useAsyncOperation, AsyncErrorDisplay } from '@/components/dashboard/AsyncOperationWrapper'
import { Loader2 } from 'lucide-react'

async function checkout(pack: '25k' | '100k' | '500k') {
  const res = await fetch('/api/billing/message-packs/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pack }),
  })
  
  if (!res.ok) {
    throw new Error('Failed to create checkout session')
  }
  
  const { url } = await res.json()
  if (url) window.location.href = url
  else throw new Error('No checkout URL received')
}

export default function MessagePacksPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const { error, execute, reset } = useAsyncOperation({
    timeout: 10000, // 10 second timeout
  })
  
  const packs = [
    { key: '25k', name: '25,000 messages', price: '$—', desc: 'Great for bursts' },
    { key: '100k', name: '100,000 messages', price: '$—', desc: 'Best seller' },
    { key: '500k', name: '500,000 messages', price: '$—', desc: 'For agencies' },
  ] as const

  const handleCheckout = async (pack: '25k' | '100k' | '500k') => {
    setLoading(pack)
    reset() // Clear any previous errors
    
    await execute(async () => {
      await checkout(pack)
    })
    
    setLoading(null)
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-semibold text-[var(--color-text-main)]">Message Packs</h1>
      <p className="mt-2 text-sm text-[var(--color-text-sub)]">Prepay messages at a discount. Credits never expire.</p>

      {error && (
        <div className="mt-6">
          <AsyncErrorDisplay 
            error={error} 
            onRetry={() => {
              if (loading) {
                handleCheckout(loading as '25k' | '100k' | '500k')
              }
            }} 
          />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {packs.map((p) => (
          <div key={p.key} className="rounded-xl border border-gray-200 bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-soft)]">
            <div className="text-lg font-semibold text-[var(--color-text-main)]">{p.name}</div>
            <div className="mt-1 text-[var(--color-text-main)]">{p.price}</div>
            <p className="mt-2 text-sm text-[var(--color-text-sub)]">{p.desc}</p>
            <button
              onClick={() => handleCheckout(p.key as any)}
              className="mt-4 w-full rounded-md bg-[var(--color-indigo)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading === p.key}
            >
              {loading === p.key ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirecting…
                </>
              ) : (
                'Buy pack'
              )}
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}

