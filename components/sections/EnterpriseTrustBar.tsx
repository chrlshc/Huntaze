'use client'

import React from 'react'
import { motion } from 'framer-motion'

export default function EnterpriseTrustBar() {
  const trustSignals = [
    {
      icon: '🌍',
      text: '23 countries, 5,000+ creators'
    },
    {
      icon: '💰',
      text: '$2.4B revenue processed'
    },
    {
      icon: '🔒',
      text: 'SOC 2 & GDPR compliant'
    },
    {
      icon: '✨',
      text: 'Top 0.01% creator tools'
    }
  ]

  return (
    <section className="py-6 bg-gray-100 dark:bg-gray-900/50 overflow-hidden">
      <div className="max-w-full">
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: '-100%' }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear'
          }}
          className="flex"
        >
          {/* Double the items for seamless loop */}
          {[...trustSignals, ...trustSignals].map((signal, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-8 whitespace-nowrap"
            >
              <span className="text-xl">{signal.icon}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {signal.text}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}