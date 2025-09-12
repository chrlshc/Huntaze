'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export default function AppPreviewPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Hero Section with Browser Mockup */}
      <section className="relative pt-32 pb-20">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-16">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-6xl md:text-7xl font-bold mb-6"
            >
              Powering the world's best creators.
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-xl text-gray-400 max-w-2xl mx-auto"
            >
              From next-gen influencers to established content creators.
            </motion.p>
          </div>

          {/* Browser Mockup */}
          <motion.div 
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative max-w-[1200px] mx-auto"
          >
            {/* Browser Chrome */}
            <div className="bg-[#1a1a1a] rounded-t-xl border border-gray-800">
              {/* Browser Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
                {/* Traffic Lights */}
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                
                {/* URL Bar */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="bg-black/50 rounded-md px-4 py-1.5 flex items-center gap-2 min-w-[300px]">
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                    </svg>
                    <span className="text-sm text-gray-400">huntaze.app</span>
                  </div>
                </div>

                {/* Browser Actions */}
                <div className="flex gap-2">
                  <button className="p-1 hover:bg-gray-700/50 rounded">
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button className="p-1 hover:bg-gray-700/50 rounded">
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* App Content */}
            <div className="bg-[#0a0a0a] rounded-b-xl border-x border-b border-gray-800 overflow-hidden">
              <div className="relative h-[600px] bg-gradient-to-br from-purple-900/20 to-black">
                {/* Sidebar */}
                <div className="absolute left-0 top-0 bottom-0 w-64 bg-black/50 border-r border-gray-800 p-4">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-8 h-8 rounded bg-purple-600"></div>
                    <span className="font-semibold">Huntaze</span>
                  </div>
                  
                  <nav className="space-y-1">
                    <div className="flex items-center gap-3 px-3 py-2 bg-purple-600/20 rounded-lg text-purple-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span>Dashboard</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 hover:bg-gray-800/50 rounded-lg text-gray-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <span>Inbox</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 hover:bg-gray-800/50 rounded-lg text-gray-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span>Analytics</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 hover:bg-gray-800/50 rounded-lg text-gray-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Earnings</span>
                    </div>
                  </nav>
                </div>

                {/* Main Content Area */}
                <div className="ml-64 p-8">
                  <h2 className="text-2xl font-bold mb-6">Welcome back, Creator</h2>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                      <p className="text-sm text-gray-400 mb-1">Total Revenue</p>
                      <p className="text-2xl font-semibold">$124,583</p>
                      <p className="text-sm text-green-400 mt-2">+23% from last month</p>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                      <p className="text-sm text-gray-400 mb-1">Active Subscribers</p>
                      <p className="text-2xl font-semibold">3,842</p>
                      <p className="text-sm text-green-400 mt-2">+18% from last month</p>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                      <p className="text-sm text-gray-400 mb-1">Messages Today</p>
                      <p className="text-2xl font-semibold">284</p>
                      <p className="text-sm text-purple-400 mt-2">AI handled 92%</p>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
                    <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center">
                            <span className="text-xs">JD</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">New subscription</p>
                            <p className="text-xs text-gray-400">John Doe subscribed to VIP tier</p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-400">2m ago</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-600/20 flex items-center justify-center">
                            <span className="text-xs">AI</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">AI Response Sent</p>
                            <p className="text-xs text-gray-400">Automated reply to 12 messages</p>
                          </div>
                        </div>
                        <span className="text-sm text-gray-400">5m ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Client Logos */}
      <section className="py-20 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 items-center opacity-50">
            <div className="text-2xl font-bold text-center">OnlyFans</div>
            <div className="text-2xl font-bold text-center">Fansly</div>
            <div className="text-2xl font-bold text-center">Instagram</div>
            <div className="text-2xl font-bold text-center">TikTok</div>
            <div className="text-2xl font-bold text-center">Twitter</div>
            <div className="text-2xl font-bold text-center">Reddit</div>
          </div>
        </div>
      </section>
    </div>
  )
}