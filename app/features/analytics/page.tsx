'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, BarChart3, TrendingUp, Users, DollarSign, PieChart, Activity } from 'lucide-react'
import { AnalyticsMockup } from '@/components/product-mockups'
import PremiumButton from '@/components/premium-button'

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-20">
      {/* Back button */}
      <div className="max-w-7xl mx-auto px-4 pt-8">
        <Link 
          href="/" 
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Link>
      </div>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-2xl mb-6">
              <BarChart3 className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Smart Analytics
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              AI-powered insights to understand your fans, optimize content, and maximize revenue
            </p>
          </motion.div>

          {/* Analytics Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-16 max-w-4xl mx-auto"
          >
            <AnalyticsMockup />
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <Link href="/join">
              <PremiumButton size="lg" className="mx-auto">
                Start Free Trial
                <TrendingUp className="w-5 h-5 ml-2" />
              </PremiumButton>
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              See your data come to life • No setup required
            </p>
          </motion.div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12"
          >
            Track what matters
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <DollarSign className="w-8 h-8" />,
                metric: "Revenue Analytics",
                description: "Track earnings by day, week, month. See which content drives sales."
              },
              {
                icon: <Users className="w-8 h-8" />,
                metric: "Fan Insights",
                description: "Understand spending patterns, preferences, and lifetime value."
              },
              {
                icon: <Activity className="w-8 h-8" />,
                metric: "Engagement Metrics",
                description: "Message response rates, peak activity times, and interaction quality."
              },
              {
                icon: <PieChart className="w-8 h-8" />,
                metric: "Content Performance",
                description: "See which posts, messages, and offers convert best."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {item.metric}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                AI-Powered Predictions
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Churn Prevention
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Our AI identifies fans at risk of leaving and suggests personalized retention strategies.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Revenue Optimization
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Get AI recommendations on pricing, timing, and content to maximize your earnings.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    VIP Identification
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Automatically identify high-value fans and get personalized engagement strategies.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8"
            >
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                  94%
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Prediction accuracy for fan behavior
                </p>
              </div>
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300">Churn Risk Detection</span>
                    <span className="text-green-600 font-medium">Active</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300">Revenue Forecasting</span>
                    <span className="text-green-600 font-medium">Active</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 dark:text-gray-300">Content Optimization</span>
                    <span className="text-green-600 font-medium">Active</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 text-center"
          >
            <p className="text-2xl text-gray-700 dark:text-gray-300 mb-6 italic">
              "The analytics showed me I was posting at the wrong times. Changed my schedule based on the AI recommendations and doubled my revenue in 30 days!"
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="text-4xl">👩‍🦰</div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 dark:text-white">Maria K.</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Top 1% Creator</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Make data-driven decisions
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Stop guessing what works. Know exactly what your fans want.
          </p>
          <Link href="/join">
            <PremiumButton variant="secondary" size="lg" className="bg-white text-purple-600">
              Get Your Analytics Dashboard
            </PremiumButton>
          </Link>
        </div>
      </section>
    </div>
  )
}