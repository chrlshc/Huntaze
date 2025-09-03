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
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-b-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/80 border-b border-gray-200 dark:border-gray-600 p-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Revenue Dashboard</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Welcome back, Sarah • Last login 2 hours ago</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-full font-semibold flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Live
              </span>
              <button className="px-6 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-all hover:shadow-lg hover:scale-105">
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-8 bg-gray-50/50 dark:bg-gray-800/30">
          <DashboardStats />
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
        <div className="p-8 pt-0">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-2xl p-8 h-80 relative overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-t from-purple-100/50 to-transparent dark:from-purple-900/20"></div>
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
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Revenue Growth</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Last 7 days performance</p>
                </div>
                <select className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 font-medium">
                  <option>7 Days</option>
                  <option>30 Days</option>
                  <option>90 Days</option>
                </select>
              </div>
              <div className="flex items-baseline gap-3 ml-4">
                <span className="text-5xl font-black text-gray-900 dark:text-white">$142,847</span>
                <span className="text-lg text-green-600 dark:text-green-400 font-bold bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-lg">
                  ↑ 23%
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Compared to $116,294 last week</p>
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
        {/* Chat Header (neutral) */}
        <div className="bg-white border-b border-gray-200 p-4 dark:bg-gray-900 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
              <div>
                <h4 className="text-gray-900 dark:text-white font-semibold">AI Assistant</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Responding as Sarah</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-xs text-gray-700 dark:text-gray-300">Active</span>
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
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div className="bg-gray-50 dark:bg-gray-900 p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Fan Analytics</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Track your top performing fans</p>
          </div>
          <button className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 px-4 py-2 rounded-lg transition-all hover:bg-purple-200 dark:hover:bg-purple-900/50">
            View Details 
            <span className="text-lg">→</span>
          </button>
        </div>
      </div>

      {/* Top Fans List */}
      <div className="p-6 space-y-4">
        {[
          { name: 'BigSpender92', spent: '$2,847', messages: 156, status: 'VIP', growth: '+42%' },
          { name: 'LoyalFan23', spent: '$1,923', messages: 243, status: 'Regular', growth: '+18%' },
          { name: 'NewbieLover', spent: '$567', messages: 89, status: 'New', growth: 'New' },
        ].map((fan, index) => (
          <motion.div
            key={fan.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all hover:shadow-md border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-base">{fan.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{fan.messages} messages</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-xl text-gray-900 dark:text-white">{fan.spent}</p>
                <span className={`text-xs font-semibold ${
                  fan.growth === 'New' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'
                }`}>
                  {fan.growth}
                </span>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                fan.status === 'VIP' 
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' 
                  : fan.status === 'New'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}>
                {fan.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 p-6 pt-0">
        <div className="p-4 rounded-xl text-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <p className="text-3xl font-black text-gray-900 dark:text-white">87%</p>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">Retention Rate</p>
        </div>
        <div className="p-4 rounded-xl text-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <p className="text-3xl font-black text-gray-900 dark:text-white">$47</p>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">Avg. Tip Size</p>
        </div>
        <div className="p-4 rounded-xl text-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <p className="text-3xl font-black text-gray-900 dark:text-white">2.3x</p>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">PPV Conv. Rate</p>
        </div>
      </div>
    </motion.div>
  )
}
