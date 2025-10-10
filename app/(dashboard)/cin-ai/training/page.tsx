'use client';

import { ModuleCard } from '@/components/ui/ModuleCard';
import { createModuleStatus } from '@/types/branded';

const datasets = [
  { name: 'Creator personality prompts', size: '4.2 MB', entries: '1,842 messages' },
  { name: 'VIP escalation transcripts', size: '2.1 MB', entries: '532 conversations' },
  { name: 'Compliance training set', size: '3.7 MB', entries: '1,120 assets' },
];

export default function CinAiTrainingPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">Training studio</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600">
          Teach Huntaze how to sound like your creators. Upload conversation snippets, adjust tone sliders, and preview
          AI responses before going live.
        </p>
      </header>

      <ModuleCard module="cin-ai" title="Datasets" status={createModuleStatus('active')}>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {datasets.map((dataset) => (
            <div key={dataset.name} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-900">{dataset.name}</p>
              <p className="mt-1 text-xs text-gray-500">{dataset.entries}</p>
              <p className="text-[11px] text-gray-400">{dataset.size}</p>
              <button type="button" className="mt-3 text-xs font-medium text-gray-700 underline-offset-4 hover:underline">
                Upload new file
              </button>
            </div>
          ))}
        </div>
      </ModuleCard>

      <ModuleCard module="cin-ai" title="Tone controls" status={createModuleStatus('active')}>
        <div className="grid gap-4 md:grid-cols-2">
          <ToneSlider label="Playful ↔ Professional" value="58% playful" />
          <ToneSlider label="Short ↔ Narrative" value="45% narrative" />
          <ToneSlider label="Direct ↔ Flirty" value="62% flirty" />
          <ToneSlider label="Formal ↔ Emojis" value="71% emojis" />
        </div>
      </ModuleCard>
    </div>
  );
}

function ToneSlider({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between text-sm text-gray-900">
        <span>{label}</span>
        <span className="text-xs font-semibold text-gray-700">{value}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-gray-100">
        <div className="h-full w-2/3 rounded-full bg-gray-900" />
      </div>
    </div>
  );
}
