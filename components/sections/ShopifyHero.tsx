'use client'

import React, { useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function ShopifyHero() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <section className="relative min-h-screen bg-gradient-to-b from-[#fafbfc] to-white">
      <div className="container mx-auto px-6 pt-24 pb-16">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-[#1a1a1a] mb-6 leading-tight">
            Double Your Revenue,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              Half the Work
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8 px-4">
            Join 5,000+ creators who automated their business. 
            Save 20+ hours weekly with AI-powered conversations.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Start free trial
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white dark:bg-gray-800 text-black dark:text-white font-medium rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 transition-colors"
            >
              View demo
            </motion.button>
          </div>
        </motion.div>

        {/* Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative max-w-6xl mx-auto"
        >
          {/* Browser Frame */}
          <div className="rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Browser Header */}
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="flex-1 flex justify-center">
                <div className="bg-white dark:bg-gray-800 rounded-md px-4 py-1 text-sm text-gray-600 dark:text-gray-400 w-64 text-center">
                  app.huntaze.com/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className={`bg-white ${isMobile ? 'p-4' : 'p-8'}`}>
              {/* Top Bar */}
              <div className={`flex items-center justify-between ${isMobile ? 'mb-6' : 'mb-8'}`}>
                <div className="flex items-center gap-3">
                  <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold`}>
                    H
                  </div>
                  <div className={isMobile ? 'flex-1' : ''}>
                    <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-sm' : ''}`}>Welcome back, Sarah</h3>
                    <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Your business is growing 🚀</p>
                  </div>
                </div>
                {!isMobile && (
                  <div className="flex gap-3">
                    <button className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                      Settings
                    </button>
                    <button className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800">
                      Create Campaign
                    </button>
                  </div>
                )}
              </div>

              {/* Stats Cards */}
              <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-4 gap-4'} mb-8`}>
                <div className={`bg-gradient-to-br from-purple-50 to-pink-50 ${isMobile ? 'p-4' : 'p-6'} rounded-xl border border-purple-100`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Revenue</span>
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">+23%</span>
                  </div>
                  <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>$47,298</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">This month</p>
                </div>
                <div className={`bg-gradient-to-br from-blue-50 to-indigo-50 ${isMobile ? 'p-4' : 'p-6'} rounded-xl border border-blue-100`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Subscribers</span>
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">+18%</span>
                  </div>
                  <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>4,832</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Active users</p>
                </div>
                <div className={`bg-gradient-to-br from-green-50 to-emerald-50 ${isMobile ? 'p-4' : 'p-6'} rounded-xl border border-green-100`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Conversion</span>
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">89%</span>
                  </div>
                  <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>89%</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">AI success rate</p>
                </div>
                <div className={`bg-gradient-to-br from-orange-50 to-red-50 ${isMobile ? 'p-4' : 'p-6'} rounded-xl border border-orange-100`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Messages</span>
                    <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">147</span>
                  </div>
                  <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>2,847</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">This week</p>
                </div>
              </div>

              {/* Chart Section */}
              <div className={`bg-gray-50 rounded-xl ${isMobile ? 'p-4' : 'p-6'} border border-gray-200`}>
                <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'} mb-6`}>
                  <div>
                    <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900`}>Revenue Overview</h3>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Your earnings over the last 7 days</p>
                  </div>
                  {!isMobile && (
                    <select className="px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <option>Last 7 days</option>
                      <option>Last 30 days</option>
                      <option>Last 3 months</option>
                    </select>
                  )}
                </div>
                
                {/* Chart */}
                <svg viewBox="0 0 800 300" className={`w-full ${isMobile ? 'h-40' : 'h-64'}`}>
                  <defs>
                    <linearGradient id="shopifyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid lines */}
                  <g stroke="#e5e7eb">
                    <line x1="0" y1="60" x2="800" y2="60" strokeDasharray="5,5" />
                    <line x1="0" y1="120" x2="800" y2="120" strokeDasharray="5,5" />
                    <line x1="0" y1="180" x2="800" y2="180" strokeDasharray="5,5" />
                    <line x1="0" y1="240" x2="800" y2="240" />
                  </g>
                  
                  {/* Area */}
                  <path 
                    d="M 50,200 Q 150,190 200,170 T 300,130 Q 350,140 400,150 T 500,90 Q 600,70 700,30 L 700,240 L 50,240 Z"
                    fill="url(#shopifyGradient)"
                  />
                  
                  {/* Line */}
                  <path 
                    d="M 50,200 Q 150,190 200,170 T 300,130 Q 350,140 400,150 T 500,90 Q 600,70 700,30"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="3"
                  />
                  
                  {/* Points */}
                  <g fill="#8b5cf6">
                    <circle cx="50" cy="200" r="5" fill="white" stroke="#8b5cf6" strokeWidth="2" />
                    <circle cx="200" cy="170" r="5" fill="white" stroke="#8b5cf6" strokeWidth="2" />
                    <circle cx="300" cy="130" r="5" fill="white" stroke="#8b5cf6" strokeWidth="2" />
                    <circle cx="400" cy="150" r="5" fill="white" stroke="#8b5cf6" strokeWidth="2" />
                    <circle cx="500" cy="90" r="5" fill="white" stroke="#8b5cf6" strokeWidth="2" />
                    <circle cx="600" cy="60" r="5" fill="white" stroke="#8b5cf6" strokeWidth="2" />
                    <circle cx="700" cy="30" r="5" fill="#8b5cf6" />
                  </g>
                  
                  {/* Y-axis labels */}
                  <g fill="#6b7280" fontSize="12">
                    <text x="25" y="65" textAnchor="end">$10k</text>
                    <text x="25" y="125" textAnchor="end">$7.5k</text>
                    <text x="25" y="185" textAnchor="end">$5k</text>
                    <text x="25" y="245" textAnchor="end">$2.5k</text>
                  </g>
                  
                  {/* X-axis labels */}
                  <g fill="#6b7280" fontSize="12">
                    <text x="50" y="270" textAnchor="middle">Mon</text>
                    <text x="200" y="270" textAnchor="middle">Tue</text>
                    <text x="300" y="270" textAnchor="middle">Wed</text>
                    <text x="400" y="270" textAnchor="middle">Thu</text>
                    <text x="500" y="270" textAnchor="middle">Fri</text>
                    <text x="600" y="270" textAnchor="middle">Sat</text>
                    <text x="700" y="270" textAnchor="middle">Sun</text>
                  </g>
                </svg>

                {/* Chart Footer */}
                <div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center justify-between'} mt-6 pt-6 border-t border-gray-200`}>
                  <div>
                    <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>$36,518</p>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Total this week</p>
                  </div>
                  <div className={`flex gap-6 ${isMobile ? 'text-xs' : ''}`}>
                    <div>
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-900`}>Best day</p>
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Sunday • $8,934</p>
                    </div>
                    <div>
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-900`}>Average</p>
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>$5,217/day</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating badges */}
          <div className="absolute -top-4 -right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-4 py-2 hidden lg:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white">+147% Growth</p>
          </div>
          <div className="absolute -bottom-4 -left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg px-4 py-2 hidden lg:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white">5,000+ Happy Creators</p>
          </div>
        </motion.div>

        {/* Trust badges */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex items-center justify-center gap-8 mt-16 text-gray-400"
        >
          <p className="text-sm">Trusted by creators on</p>
          <div className="flex gap-6">
            <span className="font-semibold">Instagram</span>
            <span className="font-semibold">TikTok</span>
            <span className="font-semibold">OnlyFans</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}