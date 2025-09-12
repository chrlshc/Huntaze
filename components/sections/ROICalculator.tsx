'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Users, Clock, TrendingUp, Download, ArrowRight } from 'lucide-react'

export default function ROICalculator() {
  const [activeFans, setActiveFans] = useState(1000)
  const [avgSpend, setAvgSpend] = useState(50)
  const [hoursPerWeek, setHoursPerWeek] = useState(40)
  const [hasVA, setHasVA] = useState(true)
  const [plan, setPlan] = useState<'starter' | 'pro' | 'scale' | 'enterprise'>('pro')
  const [showDetails, setShowDetails] = useState(false)

  // Calculate ROI metrics - Creator specific
  const currentRevenue = activeFans * avgSpend
  const potentialRevenue = currentRevenue * 3.12 // 312% average increase (gross)
  // Performance-based fee by plan
  const feePctMap = { starter: 9, pro: 7, scale: 5, enterprise: 2 } as const
  const feePct = feePctMap[plan]
  const monthlyHuntazeFee = Math.round(potentialRevenue * (feePct / 100))
  const netPotentialRevenue = potentialRevenue - monthlyHuntazeFee
  const revenueIncrease = netPotentialRevenue - currentRevenue
  const timeSaved = Math.min(hoursPerWeek * 0.85, 35) // 85% time saved, max 35 hours
  const conversationsHandled = activeFans * 12 // Avg 12 conversations per fan per month
  const aiHandledPercentage = 94

  // VA costs eliminated
  const currentVACost = hasVA ? hoursPerWeek * 20 * 4 : 0 // $20/hr VA
  const monthlySavings = currentVACost // No more VA needed
  
  // Annual projections
  const annualRevenueIncrease = revenueIncrease * 12
  const annualTimeSaved = timeSaved * 52
  const annualVASavings = monthlySavings * 12
  const totalAnnualBenefit = annualRevenueIncrease + annualVASavings

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="py-20 bg-gradient-to-br from-purple-50 via-white to-pink-50"
    >
      <div className="max-w-7xl mx-auto px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Your Solo Creator Economics
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Includes Huntaze performance fee by plan (9% → 2%)
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Calculator Inputs */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg"
          >
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              Your Current Situation
            </h3>

            {/* Plan Selection */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="text-gray-700 dark:text-gray-300 font-medium">
                  Your Huntaze plan (affects fee)
                </label>
                <span className="text-sm text-gray-500 dark:text-gray-400">{feePct}% fee</span>
              </div>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              >
                <option value="starter">Starter (9%)</option>
                <option value="pro">Pro (7%)</option>
                <option value="scale">Scale (5%)</option>
                <option value="enterprise">Enterprise (2%)</option>
              </select>
            </div>
            
            {/* Active Fans Slider */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Current Active Fans
                </label>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeFans.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="10000"
                step="100"
                value={activeFans}
                onChange={(e) => setActiveFans(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2">
                <span>100</span>
                <span>10,000</span>
              </div>
            </div>

            {/* Average Spend Slider */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  Average Spend per Fan (Monthly)
                </label>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${avgSpend}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={avgSpend}
                onChange={(e) => setAvgSpend(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2">
                <span>$10</span>
                <span>$500</span>
              </div>
            </div>

            {/* Hours per Week */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  Hours Spent on Messaging/Week
                </label>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {hoursPerWeek}h
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                step="5"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2">
                <span>5h</span>
                <span>80h</span>
              </div>
            </div>

            {/* VA Toggle */}
            <div className="mb-8">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={hasVA}
                  onChange={(e) => setHasVA(e.target.checked)}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  I currently have a VA or team
                </span>
              </label>
            </div>

            {/* Current Stats */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Your current monthly revenue</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                ${currentRevenue.toLocaleString()}
              </div>
              {hasVA && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  VA costs: ${currentVACost.toLocaleString()}/month
                </div>
              )}
            </div>
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Main Result Card */}
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl p-8 shadow-xl">
              <h3 className="text-2xl font-semibold mb-6">
                Your Potential with Huntaze
              </h3>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <div className="text-sm opacity-80 mb-1">Potential Monthly Revenue (net)</div>
                  <div className="text-4xl font-bold">${netPotentialRevenue.toLocaleString()}</div>
                  <div className="text-sm text-green-300 mt-1">
                    +${revenueIncrease.toLocaleString()}/month after fee
                  </div>
                </div>
                <div>
                  <div className="text-sm opacity-80 mb-1">Time Saved Weekly</div>
                  <div className="text-4xl font-bold">{timeSaved.toFixed(0)}h</div>
                  <div className="text-sm text-green-300 mt-1">
                    {((timeSaved / hoursPerWeek) * 100).toFixed(0)}% automated
                  </div>
                </div>
              </div>

              {/* Fee transparency */}
              <div className="rounded-lg bg-white/15 p-4 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Estimated Huntaze fee ({feePct}% of projected revenue)</span>
                  <span className="font-semibold">${monthlyHuntazeFee.toLocaleString()}/mo</span>
                </div>
              </div>

              <div className="border-t border-white/20 pt-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm">Annual Revenue Increase (net)</span>
                  <span className="text-2xl font-bold">+${Math.max(0, Math.round(annualRevenueIncrease)).toLocaleString()}</span>
                </div>
                {hasVA && (
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm">VA Costs Eliminated</span>
                    <span className="text-2xl font-bold">${annualVASavings.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-white/20 pt-3">
                  <span className="text-sm font-semibold">Total Annual Benefit</span>
                  <span className="text-2xl font-bold">${totalAnnualBenefit.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md"
              >
                <TrendingUp className="w-8 h-8 text-purple-600 mb-3" />
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Revenue Growth</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">312%</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Average increase</div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md"
              >
                <Users className="w-8 h-8 text-purple-600 mb-3" />
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Conversations/Month</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{conversationsHandled.toLocaleString()}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{aiHandledPercentage}% AI handled</div>
              </motion.div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setShowDetails(true)}
                className="w-full py-4 bg-purple-600 dark:bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              >
                Get Detailed ROI Report
                <Download className="w-5 h-5" />
              </button>
              
              <button className="w-full py-4 bg-white dark:bg-gray-800 text-purple-600 border-2 border-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center justify-center gap-2">
                Schedule ROI Consultation
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400 max-w-3xl mx-auto">
          * Based on average performance metrics from 15,000+ creators using Huntaze. 
          Individual results may vary. Calculations include Huntaze performance fee based on your selected plan, plus time and VA savings.
        </div>
      </div>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          background: #7C3AED;
          cursor: pointer;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider-thumb::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: #7C3AED;
          cursor: pointer;
          border-radius: 50%;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </motion.section>
  )
}
