import React from 'react';

export type MediaAsset = {
  id: string;
  title: string;
  type: 'photo' | 'video' | 'story';
  status: 'draft' | 'scheduled' | 'published';
  tags?: string[];
  createdAt: string;
  thumbnail?: string;
  metrics?: { views?: number; likes?: number; revenue?: number };
};

export default function ContentLibrary(_props: {
  assets?: MediaAsset[];
  onFilterChange?: (filter: { type?: string; status?: string }) => void;
  onSearchChange?: (q: string) => void;
  onSelect?: (asset: MediaAsset) => void;
}) {
  return (
    <div className="text-sm text-slate-500">
      <div className="rounded-md border border-dashed p-6 text-center">
        Library placeholder — hook to data later (Zod-typed, paginated).
      </div>
    </div>
  );
}

