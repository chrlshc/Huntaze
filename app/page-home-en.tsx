"use client";

import { ScrollProgressBar } from '@/components/animations/ScrollAnimations';
import HeroAnimatedEN from '@/components/sections/en/HeroAnimated';
import MetricsCountersEN from '@/components/sections/en/MetricsCounters';
import FeatureTabsEN from '@/components/sections/en/FeatureTabs';
import TestimonialsCarouselEN from '@/components/sections/en/TestimonialsCarousel';
import ThreeStepsEN from '@/components/sections/en/ThreeSteps';
import CTAPro from '@/components/sections/CTAPro';
import { SafeDeviceShowcase } from '@/components/SafeMockup';
import { motion } from 'framer-motion';

export default function HomePageAnimatedEN() {
  return (
    <>
      <ScrollProgressBar />
      <HeroAnimatedEN />
      <MetricsCountersEN />
      
      {/* Device Showcase Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="section-header"
          >
            <span className="overline">Multi-Platform</span>
            <h2 className="heading-1">Works Everywhere You Do</h2>
            <p className="lead">
              Access your dashboard from any device. Optimized for desktop productivity, 
              mobile convenience, and everything in between.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <SafeDeviceShowcase />
          </motion.div>
        </div>
      </section>
      
      <div id="features">
        <FeatureTabsEN />
      </div>
      <TestimonialsCarouselEN />
      <ThreeStepsEN />
      <CTAPro />
    </>
  );
}

