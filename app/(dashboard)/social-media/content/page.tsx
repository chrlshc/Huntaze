'use client';

import { ModuleCard } from '@/components/ui/ModuleCard';
import { createModuleStatus } from '@/types/branded';

const drafts = [
  {
    title: 'Creator dashboard walkthrough',
    platform: 'Instagram Carousel',
    status: 'Ready for review',
    updatedAt: '2 hours ago',
  },
  {
    title: 'AI assistant demo',
    platform: 'TikTok Video',
    status: 'In production',
    updatedAt: '5 hours ago',
  },
  {
    title: 'Newsletter signup CTA',
    platform: 'Twitter Thread',
    status: 'Awaiting copy tweaks',
    updatedAt: 'Yesterday',
  },
  {
    title: 'Case study carousel',
    platform: 'Instagram Carousel',
    status: 'Approved',
    updatedAt: 'Today',
  },
];

export default function SocialMediaContentPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Content library</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Centralise creative assets, captions, and approval workflows. Huntaze maps every piece of content to the
          OnlyFans campaign it supports.
        </p>
      </header>

      <ModuleCard module="social" title="Drafts & approvals" status={createModuleStatus('active')}>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {drafts.map((draft) => (
            <div key={draft.title} className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">{draft.platform}</p>
                <h3 className="mt-2 text-sm font-semibold text-gray-900">{draft.title}</h3>
                <p className="mt-2 text-xs text-gray-500">Last updated {draft.updatedAt}</p>
              </div>
              <span className="mt-4 inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-600">
                {draft.status}
              </span>
            </div>
          ))}
        </div>
      </ModuleCard>

      <ModuleCard module="social" title="Asset review" status={createModuleStatus('idle')}>
        <p className="text-xs text-gray-600">
          Huntaze scans uploads for brand compliance and OF policy alignment. Approve or reject assets in a single
          workflow.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {['AI workflow reel', 'Creator revenue graph', 'Case study blog', 'Landing page hero'].map((asset) => (
            <button
              key={asset}
              type="button"
              className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-6 text-left text-xs text-gray-600 transition hover:border-gray-300"
            >
              <span className="block text-sm font-semibold text-gray-900">{asset}</span>
              <span className="text-[11px] uppercase tracking-wide text-emerald-600">Awaiting approval</span>
            </button>
          ))}
        </div>
      </ModuleCard>
    </div>
  );
}
