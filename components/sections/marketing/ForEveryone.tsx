"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Rocket, 
  TrendingUp, 
  Crown,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function ForEveryone() {
  const stages = [
    {
      icon: Rocket,
      title: 'Just Starting',
      subtitle: '$0 - $10k/month',
      description: 'Launch your creator business with confidence',
      features: [
        'Easy setup in under 5 minutes',
        'Pre-built templates & strategies',
        'Basic automation tools',
        'Community support access'
      ],
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-100 to-emerald-100',
      darkBgColor: 'from-green-900/20 to-emerald-900/20'
    },
    {
      icon: TrendingUp,
      title: 'Scaling Up',
      subtitle: '$10k - $100k/month',
      description: 'Optimize and grow with advanced tools',
      features: [
        'Advanced analytics dashboard',
        'AI-powered content scheduling',
        'Team collaboration features',
        'Priority support'
      ],
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-100 to-cyan-100',
      darkBgColor: 'from-blue-900/20 to-cyan-900/20'
    },
    {
      icon: Crown,
      title: 'Empire Builder',
      subtitle: '$100k+/month',
      description: 'Run your empire like a Fortune 500',
      features: [
        'Custom integrations & API',
        'Dedicated account manager',
        'White-glove onboarding',
        'Enterprise SLA'
      ],
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-100 to-pink-100',
      darkBgColor: 'from-purple-900/20 to-pink-900/20'
    }
  ];

  return (
    <section id="for-everyone" className="py-24 lg:py-32 bg-gradient-to-b from-gray-50 to-white dark:from-black to-gray-950">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            For everyone from{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-purple-600 dark:from-green-400 dark:to-purple-400">
              beginners to empire builders
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Start simple, scale smoothly. Huntaze meets you where you are and saves you time at every stage.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {stages.map((stage, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="relative group"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stage.bgColor} dark:${stage.darkBgColor} rounded-3xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-300`} />
              
              <div className="relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 h-full hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stage.color} flex items-center justify-center mb-6`}>
                  <stage.icon className="w-7 h-7 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {stage.title}
                </h3>
                
                <p className={`text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r ${stage.color} mb-4`}>
                  {stage.subtitle}
                </p>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {stage.description}
                </p>
                
                <ul className="space-y-3">
                  {stage.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Success Story */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-700 dark:to-blue-700 rounded-3xl p-12 text-white text-center"
        >
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl font-bold mb-6">
              Join creators who went from $0 to $1M+ in 12 months
            </h3>
            <p className="text-xl mb-8 text-purple-100">
              "Huntaze gave me the tools and confidence to quit my 9-5. Now I'm making 
              more in a month than I used to make in a year."
            </p>
            <div className="flex items-center justify-center gap-4 mb-8">
              <img 
                src="/api/placeholder/48/48" 
                alt="Creator" 
                className="w-12 h-12 rounded-full border-2 border-white"
              />
              <div className="text-left">
                <div className="font-semibold">Sarah Chen</div>
                <div className="text-purple-200">Top 0.1% Creator</div>
              </div>
            </div>
            <Link href="/demo">
              <Button
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Start your success story
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
