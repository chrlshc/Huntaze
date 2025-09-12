'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import LinearHeader from '@/components/LinearHeader'

export default function LinearStyleHero() {
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
    <>
      <LinearHeader />
      <section className="relative min-h-screen bg-black">
        <div className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-16">
          {/* Main Content */}
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 lg:gap-12 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full text-center lg:text-left"
            >
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                The platform built for
                <br />
                premium creators
              </h1>
              <p className="text-lg sm:text-xl text-white/60 mb-6 sm:mb-8 max-w-lg mx-auto lg:mx-0">
                Automate conversations, boost revenue, and scale your exclusive content business with AI.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <a href="/signup" className="rounded-xl bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center">
                  Start for free
                </a>
                <a href="/pricing" className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors text-center">
                  View plans →
                </a>
              </div>
            </motion.div>

            {/* Right: Dashboard Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative w-full max-w-lg mx-auto lg:max-w-none"
            >
              {/* Browser Frame */}
              <div className="rounded-xl shadow-2xl overflow-hidden border border-gray-800 bg-gray-900">
                {/* Browser Header */}
                <div className="bg-gray-800 px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-gray-700 rounded-md px-4 py-1 text-sm text-gray-400 w-64 text-center">
                      app.huntaze.com/dashboard
                    </div>
                  </div>
                </div>

                {/* Dashboard Content */}
                <div className={`bg-gray-900 ${isMobile ? 'p-4' : 'p-8'}`}>
                  {/* Top Bar */}
                  <div className={`flex items-center justify-between ${isMobile ? 'mb-6' : 'mb-8'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold`}>
                        H
                      </div>
                      <div className={isMobile ? 'flex-1' : ''}>
                        <h3 className={`font-semibold text-white ${isMobile ? 'text-sm' : ''}`}>Welcome back, Sarah</h3>
                        <p className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>Your business is growing 🚀</p>
                      </div>
                    </div>
                    {!isMobile && (
                      <button className="px-4 py-2 text-sm bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                        Create Campaign
                      </button>
                    )}
                  </div>

                  {/* Stats Cards */}
                  <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-4 gap-4'} mb-8`}>
                    <div className={`bg-gray-800 ${isMobile ? 'p-4' : 'p-4'} rounded-xl border border-gray-700`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Revenue</span>
                        <span className="text-xs text-green-400 bg-green-400/20 px-2 py-0.5 rounded-full">+23%</span>
                      </div>
                      <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white`}>$47,298</p>
                      <p className="text-xs text-gray-400 mt-1">This month</p>
                    </div>
                    <div className={`bg-gray-800 ${isMobile ? 'p-4' : 'p-4'} rounded-xl border border-gray-700`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Subscribers</span>
                        <span className="text-xs text-blue-400 bg-blue-400/20 px-2 py-0.5 rounded-full">+18%</span>
                      </div>
                      <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white`}>4,832</p>
                      <p className="text-xs text-gray-400 mt-1">Active users</p>
                    </div>
                    <div className={`bg-gray-800 ${isMobile ? 'p-4' : 'p-4'} rounded-xl border border-gray-700`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Conversion</span>
                        <span className="text-xs text-green-400 bg-green-400/20 px-2 py-0.5 rounded-full">89%</span>
                      </div>
                      <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white`}>89%</p>
                      <p className="text-xs text-gray-400 mt-1">AI success rate</p>
                    </div>
                    <div className={`bg-gray-800 ${isMobile ? 'p-4' : 'p-4'} rounded-xl border border-gray-700`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Messages</span>
                        <span className="text-xs text-orange-400 bg-orange-400/20 px-2 py-0.5 rounded-full">147</span>
                      </div>
                      <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white`}>2,847</p>
                      <p className="text-xs text-gray-400 mt-1">This week</p>
                    </div>
                  </div>

                  {/* Chart Section */}
                  <div className={`bg-gray-800 rounded-xl ${isMobile ? 'p-4' : 'p-6'} border border-gray-700`}>
                    <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'} mb-4`}>
                      <div>
                        <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-white`}>Revenue Overview</h3>
                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-400`}>Your earnings over the last 7 days</p>
                      </div>
                      {!isMobile && (
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                          <span className="text-sm text-gray-400">Live</span>
                        </div>
                      )}
                    </div>
                    
                    <svg viewBox="0 0 800 300" className={`w-full ${isMobile ? 'h-40' : 'h-48'}`}>
                      <defs>
                        <linearGradient id="heroGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Grid lines */}
                      <g stroke="rgba(255,255,255,0.1)">
                        <line x1="0" y1="60" x2="800" y2="60" strokeDasharray="5,5" />
                        <line x1="0" y1="120" x2="800" y2="120" strokeDasharray="5,5" />
                        <line x1="0" y1="180" x2="800" y2="180" strokeDasharray="5,5" />
                        <line x1="0" y1="240" x2="800" y2="240" />
                      </g>
                      
                      {/* Area */}
                      <path 
                        d="M 50,200 Q 150,190 200,170 T 300,130 Q 350,140 400,150 T 500,90 Q 600,70 700,30 L 700,240 L 50,240 Z"
                        fill="url(#heroGradient)"
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
                        <circle cx="700" cy="30" r="6" fill="#8b5cf6" />
                      </g>
                    </svg>

                    <div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center justify-between'} mt-6 pt-6 border-t border-gray-700`}>
                      <div>
                        <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white`}>$36,518</p>
                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-400`}>Total this week</p>
                      </div>
                      <div className={`flex gap-6 ${isMobile ? 'text-xs' : ''}`}>
                        <div>
                          <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-white`}>Best day</p>
                          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-400`}>Sunday • $8,934</p>
                        </div>
                        <div>
                          <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-white`}>Average</p>
                          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-400`}>$5,217/day</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-gray-800 rounded-lg px-4 py-2 shadow-lg hidden lg:block">
                <p className="text-sm font-medium text-white">+147% Growth</p>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-gray-800 rounded-lg px-4 py-2 shadow-lg hidden lg:block">
                <p className="text-sm font-medium text-white">5,000+ Happy Creators</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  )
}