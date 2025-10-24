import React from 'react';

export type CalendarView = 'monthly' | 'weekly';

export default function EditorialCalendar(_props: {
  view?: CalendarView;
  onViewChange?: (v: CalendarView) => void;
  onDropAsset?: (assetId: string, dateISO: string) => void;
  onQuickCreate?: (kind: 'post' | 'story' | 'ppv', dateISO: string) => void;
}) {
  return (
    <div className="text-sm text-slate-500">
      <div className="rounded-md border border-dashed p-6 text-center">
        Calendar placeholder — drag & drop + quick create later.
      </div>
    </div>
  );
}

