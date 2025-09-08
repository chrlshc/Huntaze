"use client";

import { ScrollProgressBar } from '@/components/animations/ScrollAnimations';
import HeroAnimatedEN from '@/components/sections/en/HeroAnimated';
import MetricsCountersEN from '@/components/sections/en/MetricsCounters';
import FeatureTabsEN from '@/components/sections/en/FeatureTabs';
import TestimonialsCarouselEN from '@/components/sections/en/TestimonialsCarousel';
import ThreeStepsEN from '@/components/sections/en/ThreeSteps';
import CTAPro from '@/components/sections/CTAPro';
import { motion } from 'framer-motion';

export default function HomePageAnimatedEN() {
  return (
    <>
      <ScrollProgressBar />
      <HeroAnimatedEN />
      <MetricsCountersEN />
      
      <div id="features">
        <FeatureTabsEN />
      </div>
      <TestimonialsCarouselEN />
      <ThreeStepsEN />
      <CTAPro />
    </>
  );
}

