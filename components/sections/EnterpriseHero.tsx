'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Shield, Zap, TrendingUp } from 'lucide-react'
import LiveDashboard from './LiveDashboard'

export default function EnterpriseHero() {
  return (
    <section className="pt-24 pb-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="max-w-7xl mx-auto px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
              Scale your creator business{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                without hiring
              </span>
            </h1>

            <p className="mt-6 text-xl text-gray-600 dark:text-gray-400">
              Your AI team manages 10,000+ fans. No agencies taking 40%. No VAs leaking content. Stay solo, grow infinitely.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              <Link
                href="/get-started"
                className="inline-flex items-center px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors group"
              >
                Start for free
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/case-studies"
                className="inline-flex items-center px-8 py-3 text-gray-700 dark:text-gray-300 font-medium hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                See $100K+ creator stories
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>

          </motion.div>

        </div>
      </div>
    </section>
  )
}
