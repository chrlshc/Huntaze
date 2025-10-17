'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  DollarSign,
  Eye,
  MessageSquare,
  MoreVertical,
  Package,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';

import DashboardShell from '@/components/dashboard/DashboardShell';
import './dashboard-styles.css';

type ChartPoint = {
  date: string;
  value: number;
};

type TopContentItem = {
  title: string;
  type: string;
  revenue: string;
  change: string;
};

const REVENUE_POINTS: ChartPoint[] = [
  { date: 'Oct 6', value: 4200 },
  { date: 'Oct 7', value: 5100 },
  { date: 'Oct 8', value: 4800 },
  { date: 'Oct 9', value: 6200 },
  { date: 'Oct 10', value: 5900 },
  { date: 'Oct 11', value: 7100 },
  { date: 'Oct 12', value: 6800 },
  { date: 'Oct 13', value: 8200 },
  { date: 'Oct 14', value: 7900 },
  { date: 'Oct 15', value: 9100 },
  { date: 'Oct 16', value: 8800 },
  { date: 'Oct 17', value: 10200 },
  { date: 'Oct 18', value: 9800 },
  { date: 'Oct 19', value: 11500 },
];

const TOP_CONTENT: TopContentItem[] = [
  { title: 'Exclusive photo set', type: 'Photo Set', revenue: '$2,450', change: '+45%' },
  { title: 'Personal video message', type: 'Video', revenue: '$1,890', change: '+32%' },
  { title: 'Live stream session', type: 'Live', revenue: '$1,650', change: '+28%' },
  { title: 'Premium bundle', type: 'Bundle', revenue: '$1,420', change: '+15%' },
  { title: 'Custom content request', type: 'Custom', revenue: '$980', change: '+8%' },
];

