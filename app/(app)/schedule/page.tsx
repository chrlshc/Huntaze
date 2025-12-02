"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Channel = 'all' | 'onlyfans' | 'tiktok' | 'instagram';

type StatusFilter = 'all' | 'scheduled' | 'drafts';

type ScheduleItem = {
  id: string;
  date: string; // ISO date (yyyy-mm-dd)
  time: string; // "18:30"
  channel: 'OnlyFans' | 'TikTok' | 'Instagram';
  title: string;
  status: 'scheduled' | 'draft';
};

type QueueItem = {
  id: string;
  etaLabel: string; // e.g. "In 2h"
  channel: 'OnlyFans' | 'TikTok' | 'Instagram';
  title: string;
};

type LibraryItem = {
  id: string;
  label: string;
  channel: 'OnlyFans' | 'TikTok' | 'Instagram' | 'Multi';
  tags: string[];
};

// Mock data – to be replaced by real API calls (/api/schedule, /api/content, etc.)
const MOCK_SCHEDULE: ScheduleItem[] = [
  {
    id: 'sch-1',
    date: new Date().toISOString().slice(0, 10),
    time: '18:00',
    channel: 'OnlyFans',
    title: 'Weekend promo DM – bundle offer',
    status: 'scheduled',
  },
  {
    id: 'sch-2',
    date: new Date().toISOString().slice(0, 10),
    time: '21:00',
    channel: 'TikTok',
    title: 'TikTok teaser – new series',
    status: 'scheduled',
  },
  {
    id: 'sch-3',
    date: new Date(Date.now() + 24 * 3600_000).toISOString().slice(0, 10),
    time: '19:30',
    channel: 'OnlyFans',
    title: 'Feed post – VIP photo set',
    status: 'draft',
  },
  {
    id: 'sch-4',
    date: new Date(Date.now() + 2 * 24 * 3600_000).toISOString().slice(0, 10),
    time: '20:00',
    channel: 'Instagram',
    title: 'Story IG - swipe up OnlyFans',
    status: 'scheduled',
  },
];

const MOCK_QUEUE: QueueItem[] = [
  {
    id: 'q-1',
    etaLabel: 'In 2h',
    channel: 'OnlyFans',
    title: 'Follow-up DM for inactive fans',
  },
  {
    id: 'q-2',
    etaLabel: 'Tonight 9pm',
    channel: 'TikTok',
    title: 'Teaser video - BTS shooting',
  },
  {
    id: 'q-3',
    etaLabel: 'Tomorrow 7pm',
    channel: 'OnlyFans',
    title: 'PPV post - photo pack',
  },
  {
    id: 'q-4',
    etaLabel: 'Sunday',
    channel: 'Instagram',
    title: 'Feed post - storytelling',
  },
];

const MOCK_LIBRARY: LibraryItem[] = [
  {
    id: 'lib-1',
    label: 'Lingerie photo pack',
    channel: 'OnlyFans',
    tags: ['NSFW', 'Premium', 'Evergreen'],
  },
  {
    id: 'lib-2',
    label: 'TikTok teaser video',
    channel: 'TikTok',
    tags: ['Teaser', 'Short', 'High CTR'],
  },
  {
    id: 'lib-3',
    label: 'IG story swipe up',
    channel: 'Instagram',
    tags: ['Story', 'Swipe up', 'Traffic'],
  },
  {
    id: 'lib-4',
    label: 'Welcome DM template',
    channel: 'Multi',
    tags: ['Onboarding', 'Automation'],
  },
];

