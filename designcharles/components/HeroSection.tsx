// Snapshot of components/sections/marketing/HeroSection.tsx
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section id="top" className="hero-section relative overflow-hidden bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-black">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-100 dark:bg-purple-950/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-100 dark:bg-blue-950/20 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="container mx-auto px-4 py-24 lg:py-32">
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
            className="hero-headline text-gray-900 dark:text-white tracking-tight"
          >
            Build faster. Grow smarter.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hero-subheadline"
          >
            Huntaze is currently in beta. Save time with thoughtful automation. Manage your audience, automate the busywork, and stay in control—on a fast, privacy‑first platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="cta-container"
          >
            <Link href="/join">
              <Button size="lg" className="cta-primary group bg-gradient-to-r from-violet-500 to-indigo-500 text-white border-0">
                Join the Beta
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/#how-it-works">
              <Button variant="outline" size="lg" className="cta-secondary">
                See how it works
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

