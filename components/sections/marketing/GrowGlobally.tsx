"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Globe2, 
  Clock, 
  Languages, 
  Shield,
  CreditCard,
  HeadphonesIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function GrowGlobally() {
  const globalFeatures = [
    {
      icon: Languages,
      title: '25+ Languages',
      description: 'Auto-translate messages and content to connect with fans worldwide',
      highlight: 'Real-time translation'
    },
    {
      icon: CreditCard,
      title: '135+ Currencies',
      description: 'Accept payments in any currency with automatic conversion',
      highlight: 'No conversion fees'
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Get help in your timezone, in your language, always',
      highlight: 'Average 2min response'
    },
    {
      icon: Shield,
      title: 'Local Compliance',
      description: 'Automatic tax calculation and compliance for every country',
      highlight: 'Stay 100% legal'
    }
  ];

  const regions = [
    { name: 'North America', creators: '15,234', growth: '+187%' },
    { name: 'Europe', creators: '12,567', growth: '+234%' },
    { name: 'Asia Pacific', creators: '8,901', growth: '+412%' },
    { name: 'Latin America', creators: '6,789', growth: '+567%' },
    { name: 'Middle East', creators: '3,456', growth: '+623%' },
    { name: 'Africa', creators: '2,345', growth: '+789%' }
  ];

  return (
    <section id="global" className="py-24 lg:py-32 bg-white dark:bg-gray-950 relative overflow-hidden">
      {/* Globe Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
            className="w-[800px] h-[800px] rounded-full border border-gray-200 dark:border-gray-800 opacity-20"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
            className="absolute inset-8 rounded-full border border-gray-200 dark:border-gray-800 opacity-20"
          />
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium mb-8">
            <Globe2 className="w-4 h-4" />
            <span>Available in 195+ countries</span>
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Grow{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400">
              around the world
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Localize once. Sell globally. Taxes, currencies, and logistics made easier.
          </p>
        </motion.div>

        {/* Global Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {globalFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-500/5 dark:to-emerald-500/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 h-full hover:border-green-300 dark:hover:border-green-700 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                  {feature.description}
                </p>
                
                <div className="text-sm font-medium text-green-600 dark:text-green-400">
                  {feature.highlight}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Regional Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto mb-20"
        >
          <h3 className="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-12">
            Creators are thriving everywhere
          </h3>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regions.map((region, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {region.name}
                  </h4>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {region.growth}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {region.creators}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  active creators
                </div>
                <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '75%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-12 text-center">
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", duration: 0.6 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-6"
              >
                <Globe2 className="w-10 h-10 text-white" />
              </motion.div>

              <blockquote className="text-xl text-gray-800 dark:text-gray-200 mb-6">
                "I'm based in Brazil but 70% of my fans are from the US and Europe. 
                Huntaze handles everything - payments, taxes, translations. I just create and earn."
              </blockquote>

              <div className="flex items-center justify-center gap-4">
                <img 
                  src="/api/placeholder/48/48" 
                  alt="Creator" 
                  className="w-12 h-12 rounded-full"
                />
                <div className="text-left">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    Isabella Santos
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    $120K/month from 42 countries
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mt-16"
        >
          <Link href="/demo">
            <Button
              size="lg"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <Globe2 className="mr-2 w-5 h-5" />
              Start your global empire
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
