'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowUpRight, TrendingUp, Calendar, Users } from 'lucide-react'

interface MetricCardProps {
  value: string
  label: string
  trend?: string
  icon?: React.ReactNode
}

function MetricCard({ value, label, trend, icon }: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState('0')
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      // Animate number counting
      const numericValue = parseInt(value.replace(/[^0-9]/g, ''))
      const duration = 2000
      const steps = 60
      const stepValue = numericValue / steps
      let current = 0

      const timer = setInterval(() => {
        current += stepValue
        if (current >= numericValue) {
          current = numericValue
          clearInterval(timer)
        }
        
        // Format the display value
        if (value.includes('%')) {
          setDisplayValue(Math.floor(current) + '%')
        } else if (value.includes('hrs')) {
          setDisplayValue(Math.floor(current) + 'hrs')
        } else if (value.includes('.')) {
          setDisplayValue((current / 10).toFixed(1) + 's')
        } else {
          setDisplayValue(Math.floor(current).toString())
        }
      }, duration / steps)

      return () => clearInterval(timer)
    }
  }, [isInView, value])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm border border-gray-100"
    >
      {icon && (
        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{displayValue}</div>
      <div className="text-gray-600 dark:text-gray-400 font-medium">{label}</div>
      {trend && (
        <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
          <TrendingUp className="w-4 h-4" />
          <span>{trend}</span>
        </div>
      )}
    </motion.div>
  )
}

interface CaseStudyCardProps {
  industry: string
  result: string
  timeframe: string
  metrics?: {
    before: string
    after: string
  }
}

function CaseStudyCard({ industry, result, timeframe, metrics }: CaseStudyCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-4">
        <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
          Case Study
        </span>
        <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{result}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-1">{industry}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{timeframe}</p>
      
      {metrics && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Before Huntaze</div>
            <div className="font-semibold text-gray-700 dark:text-gray-300">{metrics.before}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">With Huntaze</div>
            <div className="font-semibold text-purple-600">{metrics.after}</div>
          </div>
        </div>
      )}
      
      <div className="mt-4 text-sm font-medium text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
        Read full story →
      </div>
    </motion.div>
  )
}

export default function ProofByNumbers() {
  const metrics = [
    {
      value: '312%',
      label: 'Average revenue increase',
      trend: '+27% YoY',
      icon: <TrendingUp className="w-6 h-6 text-gray-900 dark:text-white" />
    },
    {
      value: '40hrs',
      label: 'Saved per week',
      trend: 'Per creator',
      icon: <Calendar className="w-6 h-6 text-gray-900 dark:text-white" />
    },
    {
      value: '2.3s',
      label: 'To first reply',
      trend: 'vs 47min manual',
      icon: <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <Users className="w-6 h-6 text-gray-900 dark:text-white" />
      </motion.div>
    },
    {
      value: '99.99%',
      label: 'Platform uptime',
      trend: 'SLA guaranteed',
      icon: <div className="w-6 h-6 bg-green-500 rounded-full" />
    }
  ]

  const caseStudies = [
    {
      industry: 'Solo Fashion Creator',
      result: '$15K → $147K/month',
      timeframe: 'Fired VA team after 4 months',
      metrics: {
        before: '80 hrs/week with team',
        after: '10 hrs/week solo'
      }
    },
    {
      industry: 'Independent Fitness Coach',
      result: 'Managing 5,000 fans alone',
      timeframe: 'Stayed solo, 10x growth',
      metrics: {
        before: '500 fans (struggling)',
        after: '5,000 fans (thriving)'
      }
    },
    {
      industry: 'Content Creator (Top 0.1%)',
      result: 'Replaced 4-person team',
      timeframe: 'Zero employees, 3x revenue',
      metrics: {
        before: 'Considering hiring',
        after: 'AI does it better'
      }
    }
  ]

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Trusted by industry leaders
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Real results from real creators using Huntaze
          </p>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {metrics.map((metric, index) => (
            <MetricCard key={index} {...metric} />
          ))}
        </div>

        {/* Platform Performance Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="bg-gray-900 text-white rounded-2xl p-8 md:p-12 mb-20"
        >
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">$2.4B+</div>
              <div className="text-purple-200">Total processed volume</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">47M+</div>
              <div className="text-purple-200">AI conversations/month</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">15K+</div>
              <div className="text-purple-200">Active creators</div>
            </div>
          </div>
        </motion.div>

        {/* Case Studies */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Success stories that speak volumes
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {caseStudies.map((study, index) => (
              <CaseStudyCard key={index} {...study} />
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Ready to see similar results?
          </p>
          <a
            href="/success-stories"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium text-lg"
          >
            View all success stories
            <ArrowUpRight className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
