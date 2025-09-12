'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HeroDark() {
  return (
    <section className="relative min-h-screen bg-black text-white overflow-hidden">
      
      <div className="relative z-10 hero-container">
        <div className="hero-content">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="hero-title"
          >
            The platform built for premium creators.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="hero-subtitle"
          >
            Automate conversations, boost revenue, and scale your exclusive content business with AI.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hero-buttons"
          >
            <Link href="/auth" className="cta-pill-outline">
              Start for free
            </Link>
            <Link href="/pricing" className="btn-secondary">
              View plans
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
