'use client';

import { motion } from 'framer-motion';
import GradientMesh from '@/components/animations/GradientMesh';
import Link from 'next/link';

export default function HeroAnimatedEN() {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-black text-white">
      <GradientMesh className="absolute inset-0" intensity={1.1} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight"
        >
          Double your revenue.
          <br />
          Cut the busywork.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-4 text-lg text-gray-300"
        >
          Unified inbox, AI assistant, revenue analytics — working together from day one.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 flex items-center justify-center gap-3"
        >
          <Link href="/auth" className="px-5 py-3 rounded-xl bg-white text-black font-semibold hover:bg-white/90">
            Start free trial
          </Link>
          <Link href="#features" className="px-5 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10">
            See how it works
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

