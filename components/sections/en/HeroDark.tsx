'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HeroDark() {
  return (
    <section className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-black to-black" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-20">
        <div className="flex justify-center">
          <div className="max-w-3xl text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-normal tracking-tight leading-[1.1] text-white"
            >
              The platform built for premium creators.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-8 text-xl text-gray-400 max-w-3xl mx-auto"
            >
              Automate conversations, boost revenue, and scale your exclusive content business with AI.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/auth"
                className="px-10 py-4 bg-white text-black rounded-full font-semibold hover:bg-gray-100 hover:-translate-y-0.5 transition-all inline-block text-center text-base shadow-[0_2px_10px_rgba(255,255,255,0.1)] hover:shadow-[0_4px_20px_rgba(255,255,255,0.2)]"
              >
                Start for free
              </Link>
              <Link
                href="/pricing"
                className="px-8 py-4 bg-transparent text-white rounded-full font-medium border border-white hover:bg-white hover:text-black transition-all inline-block text-center no-underline"
              >
                View plans
              </Link>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}