'use client';

import { useState } from 'react';
import { Calendar, Clock, Image, Video, FileText, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useAiScheduler } from '@/hooks/useAiScheduler';
import { showToast } from '@/components/Toast';

interface ContentItem {
  id: string;
  type: 'image' | 'video' | 'text' | 'livestream';
  title: string;
  scheduledFor: Date;
  platform: string;
  status: 'scheduled' | 'published' | 'draft';
}

interface ContentCalendarProps {
  userProfile: any;
}

export function ContentCalendarWidget({ userProfile }: ContentCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { planSchedule, applySchedule, connectStream, loading } = useAiScheduler();
  
  const mockContent: ContentItem[] = [
    {
      id: '1',
      type: 'video',
      title: 'Morning Workout Routine',
      scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000),
      platform: 'OnlyFans',
      status: 'scheduled'
    },
    {
      id: '2',
      type: 'image',
      title: 'Behind the Scenes',
      scheduledFor: new Date(Date.now() + 5 * 60 * 60 * 1000),
      platform: 'Fansly',
      status: 'scheduled'
    },
    {
      id: '3',
      type: 'livestream',
      title: 'Q&A Session',
      scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000),
      platform: 'OnlyFans',
      status: 'scheduled'
    }
  ];

  const getIconForType = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'text': return <FileText className="w-4 h-4" />;
      case 'livestream': return <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getOptimalPostingTimes = () => {
    if (userProfile?.settings?.timezone === 'EST') {
      return ['8:00 PM', '10:00 PM', '2:00 AM'];
    }
    return ['7:00 PM', '9:00 PM', '11:00 PM'];
  };

  const optimalTimes = getOptimalPostingTimes();

  const handleAiSchedule = async () => {
    try {
      const modelId = (userProfile?.username || userProfile?.id || 'default_model').toString();
      const start = new Date();
      const end = new Date();
      end.setUTCDate(end.getUTCDate() + 2);

      // Connect SSE for live updates (optional)
      const disconnect = connectStream(modelId, {
        onReady: () => showToast('AI Scheduler stream ready'),
        onUpdate: (p) => {
          if (p?.task?.status) {
            showToast(`Task ${p.task.id} → ${p.task.status}`);
          }
        },
        onError: () => {},
      });

      const plan = await planSchedule({
        modelId,
        platforms: ['onlyfans'],
        window: { startDate: start.toISOString(), endDate: end.toISOString() },
        perPlatform: { onlyfans: 1 },
        constraints: { maxPerDay: 3, minGapMinutes: 120 },
      });
      const result = await applySchedule(plan);
      const count = (result?.persisted || []).length;
      showToast(`AI scheduled ${count} post(s)`);
      disconnect && disconnect();
    } catch (e: any) {
      showToast(`AI schedule failed: ${e?.message || 'error'}`);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Content Calendar</h3>
            <p className="text-sm text-gray-500">Today & Upcoming</p>
          </div>
        </div>
        <Link href="/content/new" className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">Schedule</span>
        </Link>
        <button onClick={handleAiSchedule} disabled={loading} className="ml-2 flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-60">
          <SparklesIcon />
          <span className="text-sm font-medium">AI Schedule</span>
        </button>
      </div>

      <div className="space-y-3 mb-6">
        {mockContent.map((item) => (
          <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
            <div className={`p-2 rounded-lg ${
              item.type === 'livestream' ? 'bg-red-100' : 'bg-white'
            }`}>
              {getIconForType(item.type)}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">{item.title}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {item.scheduledFor.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="px-2 py-0.5 bg-white rounded-full">{item.platform}</span>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              item.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
              item.status === 'published' ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {item.status}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Optimal Posting Times for {userProfile?.niche || 'your niche'}
        </p>
        <div className="flex gap-2">
          {optimalTimes.map((time, index) => (
            <div key={index} className="px-3 py-1.5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <span className="text-sm font-medium text-purple-700">{time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M5 3l1.5 3L10 7.5 6.5 9 5 12l-1.5-3L0 7.5 3.5 6 5 3zm14 3l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2zm-6 3l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4z"/>
    </svg>
  );
}
