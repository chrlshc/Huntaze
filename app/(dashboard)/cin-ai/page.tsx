'use client';

import { ModuleCard } from '@/components/ui/ModuleCard';
import { createModuleStatus } from '@/types/branded';

const conversations = [
  { fan: 'VIP • @kingmidas', snippet: 'Intent recognized: Upsell – proposing $149 custom set', confidence: '92%' },
  { fan: 'New fan • @wanderlust', snippet: 'Intent recognized: Welcome nurture – day 2 message scheduled', confidence: '88%' },
  { fan: 'Dormant • @silentghost', snippet: 'Intent recognized: Win-back – offering comeback discount', confidence: '84%' },
];

export default function CinAiHomePage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">CIN AI assistant</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          The Contextual Intelligence Network orchestrates smart replies, campaign follow-ups, and compliance guardrails
          in real time. Monitor conversations and training performance here.
        </p>
      </header>

      <ModuleCard module="cin-ai" title="Live conversations" status={createModuleStatus('active')}>
        <div className="mt-4 space-y-3">
          {conversations.map((conversation) => (
            <div key={conversation.fan} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">{conversation.fan}</p>
              <p className="mt-1 text-xs text-gray-600">{conversation.snippet}</p>
              <span className="mt-2 inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-600">
                AI confidence {conversation.confidence}
              </span>
            </div>
          ))}
        </div>
      </ModuleCard>

      <ModuleCard module="cin-ai" title="AI summary" status={createModuleStatus('active')}>
        <ul className="space-y-3 text-xs text-gray-600">
          <li>• Average response time: 3.2 seconds (GPT-4o + Claude Sonnet ensemble).</li>
          <li>• Escalations handled by human chatter team: 12 (VIP whales).</li>
          <li>• Personality drift detected: 0 events in last 7 days.</li>
          <li>• Safety guardrails blocked 6 outgoing messages pending compliance review.</li>
        </ul>
      </ModuleCard>
    </div>
  );
}
