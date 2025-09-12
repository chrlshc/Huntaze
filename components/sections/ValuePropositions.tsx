'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface ValueProp {
  icon: string
  title: string
  description: string
  stat: string
}

const valueProps: ValueProp[] = [
  {
    icon: '🤖',
    title: 'AI Agents that sell',
    description: 'Personalized conversations at scale. Your AI learns your voice and converts.',
    stat: '+47% conversion rate'
  },
  {
    icon: '💎',
    title: 'PPV Revenue Engine',
    description: 'Smart pricing, tipping optimization, and re-engagement campaigns on autopilot.',
    stat: '+312% revenue increase'
  },
  {
    icon: '📊',
    title: 'Unified Creator CRM',
    description: 'All platforms, one dashboard. Never lose a high-value fan again.',
    stat: '10K+ fans managed solo'
  }
]

export default function ValuePropositions() {
  return (
    <section className="py-20 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Everything you need.
            <br />
            <span className="text-gray-600 dark:text-gray-400">Nothing you don't.</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Three pillars to scale your business without scaling your team
          </p>
        </motion.div>

        {/* Value Props Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {valueProps.map((prop, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                className="text-6xl mb-6"
              >
                {prop.icon}
              </motion.div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {prop.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {prop.description}
              </p>

              {/* Stat */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {prop.stat}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <a
            href="/platform"
            className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
          >
            Explore platform capabilities
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  )
}