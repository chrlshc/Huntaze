"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

// Neutral, brand-aligned hero (dark, white text, subtle violet accents)
export function Hero() {
  return (
    <section
      id="top"
      className="hero-section relative overflow-hidden text-white rounded-b-3xl border-b border-white/10 pt-28 md:pt-40 pb-16 md:pb-20"
      style={{
        backgroundImage:
          'radial-gradient(circle at 50% -20%, rgba(255,255,255,0.04), transparent 60%), linear-gradient(to bottom, #0b0f14, #0b0f14 40%, #0e1217)'
      }}
    >
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-100 dark:bg-purple-950/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-100 dark:bg-blue-950/20 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="beta-badge"
            aria-label="Beta announcement"
          >
            <Sparkles className="w-4 h-4" />
            <span>Beta</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hero-headline text-white tracking-tight"
          >
            The all‑in‑one platform for creators & agencies
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hero-subheadline text-white/70"
          >
            Unified inbox, PPV campaigns & AI — for OnlyFans, Instagram & TikTok.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex items-center justify-center gap-3"
          >
            <Button href="/join" variant="contrast" size="lg" radius="full">
              Join the Beta
            </Button>
            <Button href="/#how-it-works" variant="inverted" size="lg" radius="full">
              Learn more
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default Hero;
