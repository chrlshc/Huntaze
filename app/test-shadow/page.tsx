'use client';

import dynamic from 'next/dynamic';

const BasicShadowEffect = dynamic(
  () => import('../components/BasicShadowEffect'),
  { ssr: false }
);

export default function TestShadowPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <BasicShadowEffect />
      <div className="relative z-30 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-4">
            Shadow Effect Test
          </h1>
          <p className="text-xl text-gray-300">
            You should see purple neon lines rotating around this text
          </p>
        </div>
      </div>
    </div>
  );
}