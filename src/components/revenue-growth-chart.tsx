'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'

export default function RevenueGrowthChart() {
  const [currentRevenue, setCurrentRevenue] = useState(50000)
  const [percentage, setPercentage] = useState(0)
  const maxRevenue = 150000

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentRevenue((prev) => {
        const next = prev + 500
        if (next >= maxRevenue) {
          return 50000 // Reset
        }
        return next
      })
    }, 100)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    setPercentage(((currentRevenue - 50000) / 100000) * 100)
  }, [currentRevenue])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-950 rounded-xl p-6 shadow-lg border dark:border-gray-800"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Growth</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Real-time performance</p>
        </div>
        <span className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
          <TrendingUp className="w-4 h-4" />
          +23% this week
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              ${currentRevenue.toLocaleString()}
            </span>
            <span className="text-sm text-green-600 dark:text-green-400">
              +{percentage.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Chart visualization */}
        <div className="relative h-48 bg-gradient-to-b from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg overflow-hidden">
          <svg className="absolute inset-0 w-full h-full">
            {/* Grid lines */}
            {[0, 1, 2, 3].map((i) => (
              <line
                key={i}
                x1="0"
                y1={`${(i + 1) * 25}%`}
                x2="100%"
                y2={`${(i + 1) * 25}%`}
                stroke="currentColor"
                strokeOpacity="0.1"
                className="text-gray-600"
              />
            ))}
            
            {/* Animated path */}
            <motion.path
              d={`M 0 150 Q 50 ${150 - percentage} 100 ${150 - percentage * 1.5} T 200 ${150 - percentage * 2} T 300 ${150 - percentage * 2.5} T 400 ${150 - percentage * 3}`}
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeOut" }}
            />
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
            </defs>
            
            {/* Area fill */}
            <motion.path
              d={`M 0 150 Q 50 ${150 - percentage} 100 ${150 - percentage * 1.5} T 200 ${150 - percentage * 2} T 300 ${150 - percentage * 2.5} T 400 ${150 - percentage * 3} L 400 150 Z`}
              fill="url(#gradient)"
              fillOpacity="0.2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2, ease: "easeOut" }}
            />
          </svg>

          {/* Animated dots */}
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-purple-600 rounded-full"
              style={{
                left: `${25 + i * 25}%`,
                bottom: `${20 + percentage * (0.5 + i * 0.3)}%`
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            />
          ))}
        </div>

        {/* Time labels */}
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-300">
          <span>12 AM</span>
          <span>6 AM</span>
          <span>12 PM</span>
          <span>6 PM</span>
          <span>Now</span>
        </div>
      </div>
    </motion.div>
  )
}