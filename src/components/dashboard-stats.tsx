'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Users, MessageSquare, Zap, TrendingUp } from 'lucide-react'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  increment?: number
  maxValue?: number
  color?: string
  trend?: string
}

function StatCard({ 
  icon, 
  label, 
  value, 
  prefix = '', 
  suffix = '', 
  decimals = 0,
  increment = 1,
  maxValue,
  color = 'purple',
  trend
}: StatCardProps) {
  const [currentValue, setCurrentValue] = useState(0)
  const [isIncreasing, setIsIncreasing] = useState(true)

  useEffect(() => {
    const max = maxValue || value
    const timer = setInterval(() => {
      setCurrentValue((prev) => {
        if (isIncreasing) {
          const next = prev + increment
          if (next >= max) {
            setIsIncreasing(false)
            return max
          }
          return next
        } else {
          const next = prev - increment * 2 // Faster decrease
          if (next <= 0) {
            setIsIncreasing(true)
            return 0
          }
          return next
        }
      })
    }, 50)

    return () => clearInterval(timer)
  }, [increment, value, maxValue, isIncreasing])

  const formattedValue = decimals > 0 
    ? currentValue.toFixed(decimals)
    : Math.round(currentValue).toLocaleString()

  const bgColor = {
    purple: 'bg-purple-100 dark:bg-purple-900/30',
    green: 'bg-green-100 dark:bg-green-900/30',
    blue: 'bg-blue-100 dark:bg-blue-900/30',
    pink: 'bg-pink-100 dark:bg-pink-900/30'
  }[color]

  const iconColor = {
    purple: 'text-purple-600 dark:text-purple-400',
    green: 'text-green-600 dark:text-green-400',
    blue: 'text-blue-600 dark:text-blue-400',
    pink: 'text-pink-600 dark:text-pink-400'
  }[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
          <div className={iconColor}>{icon}</div>
        </div>
        {trend && (
          <span className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {trend}
          </span>
        )}
      </div>
      
      <div className="space-y-1">
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
          {prefix}{formattedValue}{suffix}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
      </div>
    </motion.div>
  )
}

export default function DashboardStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        icon={<DollarSign className="w-6 h-6" />}
        label="Monthly Revenue"
        value={47829}
        prefix="$"
        increment={137}
        maxValue={100000}
        color="green"
        trend="2–3x"
      />
      <StatCard
        icon={<Users className="w-6 h-6" />}
        label="Active Fans"
        value={2847}
        increment={8}
        maxValue={5000}
        color="purple"
        trend="+142"
      />
      <StatCard
        icon={<MessageSquare className="w-6 h-6" />}
        label="Messages/Day"
        value={1243}
        increment={3}
        maxValue={2000}
        color="blue"
        trend="AI"
      />
      <StatCard
        icon={<Zap className="w-6 h-6" />}
        label="Conversion Rate"
        value={78}
        suffix="%"
        increment={0.3}
        maxValue={95}
        decimals={1}
        color="pink"
        trend="+23%"
      />
    </div>
  )
}
