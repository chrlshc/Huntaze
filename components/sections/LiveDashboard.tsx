'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Users, 
  DollarSign, 
  TrendingUp, 
  MessageCircle,
  Settings,
  RefreshCw,
  Sparkles
} from 'lucide-react'

interface DashboardMode {
  mode: 'demo' | 'sandbox'
}

export default function LiveDashboard() {
  const [mode, setMode] = useState<'demo' | 'sandbox'>('demo')
  const [revenue, setRevenue] = useState(47234)
  const [activeChats, setActiveChats] = useState(3421)
  const [avgTransaction, setAvgTransaction] = useState(142)
  const [messages, setMessages] = useState([
    { type: 'subscriber', amount: 49.99, time: 'just now' },
    { type: 'upsell', amount: 199, time: '2 min ago' },
    { type: 'content', amount: 29.99, time: '5 min ago' }
  ])

  // Simulate real-time updates in demo mode
  useEffect(() => {
    if (mode === 'demo') {
      const interval = setInterval(() => {
        setRevenue(prev => prev + Math.floor(Math.random() * 500))
        setActiveChats(prev => prev + Math.floor(Math.random() * 10) - 5)
        
        // Add new message
        const newMessages = [
          { type: 'subscriber', amount: 49.99, time: 'just now' },
          { type: 'tip', amount: Math.floor(Math.random() * 100) + 20, time: 'just now' },
          { type: 'upsell', amount: 199, time: 'just now' },
        ]
        const randomMessage = newMessages[Math.floor(Math.random() * newMessages.length)]
        
        setMessages(prev => [randomMessage, ...prev.slice(0, 2)])
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [mode])

  const handleSandboxAction = (action: string) => {
    if (mode === 'sandbox') {
      switch(action) {
        case 'new-subscriber':
          setRevenue(prev => prev + 49.99)
          setActiveChats(prev => prev + 1)
          setMessages(prev => [
            { type: 'subscriber', amount: 49.99, time: 'just now' },
            ...prev.slice(0, 2)
          ])
          break
        case 'ai-upsell':
          setRevenue(prev => prev + 199)
          setAvgTransaction(prev => Math.round((prev + 199) / 2))
          setMessages(prev => [
            { type: 'upsell', amount: 199, time: 'just now' },
            ...prev.slice(0, 2)
          ])
          break
      }
    }
  }

  return (
    <div className="relative bg-gray-900 rounded-lg shadow-2xl overflow-hidden">
      {/* Mode Badge */}
      <AnimatePresence mode="wait">
        {mode === 'sandbox' && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 right-4 z-20"
          >
            <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Live Sandbox - Try it yourself
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Browser Chrome */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
        </div>
        
        {/* Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode(mode === 'demo' ? 'sandbox' : 'demo')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              mode === 'sandbox' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-7000'
            }`}
          >
            {mode === 'demo' ? 'Try Interactive Mode →' : 'Exit Sandbox'}
          </button>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-800">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <motion.div 
            className="bg-gray-800/50 rounded-lg p-4 backdrop-blur"
            whileHover={{ scale: mode === 'sandbox' ? 1.05 : 1 }}
          >
            <div className="flex items-center justify-between mb-1">
              <DollarSign className="w-5 h-5 text-gray-400" />
              <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              ${revenue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Today's Revenue</div>
            <div className="text-xs text-green-400 mt-1">↑ 23% vs yesterday</div>
          </motion.div>

          <motion.div 
            className="bg-gray-800/50 rounded-lg p-4 backdrop-blur"
            whileHover={{ scale: mode === 'sandbox' ? 1.05 : 1 }}
          >
            <div className="flex items-center justify-between mb-1">
              <MessageCircle className="w-5 h-5 text-gray-400" />
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div className="text-2xl font-bold text-white">{activeChats.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Active Chats</div>
            <div className="text-xs text-purple-400 mt-1">AI handling 94%</div>
          </motion.div>

          <motion.div 
            className="bg-gray-800/50 rounded-lg p-4 backdrop-blur"
            whileHover={{ scale: mode === 'sandbox' ? 1.05 : 1 }}
          >
            <div className="flex items-center justify-between mb-1">
              <TrendingUp className="w-5 h-5 text-gray-400" />
              <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-white">${avgTransaction}</div>
            <div className="text-sm text-gray-400">Avg. Transaction</div>
            <div className="text-xs text-green-400 mt-1">↑ 18% with AI</div>
          </motion.div>
        </div>

        {/* Live Activity Feed */}
        <div className="bg-gray-800/30 rounded-lg p-4 backdrop-blur">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-300">Live Activity</span>
            {mode === 'sandbox' && (
              <span className="text-xs text-green-400">Click actions below to simulate</span>
            )}
          </div>
          
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {messages.map((msg, index) => (
                <motion.div
                  key={`${msg.type}-${index}-${msg.time}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-400">
                    {msg.type === 'subscriber' && 'New subscriber'}
                    {msg.type === 'upsell' && 'AI upsold to VIP'}
                    {msg.type === 'content' && 'Content unlocked'}
                    {msg.type === 'tip' && 'Tip received'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">+${msg.amount}</span>
                    <span className="text-gray-600 dark:text-gray-400 text-xs">{msg.time}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Sandbox Actions */}
          {mode === 'sandbox' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4 pt-4 border-t border-gray-700"
            >
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Simulate actions:</div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSandboxAction('new-subscriber')}
                  className="px-3 py-1.5 bg-gray-900 text-white rounded text-xs hover:bg-gray-800 transition-colors"
                >
                  New Subscriber
                </button>
                <button
                  onClick={() => handleSandboxAction('ai-upsell')}
                  className="px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                >
                  AI Upsell
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
