"use client";

import HeaderMinimal from '@/src/components/header-minimal';
import HeroDark from '@/components/sections/en/HeroDark';
import FeaturesMinimal from '@/components/sections/en/FeaturesMinimal';
import MetricsMinimal from '@/components/sections/en/MetricsMinimal';
import TestimonialsMinimal from '@/components/sections/en/TestimonialsMinimal';
import CTAMinimal from '@/components/sections/en/CTAMinimal';

export default function HomePageDark() {
  return (
    <div className="bg-black min-h-screen">
      <HeaderMinimal />
      <HeroDark />
      <div className="bg-gray-950">
        <FeaturesMinimal />
      </div>
      <div className="bg-black">
        <MetricsMinimal />
      </div>
      <div className="bg-gray-950">
        <TestimonialsMinimal />
      </div>
      <CTAMinimal />
    </div>
  );
}