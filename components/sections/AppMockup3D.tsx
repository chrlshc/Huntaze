'use client'

import { motion } from 'framer-motion'

export default function AppMockup3D() {
  return (
    <section className="relative py-16 overflow-hidden bg-black">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* 3D Perspective Container */}
        <div className="relative perspective-[2000px]">
          <motion.div 
            initial={{ opacity: 0, rotateX: -15, rotateY: 15, scale: 0.9 }}
            animate={{ opacity: 1, rotateX: -15, rotateY: 25, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            whileHover={{ rotateX: -10, rotateY: 20, transition: { duration: 0.3 } }}
            className="relative transform-gpu"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Glow Effect */}
            <div className="absolute -inset-20 bg-purple-600/20 blur-[100px] rounded-full"></div>
            
            {/* Browser Mockup */}
            <div className="relative bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-800/50 overflow-hidden">
              {/* Browser Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800/50 bg-[#1a1a1a]">
                {/* Traffic Lights */}
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                
                {/* URL Bar */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="bg-black/30 backdrop-blur rounded-md px-4 py-1.5 flex items-center gap-2 min-w-[300px]">
                    <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                    </svg>
                    <span className="text-sm text-gray-400">huntaze.app</span>
                  </div>
                </div>
              </div>

              {/* App Content */}
              <div className="bg-[#0a0a0a] h-[700px] relative overflow-hidden">
                {/* Sidebar */}
                <div className="absolute left-0 top-0 bottom-0 w-64 bg-black/70 backdrop-blur border-r border-gray-800/50 p-4">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">H</span>
                    </div>
                    <span className="font-semibold text-white">Huntaze</span>
                  </div>
                  
                  <nav className="space-y-1">
                    <div className="flex items-center gap-3 px-3 py-2.5 bg-purple-600/10 rounded-lg text-purple-400 border border-purple-600/20">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span>Dashboard</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800/50 rounded-lg text-gray-400 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <span className="flex items-center gap-2">
                        Inbox
                        <span className="bg-purple-600 dark:bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full">24</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800/50 rounded-lg text-gray-400 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>Analytics</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800/50 rounded-lg text-gray-400 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Revenue</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800/50 rounded-lg text-gray-400 transition-colors">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>Subscribers</span>
                    </div>
                  </nav>
                </div>

                {/* Main Content Area */}
                <div className="ml-64 p-8">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-1">Welcome back, Sarah</h2>
                      <p className="text-gray-400">Here's what's happening with your content today</p>
                    </div>
                    <button className="bg-purple-600 dark:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors">
                      Create Post
                    </button>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-6 mb-8">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-gray-900/50 backdrop-blur rounded-xl p-6 border border-gray-800/50"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-gray-400">Total Revenue</p>
                        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <p className="text-3xl font-bold text-white mb-1">$147,298</p>
                      <p className="text-sm text-green-400">+23.5% from last month</p>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gray-900/50 backdrop-blur rounded-xl p-6 border border-gray-800/50"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-gray-400">Active Subscribers</p>
                        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <p className="text-3xl font-bold text-white mb-1">4,832</p>
                      <p className="text-sm text-green-400">+18.2% from last month</p>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-gray-900/50 backdrop-blur rounded-xl p-6 border border-gray-800/50"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-gray-400">Messages Today</p>
                        <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <p className="text-3xl font-bold text-white mb-1">342</p>
                      <p className="text-sm text-purple-400">AI handled 89%</p>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-gray-900/50 backdrop-blur rounded-xl p-6 border border-gray-800/50"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-gray-400">Conversion Rate</p>
                        <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <p className="text-3xl font-bold text-white mb-1">28.4%</p>
                      <p className="text-sm text-green-400">+5.2% from last week</p>
                    </motion.div>
                  </div>

                  {/* Chart Area */}
                  <div className="bg-gray-900/50 backdrop-blur rounded-xl p-6 border border-gray-800/50">
                    <h3 className="text-lg font-semibold text-white mb-4">Revenue Overview</h3>
                    <div className="h-64 flex items-center justify-center">
                      {/* Placeholder for chart */}
                      <div className="text-gray-500 dark:text-gray-400">
                        <svg className="w-full h-full" viewBox="0 0 400 200">
                          <path
                            d="M 0,150 C 50,140 100,120 150,100 C 200,80 250,90 300,70 C 350,50 400,60 400,40"
                            fill="none"
                            stroke="url(#gradient)"
                            strokeWidth="3"
                          />
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#8B5CF6" />
                              <stop offset="100%" stopColor="#EC4899" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shadow for depth */}
            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 w-3/4 h-20 bg-purple-600/10 blur-3xl"></div>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        .perspective-\\[2000px\\] {
          perspective: 2000px;
        }
      `}</style>
    </section>
  )
}