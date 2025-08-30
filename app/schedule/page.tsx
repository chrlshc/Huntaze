"use client";
import { useEffect, useState } from 'react';

type ScheduledPost = {
  id: string;
  platformType: string;
  caption: string;
  mediaUrl?: string;
  scheduledAt: string;
  status: string;
};

export default function SchedulePage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [form, setForm] = useState({ platformType: 'ONLYFANS', caption: '', mediaUrl: '', scheduledAt: '' });
  const [slots, setSlots] = useState<string[]>([]);
  const [topHours, setTopHours] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/schedule');
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to load');
      setPosts(data.posts || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSlots = async () => {
    try {
      const resp = await fetch('/api/schedule/recommendations');
      const data = await resp.json();
      if (resp.ok) setSlots(data.slots || []);
    } catch {}
  };
  const loadTopHours = async () => {
    try {
      const resp = await fetch('/api/analytics/top-hours?platformType=ONLYFANS');
      const data = await resp.json();
      if (resp.ok) setTopHours(data.hours || []);
    } catch {}
  };

  useEffect(() => { load(); loadSlots(); loadTopHours(); }, []);

  const create = async () => {
    setError(null);
    try {
      const resp = await fetch('/api/schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to create');
      setForm({ platformType: 'ONLYFANS', caption: '', mediaUrl: '', scheduledAt: '' });
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const del = async (id: string) => {
    await fetch(`/api/schedule/${id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="elevated-card rounded-xl p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Momentum Calendar</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Schedule posts and maintain consistent momentum across platforms.</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Platform</label>
              <select className="w-full border rounded p-2 bg-white dark:bg-gray-900" value={form.platformType} onChange={(e) => setForm({ ...form, platformType: e.target.value })}>
                <option value="ONLYFANS">OnlyFans</option>
                <option value="FANSLY">Fansly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Scheduled at (UTC)</label>
              <input type="datetime-local" className="w-full border rounded p-2 bg-white dark:bg-gray-900" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
              {slots.length > 0 && (
                <div className="text-xs text-gray-500 mt-1">Suggestions: {slots.map((s) => new Date(s).toLocaleTimeString()).join(' • ')}</div>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Caption</label>
              <textarea className="w-full border rounded p-2 bg-white dark:bg-gray-900" rows={3} value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Media URL (optional)</label>
              <input className="w-full border rounded p-2 bg-white dark:bg-gray-900" value={form.mediaUrl} onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })} />
            </div>
          </div>
          <div className="mt-4">
            <button onClick={create} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded">Add scheduled post</button>
          </div>
          {error && <div className="text-red-600 mt-3 text-sm">{error}</div>}
        </div>

        <div className="elevated-card rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Upcoming</h2>
          {topHours.length > 0 && (
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">Top hours today (recommended): {topHours.map(h => `${String(h).padStart(2,'0')}:00`).join(' • ')}</div>
          )}
          {loading ? (
            <div>Loading…</div>
          ) : posts.length === 0 ? (
            <div className="text-gray-600 dark:text-gray-300">No scheduled posts yet.</div>
          ) : (
            <div className="space-y-3">
              {posts.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded p-3">
                  <div>
                    <div className="text-sm text-gray-500">{p.platformType} • {new Date(p.scheduledAt).toLocaleString()} • {p.status}</div>
                    <div className="text-gray-900 dark:text-gray-100 text-sm line-clamp-2">{p.caption}</div>
                  </div>
                  <button onClick={() => del(p.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
