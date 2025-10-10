'use client';

import { ModuleCard } from '@/components/ui/ModuleCard';
import { createModuleStatus } from '@/types/branded';

const schedule = [
  { day: 'Mon', slots: ['TikTok · 09:00', 'Instagram · 13:00'] },
  { day: 'Tue', slots: ['Reddit · 10:00'] },
  { day: 'Wed', slots: ['Instagram · 12:00', 'Twitter · 17:00'] },
  { day: 'Thu', slots: ['TikTok · 08:00', 'Instagram · 18:00'] },
  { day: 'Fri', slots: ['LinkedIn · 09:30', 'TikTok · 18:30'] },
  { day: 'Sat', slots: ['Instagram · 11:00'] },
  { day: 'Sun', slots: [] },
];

export default function SocialMediaSchedulerPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Scheduler</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Drag-and-drop posts across platforms. Huntaze enforces best posting windows and automatically syncs caption
          variations for each channel.
        </p>
      </header>

      <ModuleCard module="social" title="Weekly timeline" status={createModuleStatus('active')}>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {schedule.map((column) => (
            <div key={column.day} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">{column.day}</h3>
              <ul className="mt-3 space-y-2 text-xs text-gray-600">
                {column.slots.length ? (
                  column.slots.map((slot) => (
                    <li key={slot} className="rounded-md bg-gray-50 px-3 py-2 text-gray-900">
                      {slot}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400">No posts scheduled</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </ModuleCard>

      <ModuleCard module="social" title="Automation guardrails" status={createModuleStatus('idle')}>
        <ul className="space-y-3 text-xs text-gray-600">
          <li>• Limit to 4 Instagram posts/day to avoid throttling</li>
          <li>• Auto-shift TikTok posts when AI predicts low engagement</li>
          <li>• Generate platform-specific previews for creator approval</li>
          <li>• Write alt text automatically for accessibility compliance</li>
        </ul>
      </ModuleCard>
    </div>
  );
}
