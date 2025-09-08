'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HeroDark() {
  return (
    <section className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-black to-black" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Content */}
          <div className="text-left">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight leading-[1.1]"
            >
              The platform built for{' '}
              <span className="text-gray-400">premium creators.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6 text-lg text-gray-400 max-w-xl"
            >
              Automate conversations, boost revenue, and scale your exclusive content business with AI.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-10 flex flex-col sm:flex-row gap-4"
            >
              <Link
                href="/auth"
                className="px-10 py-4 bg-white text-black rounded-full font-semibold hover:bg-gray-100 transition-all inline-block text-center"
                style={{ boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.1)' }}
              >
                Start for free
              </Link>
              <Link
                href="/pricing"
                className="px-8 py-4 bg-transparent text-white rounded-full font-medium border border-gray-700 hover:bg-gray-900 transition-all inline-block text-center no-underline"
              >
                View plans
              </Link>
            </motion.div>

          </div>

          {/* Right column - Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="relative lg:block hidden"
          >
            <div className="relative">
              {/* Dashboard content */}
              <div className="bg-gray-950 rounded-xl border border-gray-800 p-6 shadow-2xl">
                <div className="grid grid-cols-1 gap-4">
                  {/* Revenue card */}
                  <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-400">Today's Revenue</h3>
                      <span className="text-sm text-green-400">+12.5%</span>
                    </div>
                    <div className="text-2xl font-semibold">$2,847</div>
                    <div className="mt-3 h-16 bg-gradient-to-t from-purple-500/20 to-transparent rounded" />
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                      <div className="text-xl font-semibold">147</div>
                      <div className="text-sm text-gray-400">Messages</div>
                    </div>
                    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                      <div className="text-xl font-semibold">892</div>
                      <div className="text-sm text-gray-400">Active Fans</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Glow effect */}
              <div className="absolute -inset-x-10 -inset-y-10 bg-purple-500/20 blur-3xl opacity-10 -z-10" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}