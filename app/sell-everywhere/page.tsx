'use client'

import React from 'react'
import { motion } from 'framer-motion'
import LinearHeader from '@/components/LinearHeader'

export default function SellEverywherePage() {
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
              Sell everywhere your
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                fans already are
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-white/60 max-w-3xl mx-auto">
              Multi-channel automation that manages conversations across OnlyFans, 
              Instagram, Twitter, and more — all from one intelligent dashboard.
            </p>
          </motion.div>

          {/* Platform Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-20">
            
            {/* OnlyFans */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-purple-600/50 transition-all"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                <span className="text-white font-bold text-lg">OF</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">OnlyFans</h3>
              <p className="text-gray-400 text-sm mb-4">
                Full automation with smart upselling, PPV management, and fan relationship tracking.
              </p>
              <div className="flex items-center gap-2 text-green-500 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Direct integration</span>
              </div>
            </motion.div>

            {/* Instagram */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-purple-600/50 transition-all"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Instagram</h3>
              <p className="text-gray-400 text-sm mb-4">
                Smart DM responses, story engagement, and compliant link management.
              </p>
              <div className="flex items-center gap-2 text-green-500 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>API connected</span>
              </div>
            </motion.div>

            {/* Twitter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-purple-600/50 transition-all"
            >
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">X (Twitter)</h3>
              <p className="text-gray-400 text-sm mb-4">
                Reply automation, thread engagement, and promotional tweet scheduling.
              </p>
              <div className="flex items-center gap-2 text-green-500 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Full automation</span>
              </div>
            </motion.div>

            {/* TikTok */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-purple-600/50 transition-all"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-blue-500 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.37 6.37 0 00-1-.05A6.33 6.33 0 005 15.68a6.34 6.34 0 006.33 6.34A6.37 6.37 0 0016.37 16V8.5a8.1 8.1 0 004.13 1.2v-3a4.49 4.49 0 01-.91.01z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">TikTok</h3>
              <p className="text-gray-400 text-sm mb-4">
                Comment management, trend tracking, and cross-platform promotion.
              </p>
              <div className="flex items-center gap-2 text-yellow-500 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 1.414L10.586 9.5H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                </svg>
                <span>Coming soon</span>
              </div>
            </motion.div>
          </div>

          {/* Unified Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="max-w-6xl mx-auto mb-20"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                One dashboard to rule them all
              </h2>
              <p className="text-lg text-white/60 max-w-2xl mx-auto">
                Manage all your platforms from a single, intelligent interface that learns 
                your style and optimizes for each channel automatically.
              </p>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8">
              <div className="grid md:grid-cols-3 gap-8">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Unified Inbox</h3>
                      <p className="text-sm text-white/60">All messages in one place</p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>• Smart priority sorting</li>
                    <li>• Cross-platform threading</li>
                    <li>• Automated responses</li>
                    <li>• Fan relationship tracking</li>
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Smart Analytics</h3>
                      <p className="text-sm text-white/60">Performance insights</p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>• Revenue by platform</li>
                    <li>• Best performing content</li>
                    <li>• Fan lifetime value</li>
                    <li>• Conversion optimization</li>
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">AI Automation</h3>
                      <p className="text-sm text-white/60">Work smarter, not harder</p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>• Platform-specific responses</li>
                    <li>• Automatic content suggestions</li>
                    <li>• Smart upselling timing</li>
                    <li>• Compliance monitoring</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Success Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl p-8 sm:p-12 backdrop-blur-sm border border-purple-600/30 max-w-5xl mx-auto mb-16"
          >
            <h3 className="text-2xl font-bold text-white text-center mb-8">
              Multi-platform success by the numbers
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-white mb-2">4.2x</p>
                <p className="text-white/60">Higher revenue</p>
              </div>
              <div className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-white mb-2">73%</p>
                <p className="text-white/60">Time saved</p>
              </div>
              <div className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-white mb-2">8</p>
                <p className="text-white/60">Platforms supported</p>
              </div>
              <div className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-white mb-2">24/7</p>
                <p className="text-white/60">Always active</p>
              </div>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to expand your reach?
            </h2>
            <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
              Connect all your platforms in minutes and watch your revenue multiply.
            </p>
            <a
              href="/signup"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              Start selling everywhere
              <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          </motion.div>
        </div>
      </section>
    </>
  )
}

