"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  TrendingUp, 
  Globe, 
  Zap, 
  Shield, 
  Users,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function UnifiedPlatform() {
  const features = [
    {
      icon: MessageSquare,
      title: 'Unified Inbox',
      description: 'Manage all your platforms from one place. No more tab switching.',
      metric: 'Faster responses'
    },
    {
      icon: TrendingUp,
      title: 'Revenue Analytics',
      description: 'Clear, actionable insights that help you improve what matters.',
      metric: 'Actionable insights'
    },
    {
      icon: Globe,
      title: 'Global Payments',
      description: 'Accept payments across regions with reliable processing.',
      metric: 'Global-ready'
    },
    {
      icon: Zap,
      title: 'AI Automation',
      description: 'Automate the busywork while you keep creative control.',
      metric: 'Hours saved each week'
    },
    {
      icon: Shield,
      title: 'Security',
      description: 'Privacy-first by default. Encryption and careful access.',
      metric: 'Reliable uptime'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Add team members with custom permissions and workflows.',
      metric: 'Unlimited team members'
    }
  ];

  return (
    <section id="platform" className="py-24 lg:py-32 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            One platform to run{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400">everything</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Replace ten tools. Plan, publish, message, and get paid — in one place.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative p-8 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/5 group-hover:to-blue-500/5 rounded-2xl transition-all duration-300" />
              
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {feature.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    {feature.metric}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <Link href="/features">
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg font-semibold rounded-xl border-2 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-all duration-300 group"
            >
              Explore all features
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>

        {/* Integration Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mt-24 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/10 dark:to-blue-900/10 rounded-3xl blur-3xl opacity-50" />
          
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-12">
            <h3 className="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-8">
              Seamlessly integrated with your favorite platforms
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {['OnlyFans', 'Fansly', 'Instagram', 'TikTok', 'Twitter/X', 'Telegram', 'Discord', 'Patreon'].map((platform, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center justify-center p-4 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
                >
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {platform}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
