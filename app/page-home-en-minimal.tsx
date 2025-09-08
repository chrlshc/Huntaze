"use client";

import HeroMinimal from '@/components/sections/en/HeroMinimal';
import FeaturesMinimal from '@/components/sections/en/FeaturesMinimal';
import MetricsMinimal from '@/components/sections/en/MetricsMinimal';
import TestimonialsMinimal from '@/components/sections/en/TestimonialsMinimal';
import CTAMinimal from '@/components/sections/en/CTAMinimal';
import { motion } from 'framer-motion';

export default function HomePageMinimal() {
  return (
    <div className="bg-white">
      <HeroMinimal />
      <FeaturesMinimal />
      <MetricsMinimal />
      <TestimonialsMinimal />
      <CTAMinimal />
    </div>
  );
}