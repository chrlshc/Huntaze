'use client';

import { ModuleCard } from '@/components/ui/ModuleCard';
import { VirtualizedList } from '@/components/ui/VirtualizedList';
import { createModuleStatus } from '@/types/branded';

const campaigns = [
  {
    id: 'camp_1',
    name: 'Payday VIP Drop',
    audience: 'VIP Whales (32)',
    status: 'Running',
    revenue: '$7,980',
    uplift: '+42%',
    scheduled: 'Ends in 14h',
  },
  {
    id: 'camp_2',
    name: 'Weekend PPV Bundle',
    audience: 'Active Fans (1,204)',
    status: 'Scheduled',
    revenue: '$0',
    uplift: '—',
    scheduled: 'Starts Friday 6pm',
  },
  {
    id: 'camp_3',
    name: 'Win-back Sequence',
    audience: 'Dormant fans (688)',
    status: 'Drip',
    revenue: '$1,540',
    uplift: '+18%',
    scheduled: 'Day 3 of 5',
  },
  {
    id: 'camp_4',
    name: 'Findom High Roller',
    audience: 'Top 5 spenders',
    status: 'Manual',
    revenue: '$12,400',
    uplift: '+65%',
    scheduled: 'Completed',
  },
  {
    id: 'camp_5',
    name: 'New Fan Nurture',
    audience: 'Joined last 7 days (118)',
    status: 'Automation',
    revenue: '$980',
    uplift: '+24%',
    scheduled: 'Continuous',
  },
];

export default function OnlyFansCampaignsPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Campaign planner</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Build segmented drops, AB tests, and nurture journeys without leaving Huntaze. Campaigns sync automatically
          with analytics segments and AI messaging.
        </p>
      </header>

      <ModuleCard module="onlyfans" title="Active campaigns" status={createModuleStatus('active')}>
        <p className="text-xs text-gray-600">
          Each campaign tracks real-time revenue, conversion uplift, and the next automation step.
        </p>
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr] bg-gray-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            <span>Campaign</span>
            <span>Audience</span>
            <span>Status</span>
            <span>Revenue</span>
            <span>Conversion</span>
            <span>Schedule</span>
          </div>
          <VirtualizedList
            items={campaigns}
            height={240}
            itemHeight={60}
            module="onlyfans"
            renderItem={(item) => (
              <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr] items-center px-4 py-4 text-sm text-gray-700">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.id}</p>
                </div>
                <p className="text-xs text-gray-600">{item.audience}</p>
                <span className="text-xs font-medium text-emerald-600">{item.status}</span>
                <span className="text-sm font-semibold text-gray-900">{item.revenue}</span>
                <span className="text-xs font-semibold text-emerald-600">{item.uplift}</span>
                <span className="text-xs text-gray-500">{item.scheduled}</span>
              </div>
            )}
          />
        </div>
      </ModuleCard>

      <ModuleCard module="onlyfans" title="Quick actions" status={createModuleStatus('idle')}>
        <div className="grid gap-4 sm:grid-cols-2">
          <ActionTile
            title="Launch promo"
            description="Send a new PPV offer to a saved segment with AI pricing suggestions and auto follow-ups."
          />
          <ActionTile
            title="Build drip sequence"
            description="Create a multi-step nurture journey with smart replies and human escalation guardrails."
          />
          <ActionTile
            title="Clone top performer"
            description="Duplicate the Payday VIP drop, adjust audience filters, and schedule for next cycle."
          />
          <ActionTile
            title="Generate campaign brief"
            description="Let Huntaze summarise key metrics, creatives, and AI prompts for sharing with creators."
          />
        </div>
      </ModuleCard>
    </div>
  );
}

function ActionTile({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-xs text-gray-600">{description}</p>
      <button
        type="button"
        className="mt-4 text-xs font-medium text-gray-700 underline-offset-4 hover:underline"
      >
        Start workflow
      </button>
    </div>
  );
}
