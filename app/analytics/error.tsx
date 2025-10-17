'use client';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-2xl font-semibold mb-2">Analytics indisponible</h1>
      <p className="text-gray-600 mb-6">{error?.message || 'Une erreur est survenue.'}</p>
      <button onClick={reset} className="inline-flex items-center rounded border px-3 py-1.5 hover:bg-gray-50">Réessayer</button>
    </main>
  )
}
