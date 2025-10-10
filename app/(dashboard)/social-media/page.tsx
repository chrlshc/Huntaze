'use client';

import { ModuleCard } from '@/components/ui/ModuleCard';
import { createModuleStatus } from '@/types/branded';

const platformStatus = [
  { name: 'Instagram', handle: '@huntaze.creators', status: 'Connected', cadence: '2 posts/day' },
  { name: 'TikTok', handle: '@huntaze.ai', status: 'Connected', cadence: '1 post/day' },
  { name: 'Reddit', handle: 'u/HuntazeAgency', status: 'Connected', cadence: '4 posts/week' },
  { name: 'Twitter/X', handle: '@huntaze', status: 'Queued', cadence: '3 posts/week' },
];

const contentIdeas = [
  {
    title: 'Creator income breakdown',
    description: 'Carousel explaining how Huntaze doubles GMV with smart messaging.',
    format: 'Carousel · Instagram',
  },
  {
    title: 'AI assistant behind the scenes',
    description: 'Short-form video showing the smart reply workflow.',
    format: 'Video · TikTok',
  },
  {
    title: 'SaaS dashboard teaser',
    description: 'Animated product mockups for acquisition landing page.',
    format: 'GIF · Twitter',
  },
  {
    title: 'Case study thread',
    description: 'Reddit long-form post on converting fans into VIP buyers.',
    format: 'Post · Reddit',
  },
];

export default function SocialMediaHomePage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Social launchpad</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Plan cross-platform drops, keep captions on brand, and queue media without juggling four different apps.
          Huntaze syncs scheduler data with your OnlyFans campaigns automatically.
        </p>
      </header>

      <ModuleCard module="social" title="Platform status" status={createModuleStatus('active')}>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {platformStatus.map((platform) => (
            <div key={platform.name} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{platform.name}</p>
                  <p className="text-xs text-gray-500">{platform.handle}</p>
                </div>
                <span className="text-xs font-semibold text-emerald-600">{platform.status}</span>
              </div>
              <p className="mt-3 text-xs text-gray-600">Publishing cadence: {platform.cadence}</p>
            </div>
          ))}
        </div>
      </ModuleCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ModuleCard module="social" title="Upcoming slots" status={createModuleStatus('active')}>
          <ul className="mt-3 space-y-2 text-xs text-gray-600">
            <li>
              <span className="font-semibold text-gray-900">Friday 6 PM</span> · TikTok teaser for new AI feature
            </li>
            <li>
              <span className="font-semibold text-gray-900">Saturday 10 AM</span> · Instagram carousel on creator success
            </li>
            <li>
              <span className="font-semibold text-gray-900">Sunday 4 PM</span> · Reddit case study cross-post
            </li>
            <li>
              <span className="font-semibold text-gray-900">Monday 9 AM</span> · Twitter thread linking to analytics
            </li>
          </ul>
        </ModuleCard>

        <ModuleCard module="social" title="AI caption studio" status={createModuleStatus('idle')}>
          <p className="text-xs text-gray-600">
            Generate on-brand captions and hashtag sets with one click. Huntaze adapts to each platform’s voice and
            compliance requirements.
          </p>
          <button
            type="button"
            className="mt-4 inline-flex items-center text-xs font-medium text-gray-700 underline-offset-4 hover:underline"
          >
            Open caption generator
          </button>
        </ModuleCard>
      </div>

      <ModuleCard module="social" title="Content ideas" status={createModuleStatus('active')}>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {contentIdeas.map((idea) => (
            <div key={idea.title} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">{idea.format}</p>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">{idea.title}</h3>
              <p className="mt-1 text-xs text-gray-600">{idea.description}</p>
            </div>
          ))}
        </div>
      </ModuleCard>
    </div>
  );
}
