"use client";

import { AlertTriangle } from 'lucide-react';

type Props = {
  platform?: string;
  className?: string;
};

export default function ComplianceNotice({ platform, className }: Props) {
  const pf = platform || 'this platform';
  return (
    <div className={`mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl ${className || ''}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-700 mt-0.5" />
        <div className="text-sm text-amber-900">
          <p className="font-medium mb-1">Compliance & Safety</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>AI provides smart replies (suggestions). You approve before sending — autopilot is disabled.</li>
            <li>{pf} integration is read‑only. Use must comply with each platform’s terms. Huntaze is not affiliated with OnlyFans, Instagram, TikTok, Reddit, Threads, or Meta.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
