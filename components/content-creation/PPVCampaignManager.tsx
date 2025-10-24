import React from 'react';

export type PPVCampaign = {
  id: string;
  title: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  price: number;
  createdAt: string;
  metrics?: { openRate?: number; purchaseRate?: number; roi?: number; revenue?: number };
};

export default function PPVCampaignManager(_props: {
  campaigns?: PPVCampaign[];
  onCreate?: () => void;
  onDuplicate?: (id: string) => void;
  onAdjust?: (id: string, patch: Partial<PPVCampaign>) => void;
}) {
  return (
    <div className="text-sm text-slate-500">
      <div className="rounded-md border border-dashed p-6 text-center">
        PPV campaigns placeholder — metrics & actions to come.
      </div>
    </div>
  );
}

