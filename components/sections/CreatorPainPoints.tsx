'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  Users, 
  Clock, 
  Shield, 
  Brain,
  TrendingDown,
  AlertCircle,
  UserX
} from 'lucide-react'

interface PainPoint {
  problem: string
  solution: string
  icon: React.ReactNode
}

const painPoints: PainPoint[] = [
  {
    problem: "Agencies want 20-40% of your revenue",
    solution: "Huntaze uses a transparent 9% → 2% performance fee",
    icon: <DollarSign className="w-6 h-6 text-red-500" />
  },
  {
    problem: "VAs share your private content & strategies",
    solution: "AI can't leak or steal your content",
    icon: <Shield className="w-6 h-6 text-red-500" />
  },
  {
    problem: "Managing employees kills your creativity",
    solution: "AI works 24/7 without supervision",
    icon: <Users className="w-6 h-6 text-red-500" />
  },
  {
    problem: "Team drama and conflicts slow you down",
    solution: "AI has no ego, no sick days, no drama",
    icon: <AlertCircle className="w-6 h-6 text-red-500" />
  },
  {
    problem: "Hiring means less time creating content",
    solution: "Stay focused on what you do best",
    icon: <Clock className="w-6 h-6 text-red-500" />
  },
  {
    problem: "Employee turnover disrupts your business",
    solution: "AI never quits or asks for raises",
    icon: <UserX className="w-6 h-6 text-red-500" />
  }
]

const creatorStats = [
  {
    value: "73%",
    label: "Creators who fired their teams",
    subtext: "After 30 days with Huntaze"
  },
  {
    value: "4.2",
    label: "Average team size replaced",
    subtext: "With one AI assistant"
  },
  {
    value: "+67%",
    label: "Profit margin increase",
    subtext: "No salaries to pay"
  },
  {
    value: "94%",
    label: "Creator burnout eliminated",
    subtext: "Work-life balance restored"
  }
]

export default function CreatorPainPoints() {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Built for creators who refuse to compromise
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Why split your hard-earned revenue when AI can do it better?
          </p>
        </motion.div>

        {/* Pain Points Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {painPoints.map((point, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-50 rounded-lg flex-shrink-0">
                  {point.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {point.problem}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    ✓ {point.solution}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Creator Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-12 text-white"
        >
          <h3 className="text-3xl font-bold text-center mb-12">
            The Solo Creator Revolution
          </h3>
          
          <div className="grid md:grid-cols-4 gap-8">
            {creatorStats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-sm font-medium mb-1 opacity-90">{stat.label}</div>
                <div className="text-xs opacity-75">{stat.subtext}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Value Props */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Stay Solo, Scale Infinitely
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              whileHover={{ y: -4 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-gray-900 dark:text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Keep Your Creative Freedom
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                No meetings, no management, just pure creation
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingDown className="w-8 h-8 text-gray-900 dark:text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Low, transparent revenue share
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Performance-based fee only (9% → 2%), no equity, no bonuses
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-900 dark:text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Work 10 Hours/Week
              </h4>
              <p className="text-gray-600 dark:text-gray-400">
                Spend time creating, not managing people
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
