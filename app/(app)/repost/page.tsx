"use client";

export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/export-all";
import { Card } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppPageHeader } from '@/components/layout/AppPageHeader';
import { DashboardErrorState, DashboardLoadingState } from '@/components/ui/DashboardLoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { RefreshCw } from 'lucide-react';

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
    <ProtectedRoute requireOnboarding={false}>
      <main className="flex flex-col gap-6 pb-8">
        <AppPageHeader
          title="Content library"
          description="Browse and reuse your best-performing content."
          actions={null}
        />

        <Card>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-[var(--color-text-heading)]">
                Repost Engine
              </h2>
              <p className="text-xs text-[var(--color-text-sub)]">
                Top content this week based on performance. Pick a slot and add it to your calendar.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-[var(--color-text-sub)]">Platform</label>
              <Select
                className="border border-[var(--border-subtle)] rounded px-2 py-1 bg-[var(--bg-surface)]"
                value={platform}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setPlatform(e.target.value as any)
                }
              >
                <option value="ONLYFANS">OnlyFans</option>
                <option value="FANSLY">Fansly</option>
              </Select>
            </div>
          </div>
        </Card>

        <Card>
          {loading ? (
            <DashboardLoadingState message="Loading suggestions..." />
          ) : error ? (
            <DashboardErrorState message={error} onRetry={load} />
          ) : sugs.length === 0 ? (
            <EmptyState
              variant="no-data"
              title="No suggestions yet"
              description="Once you have some content performance history, Huntaze will recommend the best posts to repost."
              action={{ label: 'Retry', onClick: load, icon: RefreshCw }}
            />
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {sugs.map((s) => (
                <div
                  key={s.asset.id}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] p-4"
                >
                  <div className="flex gap-3 items-start">
                    <div className="w-20 h-20 rounded overflow-hidden flex items-center justify-center bg-[var(--bg-app)]">
                      {s.asset.thumbUrl ? (
                        <Image
                          src={s.asset.thumbUrl}
                          alt={`${s.asset.type} thumbnail`}
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span className="text-xs text-[var(--color-text-sub)]">{s.asset.type}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-[var(--color-text-sub)]">
                        Score: {Math.round(s.score)}
                      </div>
                      <div className="text-xs text-[var(--color-text-sub)]">
                        Tags: {s.asset.tags?.join(', ') || '-'}
                      </div>
                      <div className="mt-2">
                        <label className="text-xs block mb-1 text-[var(--color-text-sub)]">
                          Pick a slot
                        </label>
                        <Select
                          className="w-full border border-[var(--border-subtle)] rounded px-2 py-1 bg-[var(--bg-surface)]"
                          value={picked[s.asset.id] || s.recommendedSlots[0]}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPicked((prev) => ({ ...prev, [s.asset.id]: e.target.value }))}
                        >
                          {s.recommendedSlots.map((slot) => (
                            <option key={slot} value={slot}>{new Date(slot).toLocaleString()}</option>
                          ))}
                        </Select>
                      </div>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs block mb-1 text-[var(--color-text-sub)]">
                            Caption A
                          </label>
                          <textarea
                            className="w-full border border-[var(--border-subtle)] rounded px-2 py-1 bg-[var(--bg-surface)] text-sm"
                            rows={2}
                            defaultValue={s.recommendedCaption}
                            onChange={(e) => setCaptionA((prev) => ({ ...prev, [s.asset.id]: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="text-xs block mb-1 text-[var(--color-text-sub)]">
                            Caption B (optional)
                          </label>
                          <textarea
                            className="w-full border border-[var(--border-subtle)] rounded px-2 py-1 bg-[var(--bg-surface)] text-sm"
                            rows={2}
                            placeholder="Add a B variant to run A/B"
                            onChange={(e) => setCaptionB((prev) => ({ ...prev, [s.asset.id]: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="mt-3 text-right">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => schedule(s)}
                        >
                          Add to calendar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </ProtectedRoute>
  );
}
