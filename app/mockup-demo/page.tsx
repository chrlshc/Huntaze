'use client';

import HeroSection from '@/components/sections/HeroSection';
import FeaturesGrid from '@/components/sections/FeaturesGrid';
import SocialProof from '@/components/sections/SocialProof';

export default function MockupDemoPage() {
  return (
    <main className="bg-gray-950 text-white min-h-screen">
      <HeroSection />
      <FeaturesGrid />
      <SocialProof />
    </main>
  );
}