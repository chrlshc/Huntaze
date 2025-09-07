"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  Users,
  Sparkles,
  BarChart3,
  Heart,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function FindCustomers() {
  const metrics = [
    { label: 'Fan lifetime value', value: '$2,480', change: '+12%' },
    { label: 'Retention rate', value: '92%', change: '+3%' },
    { label: 'Conversion rate', value: '11.8%', change: '+1.2%' },
    { label: 'Monthly recurring', value: '$46K', change: '+2%' }
  ];

  const features = [
    {
      icon: Brain,
      title: 'AI Fan Analysis',
      description: 'Understand what makes each fan tick and personalize their experience'
    },
    {
      icon: Target,
      title: 'Smart Targeting',
      description: 'Find high-value fans before your competition does'
    },
    {
      icon: Heart,
      title: 'Loyalty Programs',
      description: 'Turn one-time buyers into lifetime supporters'
    },
    {
      icon: BarChart3,
      title: 'Predictive Analytics',
      description: 'Know which fans are ready to spend before they do'
    }
  ];

  return (
    <section id="customers" className="py-24 lg:py-32 bg-gradient-to-b from-gray-50 to-white dark:from-black to-gray-950 overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>AI-powered fan intelligence</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Find your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
              forever customers
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Find the right audience and keep them engaged. Simple, privacy‑safe insights help you improve what works.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
          {/* Left: Metrics Dashboard */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-200 to-pink-200 dark:from-purple-900/20 dark:to-pink-900/20 rounded-3xl blur-3xl opacity-50" />
            
            <div className="relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Real creator results
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Last 30 days
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {metrics.map((metric, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {metric.label}
                      </span>
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">
                        {metric.change}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {metric.value}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      Average creator growth
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      3.2x revenue increase in 90 days
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Features */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* AI Assistant Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mt-24 max-w-4xl mx-auto"
        >
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-1">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      AI Assistant
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your personal growth strategist
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                  <p className="text-sm text-purple-900 dark:text-purple-100">
                    <span className="font-semibold">💡 Insight:</span> Your fan "Mike_87" has visited your profile 
                    12 times this week. They typically purchase on Fridays. Consider sending a personalized 
                    message with your new content.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <span className="font-semibold">📊 Trend Alert:</span> Fans who engage with your workout 
                    content are 3x more likely to purchase PPV. Consider creating more fitness-related content.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <Link href="/demo">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Get AI insights now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
