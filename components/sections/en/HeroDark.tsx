'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HeroDark() {
  return (
    <section className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-black to-black" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="flex justify-center">
          <div className="max-w-3xl w-full text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight leading-[1.1]"
            >
              The platform built for{' '}
              <span className="text-gray-400">premium creators.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto"
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
                className="px-8 py-4 bg-white text-black rounded-full font-medium hover:bg-gray-100 transition-all inline-block text-center"
              >
                Start free trial
              </Link>
              <Link
                href="/pricing"
                className="px-8 py-4 bg-transparent text-white rounded-full font-medium border border-gray-700 hover:bg-gray-900 transition-all inline-block text-center no-underline"
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