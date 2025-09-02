'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Check, ArrowRight, MessageSquare, BarChart3, Target, Link2 } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { ofIntegrationApi } from '@/src/lib/api';

type TaskId = 'connect-ig' | 'connect-of' | 'first-message' | 'view-analytics' | 'create-campaign';

type Task = {
  id: TaskId;
  label: string;
  done: boolean;
  href: string;
  icon: any;
};

export default function OnboardingChecklist() {
  const { trackEvent } = useAnalytics();
  const [conversationsCount, setConversationsCount] = useState<number | null>(null);
  const [igConnected, setIgConnected] = useState(false);
  const [ofConnected, setOfConnected] = useState(false);

  // Lightweight checks for task completion
  useEffect(() => {
    // Check Instagram cookie (set by /api/platforms/instagram/connected)
    try {
      if (typeof document !== 'undefined') {
        const hasIg = document.cookie.includes('instagram_connected=yes');
        setIgConnected(hasIg);
      }
    } catch {}

    // Check if there are any conversations
    (async () => {
      try {
        const resp = await fetch('/api/crm/conversations', { cache: 'no-store' });
        if (resp.ok) {
          const data = await resp.json();
          setConversationsCount((data.conversations || []).length);
        }
      } catch {}
    })();

    // OnlyFans connection status
    (async () => {
      try {
        const st = await ofIntegrationApi.status();
        setOfConnected(Boolean(st?.connected));
      } catch {}
    })();

    // First seen timestamp for time-to-first-action KPI
    if (typeof window !== 'undefined' && !localStorage.getItem('checklist_first_seen_ts')) {
      localStorage.setItem('checklist_first_seen_ts', String(Date.now()));
    }
  }, []);

  const tasks: Task[] = useMemo(() => [
    {
      id: 'connect-ig',
      label: 'Connect Instagram for traffic',
      done: igConnected || Boolean(typeof window !== 'undefined' && localStorage.getItem('instagram_connected') === '1'),
      href: '/platforms/connect',
      icon: Link2,
    },
    {
      id: 'connect-of',
      label: 'Connect OnlyFans for monetization',
      done: ofConnected || Boolean(typeof window !== 'undefined' && localStorage.getItem('onlyfans_connected') === 'true'),
      href: '/platforms/connect',
      icon: Target,
    },
    {
      id: 'first-message',
      label: 'Send your first AI message',
      done: Boolean(conversationsCount && conversationsCount > 0) || Boolean(typeof window !== 'undefined' && localStorage.getItem('first_message_started') === '1'),
      href: '/messages',
      icon: MessageSquare,
    },
    {
      id: 'view-analytics',
      label: 'Check your analytics',
      done: Boolean(typeof window !== 'undefined' && localStorage.getItem('visited_analytics') === '1'),
      href: '/analytics',
      icon: BarChart3,
    },
    {
      id: 'create-campaign',
      label: 'Create your first campaign',
      done: Boolean(typeof window !== 'undefined' && localStorage.getItem('first_campaign_started') === '1'),
      href: '/campaigns',
      icon: Target,
    },
  ], [conversationsCount, igConnected, ofConnected]);

  const completed = tasks.filter(t => t.done).length;

  useEffect(() => {
    // Track completion of 3+ actions once
    try {
      if (completed >= 3 && typeof window !== 'undefined' && !localStorage.getItem('checklist_3plus_tracked')) {
        trackEvent('kpi_checklist_3plus_complete', { completed });
        localStorage.setItem('checklist_3plus_tracked', '1');
      }
    } catch {}
  }, [completed, trackEvent]);

  const onCtaClick = (task: Task) => {
    try {
      trackEvent('kpi_checklist_click', { item_id: task.id });
      // Time to first action
      const firstSeen = typeof window !== 'undefined' ? Number(localStorage.getItem('checklist_first_seen_ts') || 0) : 0;
      if (firstSeen && typeof window !== 'undefined' && !localStorage.getItem('checklist_first_action_time_tracked')) {
        const seconds = Math.max(0, Math.round((Date.now() - firstSeen) / 1000));
        trackEvent('kpi_checklist_first_action_time', { seconds, item_id: task.id });
        localStorage.setItem('checklist_first_action_time_tracked', '1');
      }
    } catch {}
  };

  return (
    <div className="elevated-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Get Started</h3>
        <span className="text-sm text-gray-600">{completed}/{tasks.length} completed</span>
      </div>
      <div className="space-y-3">
        {tasks.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.id} className={`flex items-center justify-between p-3 rounded-xl border ${t.done ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'} transition-all`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${t.done ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {t.done ? <Check className="w-4 h-4 text-green-700" /> : <Icon className="w-4 h-4 text-gray-700" />}
                </div>
                <span className={`text-sm ${t.done ? 'text-green-800 line-through' : 'text-gray-900'}`}>{t.label}</span>
              </div>
              <Link
                href={t.href}
                onClick={() => onCtaClick(t)}
                className={`inline-flex items-center gap-1 text-sm font-medium ${t.done ? 'text-gray-400 pointer-events-none' : 'text-purple-700 hover:text-purple-800'}`}
                aria-disabled={t.done}
              >
                {t.done ? 'Done' : 'Go'}
                {!t.done && <ArrowRight className="w-4 h-4" />}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
