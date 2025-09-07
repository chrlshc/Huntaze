"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Shield, 
  Cpu, 
  BarChart3,
  Rocket,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function PerformanceInnovation() {
  const stats = [
    {
      icon: Zap,
      value: '99.99%',
      label: 'Uptime SLA',
      description: 'Never miss a sale'
    },
    {
      icon: Shield,
      value: '256-bit',
      label: 'Encryption',
      description: 'Bank-level security'
    },
    {
      icon: Cpu,
      value: '<50ms',
      label: 'Response time',
      description: 'Lightning fast'
    },
    {
      icon: BarChart3,
      value: '10TB+',
      label: 'Data processed daily',
      description: 'Scale without limits'
    }
  ];

  const innovations = [
    {
      title: 'AI-Powered Growth',
      description: 'Machine learning that actually learns your business and grows with you',
      metrics: ['3x faster growth', '87% automation rate', 'Self-improving algorithms']
    },
    {
      title: 'Enterprise Infrastructure',
      description: 'Built on the same technology that powers Fortune 500 companies',
      metrics: ['Global CDN', 'Auto-scaling', 'Zero downtime deploys']
    },
    {
      title: 'Privacy First',
      description: 'Your content and data are yours. We never share, sell, or peek',
      metrics: ['End-to-end encryption', 'GDPR/CCPA compliant', 'Regular audits']
    }
  ];

  return (
    <section id="performance" className="py-24 lg:py-32 bg-white dark:bg-gray-950 relative overflow-hidden">
      {/* Tech Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 opacity-50" />
        <motion.div
          animate={{ 
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            repeatType: "reverse" 
          }}
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-8">
            <Rocket className="w-4 h-4" />
            <span>Industry-leading performance</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Fast, reliable, and private by default
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Global edge, optimized assets, and minimal JavaScript. Focus on your work — we take care of speed and stability.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20 max-w-6xl mx-auto">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 text-center h-full hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <stat.icon className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                </div>
                
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {stat.value}
                </div>
                
                <div className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {stat.label}
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.description}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Innovations */}
        <div className="space-y-16 mb-20">
          {innovations.map((innovation, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className={`grid lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? 'lg:grid-flow-dense' : ''
              }`}
            >
              <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {innovation.title}
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                  {innovation.description}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {innovation.metrics.map((metric, metricIndex) => (
                    <div 
                      key={metricIndex}
                      className="flex items-center gap-2"
                    >
                      <div className="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {metric}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={index % 2 === 1 ? 'lg:col-start-1' : ''}
              >
                <div className="relative aspect-square max-w-md mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-200 to-blue-200 dark:from-purple-900/30 dark:to-blue-900/30 rounded-3xl blur-2xl" />
                  <div className="relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 h-full flex items-center justify-center">
                    {index === 0 && <Cpu className="w-32 h-32 text-purple-600 dark:text-purple-400" />}
                    {index === 1 && <Shield className="w-32 h-32 text-blue-600 dark:text-blue-400" />}
                    {index === 2 && <Lock className="w-32 h-32 text-green-600 dark:text-green-400" />}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">
              Ready to experience the difference?
            </h3>
            <p className="text-xl mb-8 text-purple-100">
              Join creators who demand the best. Get started in minutes, 
              scale to millions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo">
                <Button
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Start free trial
                </Button>
              </Link>
              <Link href="/features">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-purple-600 px-8 py-6 text-lg font-semibold rounded-xl transition-all duration-300"
                >
                  View documentation
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
