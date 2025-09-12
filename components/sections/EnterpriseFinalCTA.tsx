'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight, Calendar, Users, Zap } from 'lucide-react'

export default function EnterpriseFinalCTA() {
  const benefits = [
    {
      icon: <CheckCircle className="w-5 h-5" />,
      text: 'No equity required'
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      text: 'Transparent revenue share (9% → 2%)'
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      text: 'Stay 100% independent'
    }
  ]

  return (
    <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10 px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Headline */}
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            Ready to 10x without hiring?
          </h2>
          <p className="text-xl md:text-2xl opacity-90 mb-10 max-w-2xl mx-auto">
            Join 5,000+ creators running million-dollar businesses solo
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <motion.a
              href="/schedule-call"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-full font-semibold text-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Book Your Solo Success Call
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </motion.a>
            
            <motion.a
              href="/creator-stories"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white rounded-full font-semibold text-lg hover:bg-white/10 transition-colors"
            >
              See How Creators Stay Independent
            </motion.a>
          </div>

          {/* Trust Signals */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-6 text-sm"
          >
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 opacity-80">
                {benefit.icon}
                <span>{benefit.text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Enterprise Contact Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 pt-16 border-t border-white/20"
        >
          <p className="text-lg opacity-90 mb-4">
            Enterprise sales team available Monday-Friday, 9am-6pm EST
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-sm opacity-80">
            <a href="tel:+1-888-HUNTAZE" className="hover:opacity-100 transition-opacity">
              +1 (888) HUNTAZE
            </a>
            <span className="hidden sm:inline">•</span>
            <a href="mailto:enterprise@huntaze.com" className="hover:opacity-100 transition-opacity">
              enterprise@huntaze.com
            </a>
            <span className="hidden sm:inline">•</span>
            <a href="/contact" className="hover:opacity-100 transition-opacity">
              Global offices →
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