const QUICK_ACTIONS = [
  {
    title: 'Create campaign',
    description: 'Launch a new marketing campaign',
    href: '/campaigns/new',
    icon: ShoppingBag,
    iconClasses: 'from-violet-500 to-purple-600 shadow-violet-500/30',
  },
  {
    title: 'Generate content',
    description: 'Use AI to create new posts',
    href: '/app/ai-studio/content-creator',
    icon: Sparkles,
    iconClasses: 'from-pink-500 to-rose-500 shadow-rose-500/30',
  },
  {
    title: 'View messages',
    description: '12 new messages waiting',
    href: '/messages',
    icon: MessageSquare,
    iconClasses: 'from-sky-500 to-blue-600 shadow-sky-500/30',
  },
];

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);

  const stats = {
    revenue: 75612.9,
    revenueChange: 12.5,
    subscribers: 2847,
    subscribersChange: 8.3,
    messages: 12453,
    messagesChange: -3.2,
    engagement: 78.5,
    engagementChange: 15.7,
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const maxRevenuePoint = useMemo(
    () => (REVENUE_POINTS.length ? Math.max(...REVENUE_POINTS.map((point) => point.value)) : 0),
    [],
  );

  const statCards = useMemo(
    () => [
      {
        icon: Users,
        label: 'Active Subscribers',
        value: stats.subscribers.toLocaleString(),
        change: stats.subscribersChange,
        positive: stats.subscribersChange >= 0,
        iconWrapper: 'bg-violet-100 dark:bg-violet-950/40',
        iconColor: 'text-violet-600 dark:text-violet-400',
        progressGradient: 'from-violet-500 to-purple-500',
      },
      {
        icon: MessageSquare,
        label: 'Messages Sent',
        value: stats.messages.toLocaleString(),
        change: stats.messagesChange,
        positive: stats.messagesChange >= 0,
        iconWrapper: 'bg-blue-100 dark:bg-blue-950/40',
        iconColor: 'text-blue-600 dark:text-blue-400',
        progressGradient: stats.messagesChange >= 0 ? 'from-blue-500 to-blue-600' : 'from-rose-500 to-red-500',
      },
      {
        icon: Activity,
        label: 'Engagement Rate',
        value: `${stats.engagement}%`,
        change: stats.engagementChange,
        positive: stats.engagementChange >= 0,
        iconWrapper: 'bg-emerald-100 dark:bg-emerald-950/40',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        progressGradient: 'from-emerald-500 to-green-500',
      },
      {
        icon: Package,
        label: 'Content Created',
        value: '346',
        change: 24,
        positive: true,
        iconWrapper: 'bg-pink-100 dark:bg-pink-950/40',
        iconColor: 'text-pink-600 dark:text-pink-400',
        progressGradient: 'from-pink-500 to-fuchsia-500',
      },
    ],
    [stats.engagement, stats.engagementChange, stats.messages, stats.messagesChange, stats.subscribers, stats.subscribersChange],
  );

  return (
    <DashboardShell>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 p-4 pb-16 lg:p-10">
          <section className={`space-y-8 transition-all duration-500 ${isLoading ? 'pointer-events-none opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            <header className="flex items-center justify-between rounded-2xl border border-white/40 bg-white/80 px-6 py-5 shadow-lg shadow-slate-900/5 backdrop-saturate-150 dark:border-white/10 dark:bg-slate-900/70 dark:shadow-black/30 glass-panel animate-fade-up">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  Dashboard
                </h1>
                <p className="mt-1 text-slate-600 dark:text-slate-400">Welcome back, Creator 👋</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-violet-600">
                  <Calendar className="h-4 w-4" />
                  Last 30 days
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
                <button className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            </header>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-8 text-white shadow-2xl shadow-violet-500/20 animate-fade-up lg:col-span-2">
                <div className="pointer-events-none absolute inset-0 opacity-20">
                  <div className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
                  <div className="absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-fuchsia-400/20 blur-3xl" />
                </div>

                <div className="relative flex items-start justify-between">
                  <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-violet-100 backdrop-blur">
                      <Sparkles className="h-4 w-4" /> Total revenue
                    </div>
                    <p className="text-5xl font-bold tracking-tight">${stats.revenue.toLocaleString()}</p>
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1.5 text-sm font-semibold text-emerald-100">
                      <TrendingUp className="h-4 w-4" /> +{stats.revenueChange}% vs last month
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/15 p-3 text-white">
                    <DollarSign className="h-9 w-9" />
                  </div>
                </div>

                <div className="relative mt-10 space-y-6">
                  <div className="flex h-24 items-end justify-between gap-1">
                    {REVENUE_POINTS.map((point) => {
                      const barHeight = maxRevenuePoint ? (point.value / maxRevenuePoint) * 100 : 0;
                      return (
                        <div key={point.date} className="group relative flex-1">
                          <div
                            className="glass-bar h-full w-full origin-bottom rounded-t-lg bg-white/20 transition duration-300 group-hover:bg-white/40"
                            style={{ height: `${barHeight}%` }}
                          >
                            <div className="pointer-events-none absolute -top-10 left-1/2 w-max -translate-x-1/2 rounded-md bg-white/95 px-2 py-1 text-xs font-semibold text-violet-700 opacity-0 shadow-sm transition group-hover:opacity-100">
                              ${(point.value / 1000).toFixed(1)}k
                            </div>
                          </div>
                          <span className="mt-3 block text-center text-[11px] text-white/70">{point.date}</span>
                        </div>
                      );
                    })}
                  </div>

                  <dl className="grid grid-cols-3 gap-4 text-sm text-white/80">
                    <div>
                      <dt className="uppercase tracking-[0.18em] text-white/60">Today</dt>
                      <dd className="mt-1 text-2xl font-semibold text-white">$3,847</dd>
                    </div>
                    <div>
                      <dt className="uppercase tracking-[0.18em] text-white/60">This Week</dt>
                      <dd className="mt-1 text-2xl font-semibold text-white">$18,492</dd>
                    </div>
                    <div>
                      <dt className="uppercase tracking-[0.18em] text-white/60">Average</dt>
                      <dd className="mt-1 text-2xl font-semibold text-white">$2,520</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="space-y-4 animate-fade-up">
                <div className="glass-card rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-teal-50/70 p-6 text-emerald-900 shadow-lg shadow-emerald-500/10 dark:border-emerald-600/40 dark:from-emerald-950/40 dark:to-teal-950/40 dark:text-emerald-100">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-500/90 p-2 text-white">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800/80 dark:text-emerald-200/80">
                      Best Day
                    </p>
                  </div>
                  <h2 className="text-3xl font-bold">Tuesday</h2>
                  <p className="mt-2 text-sm text-emerald-700/90 dark:text-emerald-200/80">+34% vs average</p>
                </div>

                <div className="glass-card rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-50/80 to-orange-50/70 p-6 text-amber-900 shadow-lg shadow-amber-500/10 dark:border-amber-600/30 dark:from-amber-950/40 dark:to-orange-950/40 dark:text-amber-100">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-xl bg-amber-500 p-2 text-white">
                      <Activity className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-amber-800/80 dark:text-amber-200/80">
                      Peak Hour
                    </p>
                  </div>
                  <h2 className="text-3xl font-bold">9-10 PM</h2>
                  <p className="mt-2 text-sm text-amber-700/90 dark:text-amber-200/80">847 active users</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statCards.map((card) => {
                const Icon = card.icon;
                const changeColor = card.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400';
                const progressWidth = Math.min(Math.abs(card.change) * 3, 100);

                return (
                  <article
                    key={card.label}
                    className="glass-card group rounded-3xl border border-white/40 bg-white/70 p-6 shadow-md shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-xl dark:border-white/5 dark:bg-slate-900/70"
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-500 transition group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-300">
                          {card.label}
                        </p>
                        <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{card.value}</p>
                      </div>
                      <div className={`rounded-xl p-3 shadow-inner ${card.iconWrapper}`}>
                        <Icon className={`h-5 w-5 ${card.iconColor}`} />
                      </div>
                    </div>
                    <div className={`text-sm font-semibold ${changeColor}`}>
                      {card.positive ? '+' : ''}
                      {card.change}%
                    </div>
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${card.progressGradient}`}
                        style={{ width: `${progressWidth}%` }}
                      />
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section className="glass-card overflow-hidden rounded-3xl border border-white/40 bg-white/75 shadow-lg shadow-slate-900/10 transition dark:border-white/5 dark:bg-slate-900/70">
                <div className="flex items-center justify-between border-b border-white/40 bg-gradient-to-r from-slate-50 to-transparent px-6 py-5 dark:border-white/10 dark:from-slate-900">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Top Performing Content</h3>
                  <Eye className="h-5 w-5 text-slate-400" />
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {TOP_CONTENT.map((item, index) => (
                    <article
                      key={item.title}
                      className="flex items-center gap-4 px-6 py-4 transition hover:bg-slate-50/80 dark:hover:bg-slate-800/60"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-lg font-bold text-white shadow-lg shadow-violet-500/20">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-semibold text-slate-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{item.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-semibold text-slate-900 dark:text-white">{item.revenue}</p>
                        <div className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-emerald-500 dark:text-emerald-400">
                          <TrendingUp className="h-3 w-3" />
                          {item.change}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="border-t border-white/40 bg-slate-50/80 px-6 py-4 dark:border-white/10 dark:bg-slate-900/60">
                  <Link
                    href="/app/analytics/content-performance"
                    className="group inline-flex items-center gap-2 text-sm font-semibold text-violet-600 transition hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
                  >
                    View all content
                    <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </section>

              <section className="glass-card rounded-3xl border border-white/40 bg-white/75 p-6 shadow-lg shadow-slate-900/10 dark:border-white/5 dark:bg-slate-900/70">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Quick Actions</h3>
                <div className="mt-6 space-y-4">
                  {QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.title}
                        href={action.href}
                        className="group flex items-center gap-4 rounded-2xl border border-slate-200/50 bg-white/80 px-5 py-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl dark:border-slate-700/60 dark:bg-slate-900/70 dark:hover:border-violet-500"
                      >
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${action.iconClasses} text-white shadow-lg transition group-hover:scale-110`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold text-slate-900 transition group-hover:text-violet-600 dark:text-white dark:group-hover:text-violet-300">
                            {action.title}
                          </p>
                          <p className="truncate text-sm text-slate-500 dark:text-slate-400">{action.description}</p>
                        </div>
                        <ArrowUpRight className="h-5 w-5 flex-shrink-0 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-violet-600 dark:text-slate-400 dark:group-hover:text-violet-300" />
                      </Link>
                    );
                  })}
                </div>
              </section>
            </div>
          </section>

          {isLoading && (
            <div className="grid gap-6 rounded-3xl border border-dashed border-slate-200/70 p-10 text-center text-slate-400 dark:border-slate-700/70 dark:text-slate-600">
              <p className="animate-pulse text-sm tracking-wide uppercase">Loading fresh insights…</p>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