export default function ContentSchedulerPage() {
  const [channel, setChannel] = useState<Channel>('all');
  const [status, setStatus] = useState<StatusFilter>('all');

  const filteredSchedule = useMemo(() => {
    return MOCK_SCHEDULE.filter((item) => {
      const matchChannel =
        channel === 'all' ||
        (channel === 'onlyfans' && item.channel === 'OnlyFans') ||
        (channel === 'tiktok' && item.channel === 'TikTok') ||
        (channel === 'instagram' && item.channel === 'Instagram');

      const matchStatus =
        status === 'all' ||
        (status === 'scheduled' && item.status === 'scheduled') ||
        (status === 'drafts' && item.status === 'draft');

      return matchChannel && matchStatus;
    });
  }, [channel, status]);

  return (
    <ProtectedRoute requireOnboarding={false}>
      <div className="flex flex-col gap-6 pb-8">
        <ContentHeader />

        <ContentFilters
          channel={channel}
          status={status}
          onChannelChange={setChannel}
          onStatusChange={setStatus}
        />

        {/* Planning + queue */}
        <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
          <ScheduleCard schedule={filteredSchedule} />
          <QueueCard queue={MOCK_QUEUE} />
        </section>

        {/* Library + outils TikTok */}
        <section className="grid gap-4 xl:grid-cols-2">
          <LibraryPreviewCard items={MOCK_LIBRARY} />
          <TikTokToolsCard />
        </section>
      </div>
    </ProtectedRoute>
  );
}

function ContentHeader() {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-heading)]">
          Content
        </h1>
        <p className="text-sm text-[var(--color-text-sub)]">
          Plan, organize, and publish your content across OnlyFans and social platforms.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link href="/content">
          <Button variant="ghost" size="sm">
            View library
          </Button>
        </Link>
        <Link href="/content/import">
          <Button variant="ghost" size="sm">
            Import content
          </Button>
        </Link>
        <Button variant="primary" size="sm">
          Create content
        </Button>
      </div>
    </header>
  );
}

type ContentFiltersProps = {
  channel: Channel;
  status: StatusFilter;
  onChannelChange: (c: Channel) => void;
  onStatusChange: (s: StatusFilter) => void;
};

function ContentFilters({
  channel,
  status,
  onChannelChange,
  onStatusChange,
}: ContentFiltersProps) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 text-xs shadow-[var(--shadow-soft)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium text-[var(--color-text-sub)]">
          Channel
        </span>
        <FilterPill
          label="All"
          active={channel === 'all'}
          onClick={() => onChannelChange('all')}
        />
        <FilterPill
          label="OnlyFans"
          active={channel === 'onlyfans'}
          onClick={() => onChannelChange('onlyfans')}
        />
        <FilterPill
          label="TikTok"
          active={channel === 'tiktok'}
          onClick={() => onChannelChange('tiktok')}
        />
        <FilterPill
          label="Instagram"
          active={channel === 'instagram'}
          onClick={() => onChannelChange('instagram')}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium text-[var(--color-text-sub)]">
          Status
        </span>
        <FilterPill
          label="All"
          active={status === 'all'}
          onClick={() => onStatusChange('all')}
        />
        <FilterPill
          label="Scheduled"
          active={status === 'scheduled'}
          onClick={() => onStatusChange('scheduled')}
        />
        <FilterPill
          label="Drafts"
          active={status === 'drafts'}
          onClick={() => onStatusChange('drafts')}
        />
      </div>
    </section>
  );
}

type FilterPillProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function FilterPill({ label, active, onClick }: FilterPillProps) {
  const base =
    'inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium transition-colors';
  const variant = active
    ? 'bg-[var(--accent-primary)] text-white shadow-[var(--shadow-soft)]'
    : 'bg-[var(--bg-tertiary)] text-[var(--color-text-sub)] hover:bg-[var(--bg-secondary)] hover:text-[var(--color-text-main)]';

  return (
    <button type="button" className={`${base} ${variant}`} onClick={onClick}>
      {label}
    </button>
  );
}

type ScheduleCardProps = {
  schedule: ScheduleItem[];
};

