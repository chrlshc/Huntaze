"use client";
import { useEffect, useState } from 'react';

type Suggestion = {
  asset: { id: string; url: string; thumbUrl?: string; type: string; tags?: string[] };
  score: number;
  recommendedSlots: string[];
  recommendedCaption: string;
};

export default function RepostPage() {
  const [sugs, setSugs] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platform, setPlatform] = useState<'ONLYFANS' | 'FANSLY'>('ONLYFANS');
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [captionA, setCaptionA] = useState<Record<string, string>>({});
  const [captionB, setCaptionB] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/repost/suggestions');
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to load suggestions');
      setSugs(data.suggestions || []);
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const schedule = async (s: Suggestion) => {
    try {
      const scheduledAt = picked[s.asset.id] || s.recommendedSlots[0];
      const capA = captionA[s.asset.id] ?? s.recommendedCaption;
      const capB = (captionB[s.asset.id] || '').trim();
      const items = capB
        ? [{ assetId: s.asset.id, platformType: platform, scheduledAt, variants: [capA, capB] }]
        : [{ assetId: s.asset.id, platformType: platform, scheduledAt, caption: capA }];
      const payload = { items } as any;
      const planResp = await fetch('/api/repost/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const planData = await planResp.json();
      if (!planResp.ok) throw new Error(planData.error || 'Failed to create plan');
      const itemId = planData.plan.items[0].id;
      const schResp = await fetch(`/api/repost/items/${itemId}/schedule`, { method: 'POST' });
      const schData = await schResp.json();
      if (!schResp.ok) throw new Error(schData.error || 'Failed to schedule');
      alert(capB ? 'A/B scheduled to calendar' : 'Scheduled to calendar');
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="elevated-card rounded-xl p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Repost Engine</h1>
          <p className="text-gray-600 dark:text-gray-300">Top content this week based on performance. Pick a slot and add to calendar.</p>
          <div className="mt-3">
            <label className="text-sm mr-2">Platform</label>
            <select className="border rounded p-1 bg-white dark:bg-gray-900" value={platform} onChange={(e) => setPlatform(e.target.value as any)}>
              <option value="ONLYFANS">OnlyFans</option>
              <option value="FANSLY">Fansly</option>
            </select>
          </div>
        </div>

        <div className="elevated-card rounded-xl p-6">
          {loading ? (
            <div>Loading…</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : sugs.length === 0 ? (
            <div className="text-gray-600 dark:text-gray-300">No suggestions yet.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {sugs.map((s) => (
                <div key={s.asset.id} className="border dark:border-gray-800 rounded-lg p-4">
                  <div className="flex gap-3 items-start">
                    <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded overflow-hidden flex items-center justify-center">
                      {s.asset.thumbUrl ? (
                        <img src={s.asset.thumbUrl} className="object-cover w-full h-full" />
                      ) : (
                        <span className="text-xs text-gray-500">{s.asset.type}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-500">Score: {Math.round(s.score)}</div>
                      <div className="text-xs text-gray-500">Tags: {s.asset.tags?.join(', ') || '-'}</div>
                      <div className="mt-2">
                        <label className="text-xs block mb-1">Pick a slot</label>
                        <select className="w-full border rounded p-2 bg-white dark:bg-gray-900"
                          value={picked[s.asset.id] || s.recommendedSlots[0]}
                          onChange={(e) => setPicked((prev) => ({ ...prev, [s.asset.id]: e.target.value }))}
                        >
                          {s.recommendedSlots.map((slot) => (
                            <option key={slot} value={slot}>{new Date(slot).toLocaleString()}</option>
                          ))}
                        </select>
                      </div>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs block mb-1">Caption A</label>
                          <textarea className="w-full border rounded p-2 bg-white dark:bg-gray-900" rows={2} defaultValue={s.recommendedCaption}
                            onChange={(e) => setCaptionA((prev) => ({ ...prev, [s.asset.id]: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs block mb-1">Caption B (optional)</label>
                          <textarea className="w-full border rounded p-2 bg-white dark:bg-gray-900" rows={2}
                            placeholder="Add a B variant to run A/B"
                            onChange={(e) => setCaptionB((prev) => ({ ...prev, [s.asset.id]: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="mt-3 text-right">
                        <button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm" onClick={() => schedule(s)}>Add to calendar</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
