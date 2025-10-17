"use client";
import { useEffect, useState } from "react";

type Row = { videoId: string; type: string; tsMs: number; payload?: unknown };

export default function Client() {
  const [mins, setMins] = useState(120);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [items, setItems] = useState<Row[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const url = new URL("/api/debug/tiktok-events", window.location.origin);
    url.searchParams.set("mins", String(mins));
    url.searchParams.set("limit", "200");
    if (q) url.searchParams.set("q", q);
    if (type) url.searchParams.set("type", type);
    fetch(url.toString(), { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => {});
  }, [mins, q, type, tick]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">TikTok Events (last {mins} mins)</h1>
      <div className="flex flex-wrap gap-2 items-center">
        <label>Window (min):</label>
        <input className="border px-2 py-1" type="number" min={1} value={mins} onChange={(e) => setMins(Number(e.target.value))} />
        <label>Filter type:</label>
        <input className="border px-2 py-1" placeholder="PUBLISHED / FAILED / WEBHOOK:..." value={type} onChange={(e) => setType(e.target.value)} />
        <label>Search videoId:</label>
        <input className="border px-2 py-1" placeholder="contains..." value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="text-xs text-gray-500">auto-refreshing every 5s</span>
      </div>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">When</th>
            <th>Video ID</th>
            <th>Type</th>
            <th>Payload</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r, i) => (
            <tr key={`${r.videoId}-${r.tsMs}-${i}`} className="border-b align-top">
              <td className="py-2">{new Date(r.tsMs).toLocaleString()}</td>
              <td className="font-mono">{r.videoId}</td>
              <td>{r.type}</td>
              <td>
                <pre className="max-w-[60vw] overflow-auto text-xs bg-gray-50 p-2 rounded">{JSON.stringify(r.payload ?? {}, null, 2)}</pre>
              </td>
            </tr>
          ))}
          {!items.length && (
            <tr>
              <td className="py-6 text-gray-500" colSpan={4}>
                No events
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
