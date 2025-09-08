'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HeroDark() {
  return (
    <section className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-black to-black" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20">
              5,000+ creators scaling faster
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-normal tracking-tight"
          >
            Double your revenue.
            <br />
            <span className="text-gray-400">Cut the busywork.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto"
          >
            Unified inbox, AI assistant, revenue analytics — working together from day one.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/auth"
              className="px-8 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition-all"
            >
              Start free trial
            </Link>
            <Link
              href="#features"
              className="px-8 py-3 bg-transparent text-white rounded-lg font-medium border border-gray-800 hover:bg-gray-900 transition-all"
            >
              See how it works
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex items-center justify-center gap-6 text-sm text-gray-500"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Cancel anytime</span>
            </div>
          </motion.div>
        </div>

        {/* Dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 relative"
        >
          <div className="relative mx-auto max-w-5xl">
            {/* Browser chrome */}
            <div className="bg-gray-900 rounded-t-xl border border-gray-800 p-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-gray-800 rounded px-3 py-1 text-xs text-gray-400">
                    app.huntaze.com/dashboard
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="bg-gray-950 rounded-b-xl border-x border-b border-gray-800 p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Revenue card */}
                <div className="col-span-1 md:col-span-2 bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-400">Today's Revenue</h3>
                    <span className="text-sm text-green-400">+12.5%</span>
                  </div>
                  <div className="text-3xl font-semibold">$2,847</div>
                  <div className="mt-4 h-24 bg-gradient-to-t from-purple-500/20 to-transparent rounded" />
                </div>

                {/* Stats */}
                <div className="space-y-4">
                  <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                    <div className="text-2xl font-semibold">147</div>
                    <div className="text-sm text-gray-400">Messages</div>
                  </div>
                  <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                    <div className="text-2xl font-semibold">892</div>
                    <div className="text-sm text-gray-400">Active Fans</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Glow effect */}
            <div className="absolute -inset-x-20 -inset-y-20 bg-purple-500/20 blur-3xl opacity-20 -z-10" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}