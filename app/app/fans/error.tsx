'use client';

export default function ErrorFans({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
      <div className="font-semibold">Failed to load fans.</div>
      <div className="text-sm opacity-80">{error.message}</div>
      <button className="mt-3 rounded bg-red-600 px-3 py-1.5 text-white text-sm" onClick={reset}>Retry</button>
    </div>
  );
}

