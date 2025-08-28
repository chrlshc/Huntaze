'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Zap, Calendar, Send, Clock, Shield, Repeat } from 'lucide-react'
import PremiumButton from '@/components/premium-button'

export default function AutomationPage() {
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
              <Zap className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Content Automation
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Schedule posts, send mass messages, and optimize your content strategy on autopilot
            </p>
          </motion.div>

          {/* Automation Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-16 max-w-5xl mx-auto"
          >
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8">
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { time: "9:00 AM", action: "Post scheduled content", status: "completed" },
                  { time: "12:00 PM", action: "Send VIP offers", status: "active" },
                  { time: "6:00 PM", action: "Welcome new fans", status: "pending" }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.time}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        item.status === 'active' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 animate-pulse' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium">{item.action}</p>
                  </motion.div>
                ))}
              </div>
            </div>
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
                Start Automating
                <Zap className="w-5 h-5 ml-2" />
              </PremiumButton>
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              Save 10+ hours per week • Set up in minutes
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12"
          >
            Automation that works while you sleep
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Calendar className="w-6 h-6" />,
                title: "Smart Scheduling",
                description: "Post at optimal times when your fans are most active. AI learns the best schedule."
              },
              {
                icon: <Send className="w-6 h-6" />,
                title: "Mass Messaging",
                description: "Send personalized messages to thousands of fans with one click."
              },
              {
                icon: <Clock className="w-6 h-6" />,
                title: "Time Zone Magic",
                description: "Automatically adjust posting times for fans around the world."
              },
              {
                icon: <Repeat className="w-6 h-6" />,
                title: "Recurring Campaigns",
                description: "Set up welcome sequences, VIP offers, and retention campaigns once."
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Platform Aware",
                description: "Designed to respect platform rules and best practices."
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Instant Actions",
                description: "Trigger automated responses based on fan behavior and spending."
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

      {/* Automation Workflows */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12"
          >
            Pre-built automation workflows
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Welcome Sequence",
                description: "Automatically welcome new fans with personalized messages and special offers",
                steps: ["Fan subscribes", "Send welcome message", "Offer starter content", "Check engagement", "Send VIP upgrade"]
              },
              {
                title: "Re-engagement Campaign",
                description: "Win back inactive fans with targeted messages and exclusive content",
                steps: ["Detect inactivity", "Send check-in message", "Offer exclusive deal", "Track response", "Escalate if needed"]
              },
              {
                title: "VIP Upsell Flow",
                description: "Identify high-value fans and automatically present premium offerings",
                steps: ["Track spending", "Identify VIP potential", "Send exclusive offer", "Provide VIP perks", "Maintain engagement"]
              },
              {
                title: "Content Drip Campaign",
                description: "Keep fans engaged with scheduled content releases throughout the month",
                steps: ["Plan content calendar", "Schedule releases", "Notify subscribers", "Track performance", "Optimize timing"]
              }
            ].map((workflow, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg"
              >
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {workflow.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {workflow.description}
                </p>
                <div className="space-y-3">
                  {workflow.steps.map((step, stepIndex) => (
                    <div key={stepIndex} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-sm font-medium text-purple-600 dark:text-purple-400 flex-shrink-0">
                        {stepIndex + 1}
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">{step}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Real results from automation
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Creators using our automation see immediate improvements
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg"
            >
              <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">73%</div>
              <p className="text-gray-600 dark:text-gray-400">Less time spent on admin</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg"
            >
              <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">4.2x</div>
              <p className="text-gray-600 dark:text-gray-400">More consistent posting</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg"
            >
              <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">+156%</div>
              <p className="text-gray-600 dark:text-gray-400">Increase in fan engagement</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Work smarter, not harder
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Let automation handle the repetitive tasks while you focus on creating
          </p>
          <Link href="/join">
            <PremiumButton variant="secondary" size="lg" className="bg-white text-purple-600">
              Automate Your Business
            </PremiumButton>
          </Link>
        </div>
      </section>
    </div>
  )
}
