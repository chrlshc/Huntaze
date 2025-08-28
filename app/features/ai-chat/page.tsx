'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, MessageSquare, Zap, Shield, TrendingUp, Users, Clock, Globe } from 'lucide-react'
import LiveChatDemo from '@/components/live-chat-demo'
import PremiumButton from '@/components/premium-button'

export default function AIChatPage() {
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
              <MessageSquare className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              AI Chat Assistant
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Your personal AI that responds instantly in your unique voice and style
            </p>
          </motion.div>

          {/* Live Demo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-16"
          >
            <LiveChatDemo />
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
                <Zap className="w-5 h-5 ml-2" />
              </PremiumButton>
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              Free trial available • Cancel anytime
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
            Why creators love our AI
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Clock className="w-6 h-6" />,
                title: "Instant Responses",
                description: "Never miss a sale opportunity. Our AI responds instantly to keep fans engaged."
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: "285% Revenue Increase",
                description: "Smart upselling and personalized offers at the perfect moment."
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Platform Aware",
                description: "Designed to respect platform rules and best practices."
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Learns Your Style",
                description: "AI adapts to your personality, ensuring authentic conversations."
              },
              {
                icon: <Globe className="w-6 h-6" />,
                title: "All Languages",
                description: "Communicate with fans worldwide in their native language."
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Smart Automation",
                description: "Handles greetings, FAQs, and sales while you create content."
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

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12"
          >
            How it works
          </motion.h2>

          <div className="space-y-8">
            {[
              {
                step: "1",
                title: "Connect Your Accounts",
                description: "Link your creator platforms in 2 minutes. Supports OnlyFans and Fansly (beta)."
              },
              {
                step: "2",
                title: "Train Your AI",
                description: "Our AI learns from your past conversations to match your personality and style."
              },
              {
                step: "3",
                title: "Go Live",
                description: "Your AI starts responding instantly. Watch your revenue grow while you sleep."
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className="flex gap-6 items-start"
              >
                <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {step.step}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to 10x your fan engagement?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join creators who never miss a message or sale opportunity
          </p>
          <Link href="/join">
            <PremiumButton variant="secondary" size="lg" className="bg-white text-purple-600">
              Start Free Trial
            </PremiumButton>
          </Link>
        </div>
      </section>
    </div>
  )
}
