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
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Schedule</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Schedule posts and maintain consistent momentum across platforms.
      </p>

      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create Scheduled Post</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Platform</label>
              <select 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" 
                value={form.platformType} 
                onChange={(e) => setForm({ ...form, platformType: e.target.value })}
              >
                <option value="ONLYFANS">OnlyFans</option>
                <option value="FANSLY">Fansly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Scheduled at (UTC)</label>
              <input 
                type="datetime-local" 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" 
                value={form.scheduledAt} 
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} 
              />
              {slots.length > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Suggestions: {slots.map((s) => new Date(s).toLocaleTimeString()).join(' • ')}
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Caption</label>
              <textarea 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" 
                rows={3} 
                value={form.caption} 
                onChange={(e) => setForm({ ...form, caption: e.target.value })} 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Media URL (optional)</label>
              <input 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white" 
                value={form.mediaUrl} 
                onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })} 
              />
            </div>
          </div>
          <div className="mt-6">
            <button 
              onClick={create} 
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Add scheduled post
            </button>
          </div>
          {error && <div className="text-red-600 mt-3 text-sm">{error}</div>}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Upcoming Posts</h2>
          {topHours.length > 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="font-medium">Recommended posting times today:</span> {topHours.map(h => `${String(h).padStart(2,'0')}:00`).join(' • ')}
            </div>
          )}
          {loading ? (
            <div className="text-gray-600 dark:text-gray-400">Loading…</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No scheduled posts yet. Create your first one above!
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                      {p.platformType} • {new Date(p.scheduledAt).toLocaleString()} • <span className="capitalize">{p.status}</span>
                    </div>
                    <div className="text-gray-900 dark:text-gray-100 line-clamp-2">{p.caption}</div>
                  </div>
                  <button 
                    onClick={() => del(p.id)} 
                    className="ml-4 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