function ScheduleCard({ schedule }: ScheduleCardProps) {
  const grouped = schedule.reduce<Record<string, ScheduleItem[]>>((acc, item) => {
    acc[item.date] = acc[item.date] || [];
    acc[item.date].push(item);
    return acc;
  }, {});

  const dates = Object.keys(grouped).sort();

  return (
    <Card>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-heading)]">
            Schedule for the next 7 days
          </h2>
          <p className="text-xs text-[var(--color-text-sub)]">
            Overview of your scheduled content for each day.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {dates.length === 0 ? (
          <p className="text-xs text-[var(--color-text-sub)]">
            No content scheduled with these filters. Create a new post or adjust the filters.
          </p>
        ) : (
          dates.map((date) => {
            const d = new Date(date);
            const dateLabel = d.toLocaleDateString('en-US', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            });

            return (
              <div key={date} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--color-text-sub)]">
                    {dateLabel}
                  </span>
                  <span className="text-[11px] text-[var(--color-text-sub)]">
                    {grouped[date].length} item(s)
                  </span>
                </div>
                <div className="space-y-1">
                  {grouped[date].map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-2 text-xs"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-[var(--color-text-main)]">
                          {item.title}
                        </span>
                        <span className="text-[11px] text-[var(--color-text-sub)]">
                          {item.time} · {item.channel}
                        </span>
                      </div>
                      <StatusBadge
                        status={item.status === 'scheduled' ? 'Scheduled' : 'Draft'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: 'Scheduled' | 'Draft' }) {
  const base =
    'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium';
  const variant =
    status === 'Scheduled'
      ? 'bg-emerald-500/10 text-emerald-600'
      : 'bg-amber-500/10 text-amber-600';

  return <span className={`${base} ${variant}`}>{status}</span>;
}

type QueueCardProps = {
  queue: QueueItem[];
};

function QueueCard({ queue }: QueueCardProps) {
  return (
    <Card>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-heading)]">
            Content queue
          </h2>
          <p className="text-xs text-[var(--color-text-sub)]">
            The next posts that will be published.
          </p>
        </div>
        <Link
          href="/schedule"
          className="text-xs font-medium text-[var(--accent-primary)] hover:underline"
        >
          Manage schedule
        </Link>
      </div>

      <div className="space-y-2 text-xs">
        {queue.length === 0 ? (
          <p className="text-xs text-[var(--color-text-sub)]">
            No content in the queue yet. Add posts to your schedule.
          </p>
        ) : (
          queue.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-2"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-[var(--color-text-main)]">
                  {item.title}
                </span>
                <span className="text-[11px] text-[var(--color-text-sub)]">
                  {item.channel} · {item.etaLabel}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

type LibraryPreviewCardProps = {
  items: LibraryItem[];
};

function LibraryPreviewCard({ items }: LibraryPreviewCardProps) {
  return (
    <Card>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-heading)]">
            Content Library
          </h2>
          <p className="text-xs text-[var(--color-text-sub)]">
            A few pieces ready to be used.
          </p>
        </div>
        <Link
          href="/content"
          className="text-xs font-medium text-[var(--accent-primary)] hover:underline"
        >
          View all
        </Link>
      </div>

      <div className="space-y-2 text-xs">
        {items.length === 0 ? (
          <p className="text-xs text-[var(--color-text-sub)]">
            Your library is empty for now. Import content or create a new post.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-2"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-[var(--color-text-main)]">
                  {item.label}
                </span>
                <span className="text-[11px] text-[var(--color-text-sub)]">
                  {item.channel} · {item.tags.join(' · ')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function TikTokToolsCard() {
  return (
    <Card>
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-[var(--color-text-heading)]">
          Social & TikTok tools
        </h2>
        <p className="text-xs text-[var(--color-text-sub)]">
          Prepare your video content and optimize TikTok performance.
        </p>
      </div>

      <div className="space-y-3 text-sm">
        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-2">
          <p className="text-xs font-medium text-[var(--color-text-main)]">
            Upload a TikTok video
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-sub)]">
            Add a video, set captions, and schedule the post.
          </p>
          <Link
            href="/social/tiktok/upload"
            className="mt-2 inline-flex text-xs font-medium text-[var(--accent-primary)] hover:underline"
          >
            Go to TikTok upload
          </Link>
        </div>

        <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-2">
          <p className="text-xs font-medium text-[var(--color-text-main)]">
            Diagnostics
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-sub)]">
            Run diagnostics and get recommendations to improve performance.
          </p>
          <Link
            href="/diagnostics"
            className="mt-2 inline-flex text-xs font-medium text-[var(--accent-primary)] hover:underline"
          >
            Open diagnostics
          </Link>
        </div>
      </div>
    </Card>
  );
}
