'use client'

import { motion } from 'framer-motion'
import { MessageSquare, TrendingUp, Users, DollarSign, BarChart3, Zap } from 'lucide-react'
import DashboardStats from './dashboard-stats'
import RevenueGrowthChart from './revenue-growth-chart'

export function DashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative"
    >
      {/* Browser Frame */}
      <div className="bg-gray-900 rounded-t-xl p-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="flex-1 bg-gray-800 rounded-md px-3 py-1 text-xs text-gray-400">
            app.huntaze.com/dashboard
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-b-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Dashboard</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back, Sarah</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
                Live
              </span>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-6">
          <DashboardStats />
        </div>

        {/* Revenue Chart */}
        <div className="px-6 pb-6">
          <RevenueGrowthChart />
        </div>

        {/* Original Stats Grid - Hidden */}
        <div className="hidden grid-cols-4 gap-6 p-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <span className="text-xs text-green-600 font-medium">+285%</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">$47,829</p>
            <p className="text-xs text-gray-600">Monthly Revenue</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-xs text-green-600 font-medium">+142</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">2,847</p>
            <p className="text-xs text-gray-600">Active Fans</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-5 h-5 text-green-600" />
              <span className="text-xs text-purple-600 font-medium">AI</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">1,243</p>
            <p className="text-xs text-gray-600">Messages/Day</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-5 h-5 text-pink-600" />
              <span className="text-xs text-gray-600">Rate</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">78%</p>
            <p className="text-xs text-gray-600">Conversion</p>
          </motion.div>
        </div>

        {/* Chart Area */}
        <div className="px-6 pb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 h-64 relative overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="absolute inset-0 bg-gradient-to-t from-purple-100/50 to-transparent"></div>
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="revenue-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#9333ea" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#9333ea" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <path
                d="M0,200 C50,180 100,140 150,120 C200,100 250,60 300,40 C350,20 400,10 450,5 L450,250 L0,250 Z"
                fill="url(#revenue-gradient)"
                className="animate-pulse"
              />
            </svg>
            <div className="relative z-10">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Revenue Growth</h4>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">$142,847</span>
                <span className="text-sm text-green-600 dark:text-green-700">+23% this week</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function ChatInterfaceMockup() {
  const messages = [
    { role: 'fan', content: 'Hey beautiful! How are you today?' },
    { role: 'ai', content: 'Hi love! I\'m having an amazing day, thanks for asking! Just finished a new photoshoot that I think you\'ll absolutely love. Want a sneak peek?' },
    { role: 'fan', content: 'Yes please! I\'d love to see!' },
    { role: 'ai', content: 'I knew you would! I have this exclusive set just for my special fans. It\'s only $15 for 20+ HD photos. Trust me, you won\'t regret it!' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-900 rounded-2xl p-1 shadow-2xl"
    >
      <div className="bg-white rounded-2xl overflow-hidden">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full backdrop-blur-sm"></div>
              <div>
                <h4 className="text-white font-semibold">AI Assistant</h4>
                <p className="text-xs text-purple-100">Responding as Sarah</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-xs text-white">Active</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="p-4 space-y-3 h-96 overflow-y-auto bg-gray-50 dark:bg-black">
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex ${message.role === 'ai' ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                message.role === 'ai' 
                  ? 'bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-100 rounded-tl-sm border border-purple-200 dark:border-purple-900' 
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tr-sm'
              }`}>
                <p className="text-sm">{message.content}</p>
              </div>
            </motion.div>
          ))}
          
          {/* AI Indicator */}
          <div className="flex items-center justify-center gap-2 py-2">
            <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs text-gray-500 dark:text-gray-300">AI is handling this conversation</span>
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-950">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="AI will respond here..."
              className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-900 rounded-full text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              disabled
            />
            <button className="p-2 bg-purple-600 text-white rounded-full">
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function AnalyticsMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-white rounded-xl shadow-xl border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Fan Analytics</h3>
        <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
          View Details →
        </button>
      </div>

      {/* Top Fans List */}
      <div className="space-y-3">
        {[
          { name: 'BigSpender92', spent: '$2,847', messages: 156, status: 'VIP' },
          { name: 'LoyalFan23', spent: '$1,923', messages: 243, status: 'Regular' },
          { name: 'NewbieLover', spent: '$567', messages: 89, status: 'New' },
        ].map((fan, index) => (
          <motion.div
            key={fan.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full"></div>
              <div>
                <p className="font-medium text-gray-900">{fan.name}</p>
                <p className="text-xs text-gray-500">{fan.messages} messages</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">{fan.spent}</p>
              <span className={`text-xs px-2 py-1 rounded-full ${
                fan.status === 'VIP' 
                  ? 'bg-purple-100 text-purple-700' 
                  : fan.status === 'New'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {fan.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">87%</p>
          <p className="text-xs text-gray-600">Retention Rate</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">$47</p>
          <p className="text-xs text-gray-600">Avg. Tip Size</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">2.3x</p>
          <p className="text-xs text-gray-600">PPV Conv. Rate</p>
        </div>
      </div>
    </motion.div>
  )
}