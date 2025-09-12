'use client'

import React from 'react'
import { motion } from 'framer-motion'
import LinearHeader from '@/components/LinearHeader'

export default function ForEveryonePage() {
  return (
    <>
      <LinearHeader />
      <section className="relative min-h-screen bg-black">
        <div className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-16">
          
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-5xl mx-auto mb-20"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              From solo creators to
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                global brands
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-white/60 max-w-3xl mx-auto">
              Whether you're just starting out or running a content empire, 
              our AI platform scales with your business at every stage.
            </p>
          </motion.div>

          {/* Success Stories Grid */}
          <div className="max-w-6xl mx-auto mb-20">
            
            {/* Solo Creator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid md:grid-cols-2 gap-8 items-center mb-16"
            >
              <div>
                <div className="text-purple-600 font-medium mb-2">Solo Creators</div>
                <h3 className="text-3xl font-bold text-white mb-4">
                  Start earning from day one
                </h3>
                <p className="text-white/60 mb-6">
                  Sarah started with zero followers. Using our AI automation, she now earns 
                  $15K/month while spending just 2 hours a day on her business.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">24/7 automated responses</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">Smart content suggestions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">Grow while you sleep</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full"></div>
                  <div>
                    <h4 className="text-white font-semibold">@sarahcreates</h4>
                    <p className="text-white/60 text-sm">15K subscribers • $15K/month</p>
                  </div>
                </div>
                <blockquote className="text-white/80 italic">
                  "I went from struggling to pay rent to buying my dream apartment in 8 months. 
                  The AI handles everything while I focus on creating content I love."
                </blockquote>
              </div>
            </motion.div>

            {/* Mid-tier Brands */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid md:grid-cols-2 gap-8 items-center mb-16 md:flex-row-reverse"
            >
              <div className="md:order-2">
                <div className="text-purple-600 font-medium mb-2">Growing Brands</div>
                <h3 className="text-3xl font-bold text-white mb-4">
                  Scale without limits
                </h3>
                <p className="text-white/60 mb-6">
                  Fitness brand FitQueens manages 50+ creator accounts generating $2M/month 
                  in revenue with just 3 team members.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">Manage 50+ accounts from one dashboard</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">AI learns each creator's unique voice</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">Enterprise-grade security & compliance</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 md:order-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    FQ
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">FitQueens</h4>
                    <p className="text-white/60 text-sm">50 creators • $2M/month</p>
                  </div>
                </div>
                <blockquote className="text-white/80 italic">
                  "We scaled from 5 to 50 creators in 6 months. The platform handles millions 
                  of messages while maintaining each creator's authentic voice."
                </blockquote>
              </div>
            </motion.div>

            {/* Enterprise */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid md:grid-cols-2 gap-8 items-center"
            >
              <div>
                <div className="text-purple-600 font-medium mb-2">Enterprise</div>
                <h3 className="text-3xl font-bold text-white mb-4">
                  Global brands trust us
                </h3>
                <p className="text-white/60 mb-6">
                  Major entertainment companies use our white-label solution to manage 
                  thousands of creator accounts generating $50M+ annually.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">White-label solutions</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">Custom AI training</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">Dedicated success team</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    ME
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Media Entertainment Corp</h4>
                    <p className="text-white/60 text-sm">1000+ creators • $50M+/year</p>
                  </div>
                </div>
                <blockquote className="text-white/80 italic">
                  "The platform processes over 10 million messages monthly with 99.9% uptime. 
                  It's become the backbone of our creator economy business."
                </blockquote>
              </div>
            </motion.div>
          </div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl p-8 sm:p-12 backdrop-blur-sm border border-purple-600/30 max-w-5xl mx-auto mb-16"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-white mb-2">50K+</p>
                <p className="text-white/60">Active creators</p>
              </div>
              <div className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-white mb-2">$500M+</p>
                <p className="text-white/60">Revenue generated</p>
              </div>
              <div className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-white mb-2">150M+</p>
                <p className="text-white/60">Messages automated</p>
              </div>
              <div className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-white mb-2">99.9%</p>
                <p className="text-white/60">Uptime SLA</p>
              </div>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to join thousands of successful creators?
            </h2>
            <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
              Start free and scale as you grow. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/signup"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
              >
                Get started free
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a
                href="/demo"
                className="inline-flex items-center px-8 py-4 border border-white/20 text-white font-medium rounded-xl hover:bg-white/10 transition-colors"
              >
                Book a demo
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}

