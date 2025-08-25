'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, LayoutDashboard, DollarSign, Users, Activity, Shield, Smartphone, Globe } from 'lucide-react'
import { DashboardMockup } from '@/components/product-mockups'
import PremiumButton from '@/components/premium-button'

export default function DashboardPage() {
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
              <LayoutDashboard className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Real-time Dashboard
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Your command center for managing fans, tracking revenue, and growing your business
            </p>
          </motion.div>

          {/* Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-16 max-w-5xl mx-auto"
          >
            <DashboardMockup />
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
                Get Your Dashboard
                <LayoutDashboard className="w-5 h-5 ml-2" />
              </PremiumButton>
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              Set up in 2 minutes • Works with all platforms
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12"
          >
            Everything at your fingertips
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <DollarSign className="w-6 h-6" />,
                title: "Live Revenue Tracking",
                description: "See earnings update in real-time. Track daily, weekly, and monthly revenue at a glance."
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Fan Management",
                description: "View all your fans in one place. See who's active, who's spending, and who needs attention."
              },
              {
                icon: <Activity className="w-6 h-6" />,
                title: "Performance Metrics",
                description: "Track message response rates, content performance, and engagement metrics."
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Secure & Private",
                description: "Bank-level encryption. Your data is yours alone. GDPR compliant."
              },
              {
                icon: <Smartphone className="w-6 h-6" />,
                title: "Mobile Optimized",
                description: "Check your stats on the go. Full dashboard access from any device."
              },
              {
                icon: <Globe className="w-6 h-6" />,
                title: "Multi-Platform",
                description: "Connect all your creator accounts. See combined analytics across platforms."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-purple-600 dark:text-purple-400">{feature.icon}</div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Views */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12"
          >
            Powerful views for every need
          </motion.h2>

          <div className="space-y-16">
            {/* Revenue View */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid lg:grid-cols-2 gap-8 items-center"
            >
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Revenue Overview
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                  Track your income streams with beautiful charts and insights. See what's working and double down on success.
                </p>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> Daily/Weekly/Monthly views
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> Revenue by source breakdown
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> Growth trends and projections
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">$142,847</div>
                  <div className="text-sm text-green-600">+23% this month</div>
                  <div className="mt-4 h-32 bg-gradient-to-r from-purple-600 to-pink-600 rounded opacity-20"></div>
                </div>
              </div>
            </motion.div>

            {/* Fan Management View */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid lg:grid-cols-2 gap-8 items-center"
            >
              <div className="order-2 lg:order-1">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Top Fans</h4>
                    <div className="space-y-3">
                      {['John D. - $2,450', 'Mike S. - $1,890', 'Alex R. - $1,560'].map((fan, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{fan}</span>
                          <span className="text-xs text-purple-600 dark:text-purple-400">VIP</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Fan Intelligence
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                  Know your audience better than ever. Our AI analyzes behavior to help you maximize every relationship.
                </p>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> VIP fan identification
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> Spending pattern analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span> Engagement scoring
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mobile App Teaser */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Smartphone className="w-16 h-16 text-purple-600 dark:text-purple-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Take your business anywhere
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Full dashboard access on iOS and Android. Check stats, respond to fans, and manage your business on the go.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors">
                Download for iOS
              </button>
              <button className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors">
                Download for Android
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Your business, simplified
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Everything you need to run your creator business in one beautiful dashboard
          </p>
          <Link href="/join">
            <PremiumButton variant="secondary" size="lg" className="bg-white text-purple-600">
              Start Your Free Trial
            </PremiumButton>
          </Link>
        </div>
      </section>
    </div>
  )
}