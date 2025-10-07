"use client";
import { useEffect, useState } from 'react';

type Thread = {
  id: string;
  participants?: any[];
  messages?: { id: string; content?: string; createdAt?: string; tipAmount?: number }[];
};

export default function ThreadView({ threadId, initial }: { threadId: string; initial: Thread | null }) {
  const [data, setData] = useState<Thread | null>(initial);
  const [loading, setLoading] = useState(!initial);

  useEffect(() => {
    let cancelled = false;
    if (!initial) {
      (async () => {
        try {
          setLoading(true);
          const res = await fetch(`/api/of/threads/${threadId}`, { cache: 'no-store' });
          if (!cancelled && res.ok) setData(await res.json());
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }
    return () => { cancelled = true };
  }, [threadId, initial]);

  if (loading) return <div className="p-6 text-gray-600">Loading…</div>;
  if (!data) return <div className="p-6 text-gray-600">No data</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h2 className="text-xl font-semibold">Thread {data.id}</h2>
      <div className="rounded-xl border border-slate-200 bg-white">
        <ul className="divide-y divide-slate-100">
          {(data.messages || []).map((m) => (
            <li key={m.id} className="p-4">
              <div className="text-xs text-slate-500">{m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}</div>
              <div className="mt-1 whitespace-pre-line text-slate-900">{m.content || '(no content)'}</div>
              {typeof m.tipAmount === 'number' && m.tipAmount > 0 && (
                <div className="mt-1 inline-block text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Tip ${m.tipAmount.toFixed(2)}</div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

