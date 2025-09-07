"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator,
  FileText,
  PiggyBank,
  TrendingUp,
  Receipt,
  DollarSign,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type BusinessFeatureKey = 'taxes' | 'accounting' | 'savings';

export function ManageBusiness() {
  const [activeTab, setActiveTab] = useState<BusinessFeatureKey>('taxes');

  const businessFeatures: Record<BusinessFeatureKey, {
    title: string;
    icon: typeof Calculator;
    description: string;
    benefits: string[];
    stats: {
      saved: string;
      time: string;
      accuracy: string;
    };
  }> = {
    taxes: {
      title: 'Taxes Made Simple',
      icon: Calculator,
      description: 'We calculate, file, and pay your taxes automatically',
      benefits: [
        'Automatic expense tracking',
        'Quarterly tax calculations',
        'Direct IRS payments',
        'CPA-reviewed returns'
      ],
      stats: {
        saved: '$12,847',
        time: '52 hours',
        accuracy: '100%'
      }
    },
    accounting: {
      title: 'Real-Time Books',
      icon: FileText,
      description: 'Your financials update automatically as you earn',
      benefits: [
        'Live P&L statements',
        'Cash flow forecasting',
        'Expense categorization',
        'Monthly reports'
      ],
      stats: {
        saved: '$8,234',
        time: '30 hours',
        accuracy: '99.9%'
      }
    },
    savings: {
      title: 'Smart Savings',
      icon: PiggyBank,
      description: 'Automatically save for taxes, retirement, and goals',
      benefits: [
        'Tax reserve accounts',
        'Goal-based savings',
        '401(k) integration',
        'High-yield options'
      ],
      stats: {
        saved: '$45,678',
        time: '0 hours',
        accuracy: 'Automated'
      }
    }
  };

  return (
    <section id="manage" className="py-24 lg:py-32 bg-gradient-to-b from-gray-50 to-white dark:from-black to-gray-950">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-8">
            <Receipt className="w-4 h-4" />
            <span>Complete business management</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Run your business in one place
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Stay organized on any device. One dashboard for operations, finances, and workflows.
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          {/* Tab Navigation */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              {Object.entries(businessFeatures).map(([key, feature]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as BusinessFeatureKey)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                    activeTab === key
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <feature.icon className="w-5 h-5" />
                  {feature.title}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Left: Feature Details */}
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    {businessFeatures[activeTab].description}
                  </h3>

                  <ul className="space-y-4 mb-8">
                    {businessFeatures[activeTab].benefits.map((benefit, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <CheckCircle2 className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {benefit}
                        </span>
                      </motion.li>
                    ))}
                  </ul>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 mb-8">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Average creator savings
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {businessFeatures[activeTab].stats.saved}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Money saved
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {businessFeatures[activeTab].stats.time}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Time saved
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {businessFeatures[activeTab].stats.accuracy}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Accuracy
                        </div>
                      </div>
                    </div>
                  </div>

                  <Link href="/demo">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                    >
                      Get started
                      <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>

                {/* Right: Visual Dashboard */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl blur-3xl opacity-50" />
                  
                  <div className="relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-xl">
                    {/* Dashboard Preview */}
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Financial Overview
                      </h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Real-time
                      </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Revenue</span>
                          <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          $47,892
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400">
                          +23% from last month
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Tax Reserve</span>
                          <PiggyBank className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          $11,973
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-400">
                          25% of revenue
                        </div>
                      </div>
                    </div>

                    {/* Chart Placeholder */}
                    <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-850 rounded-xl flex items-center justify-center">
                      <span className="text-gray-400 dark:text-gray-600">
                        Revenue Chart
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-20 text-center"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
            Trusted by financial professionals
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            {['CPA Approved', 'IRS Compliant', 'Bank-Level Security', 'SOC 2 Certified'].map((badge, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg"
              >
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {badge}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
