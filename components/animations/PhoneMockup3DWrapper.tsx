'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Import dynamique du composant 3D pour éviter les erreurs SSR
const PhoneMockup3D = dynamic(
  () => import('./PhoneMockup3D'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
          <p className="mt-4 text-gray-400">Chargement du mockup 3D...</p>
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
  // PhoneMockup3D gère son propre scroll progress en interne
  return <PhoneMockup3D className={className} />;
}