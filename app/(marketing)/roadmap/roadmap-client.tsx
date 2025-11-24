"use client";
import { useEffect, useState } from 'react';

type Proposal = {
  id: string;
  title: string;
  description: string;
  status: string;
  weekStart: string;
  votes?: { weight: number }[];
};

export default function RoadmapClient() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/roadmap/proposals', { cache: 'no-store' });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to load proposals');
      setProposals(data.proposals || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const vote = async (id: string) => {
    try {
      const resp = await fetch(`/api/roadmap/proposals/${id}/vote`, { method: 'POST' });
      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || 'Failed to vote');
      }
      await load();
      alert('Vote recorded');
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">Loading proposals…</div>;
  if (error) return <div className="bg-red-50 text-red-700 rounded-xl p-6">{error}</div>;

  return (
    <section className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">This week’s shortlist</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4">Vote for what we should ship next.</p>
      <div className="space-y-4">
        {proposals.map((p) => {
          const total = (p.votes || []).reduce((s, v) => s + (v.weight || 0), 0);
          return (
            <div key={p.id} className="elevated-card rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{p.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{p.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Week: {new Date(p.weekStart).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-700 dark:text-gray-200">Votes: <b>{total}</b></div>
                  <button onClick={() => vote(p.id)} className="mt-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm">Vote</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
