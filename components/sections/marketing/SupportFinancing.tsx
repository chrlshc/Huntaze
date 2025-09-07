"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  HeadphonesIcon,
  MessageCircle,
  Video,
  CreditCard,
  TrendingUp,
  Clock,
  Users,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function SupportFinancing() {
  const supportFeatures = [
    {
      icon: MessageCircle,
      title: 'Live Chat',
      availability: '24/7',
      responseTime: '< 2 min'
    },
    {
      icon: Video,
      title: 'Video Support',
      availability: '9am-11pm ET',
      responseTime: 'Instant'
    },
    {
      icon: HeadphonesIcon,
      title: 'Phone Support',
      availability: '24/7',
      responseTime: '< 30 sec'
    },
    {
      icon: Users,
      title: 'Community',
      availability: 'Always',
      responseTime: '50k+ creators'
    }
  ];

  const financingOptions = [
    {
      title: 'Revenue Advance',
      amount: 'Up to $500k',
      description: 'Get capital based on your future earnings',
      features: [
        'No credit check required',
        'Approval in 24 hours',
        'Flexible repayment',
        'No personal guarantee'
      ]
    },
    {
      title: 'Equipment Financing',
      amount: 'Up to $100k',
      description: 'Finance cameras, computers, and studio gear',
      features: [
        '0% APR available',
        'Same-day approval',
        '12-60 month terms',
        'Tax deductible'
      ]
    },
    {
      title: 'Marketing Budget',
      amount: 'Up to $50k',
      description: 'Invest in growth with dedicated ad spend',
      features: [
        'Flexible terms',
        'No upfront costs',
        'Fair pricing',
        'Expert guidance'
      ]
    }
  ];

  return (
    <section id="support" className="py-24 lg:py-32 bg-gradient-to-b from-gray-50 to-white dark:from-black to-gray-950">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium mb-8">
            <Award className="w-4 h-4" />
            <span>Helpful support & transparent financing</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Support you can rely on
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            From onboarding to growth, we’re here to help. Clear terms, friendly humans.
          </p>
        </motion.div>

        {/* Support Section */}
        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Support that never sleeps
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Real humans, real help, really fast. Available in 25+ languages.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mb-12">
            {supportFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 text-center hover:border-green-300 dark:hover:border-green-700 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h4>
                
                <div className="space-y-1">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {feature.availability}
                  </div>
                  <div className="text-sm font-medium text-green-600 dark:text-green-400">
                    {feature.responseTime}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Support Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-green-50 dark:bg-green-900/20 rounded-3xl p-8 max-w-3xl mx-auto"
          >
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  4.9/5
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Support rating
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  1.8 min
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Avg response time
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  98%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  First-contact resolution
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Financing Section */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Capital to fuel your growth
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Get funding without the hassle. No equity, no personal guarantees, no BS.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {financingOptions.map((option, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 h-full hover:border-green-300 dark:hover:border-green-700 transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                      {option.title}
                    </h4>
                    <CreditCard className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {option.amount}
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {option.description}
                  </p>
                  
                  <ul className="space-y-3">
                    {option.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-12 max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-white mb-4">
              Experience the Huntaze difference
            </h3>
            <p className="text-xl text-gray-300 mb-8">
              Join a community that celebrates your success and supports your journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Get started today
                </Button>
              </Link>
              <Link href="/support">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-gray-600 text-white hover:bg-gray-800 px-8 py-6 text-lg font-semibold rounded-xl transition-all duration-300"
                >
                  Talk to support
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
