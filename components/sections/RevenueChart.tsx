'use client'

import React from 'react'
import { motion } from 'framer-motion'

export default function RevenueChart() {
  const data = [
    { day: 'Mon', revenue: 2847, height: 35 },
    { day: 'Tue', revenue: 3256, height: 45 },
    { day: 'Wed', revenue: 4187, height: 55 },
    { day: 'Thu', revenue: 3892, height: 50 },
    { day: 'Fri', revenue: 5234, height: 70 },
    { day: 'Sat', revenue: 6812, height: 85 },
    { day: 'Sun', revenue: 8934, height: 100 },
  ]

  return (
    <div className="w-full max-w-4xl mx-auto p-8 bg-black rounded-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Revenue Growth</h2>
          <p className="text-white/60">Your earnings are on fire this week 🔥</p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold text-white">$36,518</p>
          <p className="text-green-400 font-semibold">+147% vs last week</p>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative h-80 bg-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/10">
        {/* Grid lines */}
        <div className="absolute inset-x-8 top-8 bottom-16 flex flex-col justify-between pointer-events-none">
          {[10, 8, 6, 4, 2, 0].map((value) => (
            <div key={value} className="flex items-center">
              <span className="text-xs text-white/40 -ml-12 w-8 text-right">${value}k</span>
              <div className="w-full h-px bg-white/10 ml-4" />
            </div>
          ))}
        </div>

        {/* Bars */}
        <div className="relative h-full flex items-end justify-between gap-4 pb-8">
          {data.map((item, index) => (
            <motion.div
              key={item.day}
              className="flex-1 flex flex-col items-center justify-end"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              {/* Bar */}
              <motion.div
                className="w-full relative group cursor-pointer"
                initial={{ height: 0 }}
                animate={{ height: `${item.height}%` }}
                transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
              >
                {/* Gradient bar */}
                <div className="absolute inset-0 rounded-t-xl bg-gradient-to-t from-violet-600 to-pink-500 opacity-90 group-hover:opacity-100 transition-opacity" />
                
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-t-xl bg-gradient-to-t from-violet-600/50 to-pink-500/50 blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
                
                {/* Revenue amount on hover */}
                <motion.div
                  className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  whileHover={{ y: -4 }}
                >
                  <span className="text-white font-semibold text-sm">${item.revenue.toLocaleString()}</span>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black/90 rotate-45" />
                </motion.div>
              </motion.div>

              {/* Day label */}
              <span className="text-white/60 text-sm mt-3">{item.day}</span>
            </motion.div>
          ))}
        </div>

        {/* Trend line overlay */}
        <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 400 200">
          <motion.path
            d="M 50,140 L 100,120 L 150,100 L 200,110 L 250,80 L 300,50 L 350,20"
            fill="none"
            stroke="url(#gradient-line)"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          <defs>
            <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>
          
          {/* Animated dots */}
          {[50, 100, 150, 200, 250, 300, 350].map((x, i) => (
            <motion.circle
              key={x}
              cx={x}
              cy={140 - i * 20}
              r="5"
              fill="#fff"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
            />
          ))}
        </svg>

        {/* Live indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400"></span>
          </span>
          <span className="text-xs text-white/60">Live data</span>
        </div>
      </div>

      {/* Stats cards below */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <motion.div 
          className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <p className="text-white/70 text-sm mb-1">Daily Average</p>
          <p className="text-2xl font-bold text-white">$5,217</p>
          <p className="text-purple-400 text-xs mt-1">↑ 23% growth</p>
        </motion.div>
        
        <motion.div 
          className="bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-xl p-4 border border-blue-500/30"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <p className="text-white/70 text-sm mb-1">Best Day</p>
          <p className="text-2xl font-bold text-white">$8,934</p>
          <p className="text-green-400 text-xs mt-1">Sunday peak</p>
        </motion.div>
        
        <motion.div 
          className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <p className="text-white/70 text-sm mb-1">Conversions</p>
          <p className="text-2xl font-bold text-white">342</p>
          <p className="text-orange-400 text-xs mt-1">89% AI-driven</p>
        </motion.div>
        
        <motion.div 
          className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl p-4 border border-pink-500/30"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <p className="text-white/70 text-sm mb-1">Projection</p>
          <p className="text-2xl font-bold text-white">$147k</p>
          <p className="text-pink-400 text-xs mt-1">Monthly target</p>
        </motion.div>
      </div>
    </div>
  )
}