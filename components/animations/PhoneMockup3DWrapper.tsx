'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the 3D component to avoid SSR errors
const PhoneMockup3D = dynamic(
  () => import('./PhoneMockup3D'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
          <p className="mt-4 text-gray-400">Loading the 3D mockup...</p>
        </div>
      </div>
    ),
  }
);

interface PhoneMockup3DWrapperProps {
  scrollProgress?: number;
  className?: string;
}

export default function PhoneMockup3DWrapper({ className }: PhoneMockup3DWrapperProps) {
  // PhoneMockup3D manages its own scroll progress internally
  return <PhoneMockup3D className={className} />;
}
