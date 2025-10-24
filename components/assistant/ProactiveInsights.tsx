import React from 'react';

export type AIInsight = {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description?: string;
  actions?: string[];
  timestamp: string;
};

export default function ProactiveInsights(_props: { insights?: AIInsight[] }) {
  return (
    <div className="text-sm text-slate-500">
      <div className="rounded-md border border-dashed p-6 text-center">
        Insights placeholder — will stream from backend in real-time.
      </div>
    </div>
  );
}

