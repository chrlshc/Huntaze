'use client';

import React from 'react';

type ScheduledEvt = {
  platform: 'instagram' | 'tiktok' | 'reddit';
  externalId: string;
  at: string; // ISO
};

type FailedEvt = {
  platform: 'instagram' | 'tiktok' | 'reddit';
  contentId: string;
  error: { message: string; code?: any };
};

type BatchDoneEvt = {
  correlation: string;
  results: Array<{ platform: string; externalId: string; at: string }>;
};

type FeedItem =
  | { kind: 'POST_SCHEDULED'; data: { correlation?: string } & ScheduledEvt }
  | { kind: 'POST_FAILED'; data: FailedEvt & { correlation?: string } }
  | { kind: 'PUBLISH_BATCH_DONE'; data: BatchDoneEvt };

const Badge: React.FC<{ p: string }> = ({ p }) => (
  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">{p}</span>
);

export default function ScheduledFeed() {
  const [feed, setFeed] = React.useState<FeedItem[]>([]);
  const [filters, setFilters] = React.useState<Record<string, boolean>>({
    POST_SCHEDULED: true,
    POST_FAILED: true,
    PUBLISH_BATCH_DONE: true,
  });

  React.useEffect(() => {
    const src = new EventSource('/api/ai-team/events/stream', { withCredentials: false });

    const onScheduled = (e: MessageEvent) => {
      const payload = JSON.parse(e.data) as { scheduled: ScheduledEvt[]; correlation?: string };
      const rows: FeedItem[] = (payload.scheduled || []).map((s) => ({
        kind: 'POST_SCHEDULED',
        data: { ...s, correlation: payload.correlation },
      }));
      setFeed((prev) => [...rows, ...prev].slice(0, 500));
    };

    const onFailed = (e: MessageEvent) => {
      const payload = JSON.parse(e.data) as FailedEvt & { correlation?: string };
      setFeed((prev) => [{ kind: 'POST_FAILED', data: payload }, ...prev].slice(0, 500));
    };

    const onBatch = (e: MessageEvent) => {
      const payload = JSON.parse(e.data) as BatchDoneEvt;
      setFeed((prev) => [{ kind: 'PUBLISH_BATCH_DONE', data: payload }, ...prev].slice(0, 500));
    };

    src.addEventListener('POST_SCHEDULED', onScheduled);
    src.addEventListener('POST_FAILED', onFailed);
    src.addEventListener('PUBLISH_BATCH_DONE', onBatch);

    src.onerror = () => {
      // EventSource auto-retries; optionally display toast
    };

    return () => src.close();
  }, []);

  const toggle = (k: keyof typeof filters) => setFilters((f) => ({ ...f, [k]: !f[k] }));

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Live publish feed</h1>
        <div className="flex gap-2">
          {(['POST_SCHEDULED', 'POST_FAILED', 'PUBLISH_BATCH_DONE'] as const).map((k) => (
            <button
              key={k}
              onClick={() => toggle(k)}
              className={`rounded-full px-3 py-1 text-xs shadow ${filters[k] ? 'bg-black text-white' : 'bg-gray-200'}`}
              aria-pressed={filters[k]}
            >
              {k}
            </button>
          ))}
        </div>
      </header>

      <ul className="space-y-3">
        {feed
          .filter((i) => filters[i.kind])
          .map((item, idx) => {
            if (item.kind === 'POST_SCHEDULED') {
              const d = item.data;
              return (
                <li key={idx} className="rounded-2xl border p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <Badge p={d.platform} />
                    <span className="text-xs text-gray-500">{new Date(d.at).toLocaleString()}</span>
                  </div>
                  <div className="mt-1 text-sm">
                    <span className="font-medium">Scheduled</span> — <code>{d.externalId}</code>
                  </div>
                </li>
              );
            }
            if (item.kind === 'POST_FAILED') {
              const d = item.data;
              return (
                <li key={idx} className="rounded-2xl border border-red-300 bg-red-50 p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <Badge p={d.platform} />
                    <span className="text-xs text-gray-500">failed</span>
                  </div>
                  <div className="mt-1 text-sm">
                    <span className="font-medium">Error:</span> {d.error?.message}
                    {d.error?.code ? (
                      <span className="ml-1 text-xs text-gray-600">({String(d.error.code)})</span>
                    ) : null}
                  </div>
                </li>
              );
            }
            const d = item.data as any;
            return (
              <li key={idx} className="rounded-2xl border p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Batch done</span>
                  <span className="text-xs text-gray-500">{d.correlation}</span>
                </div>
                <div className="mt-1 text-xs text-gray-600">{d.results.length} result(s)</div>
              </li>
            );
          })}
      </ul>
    </main>
  );
}

