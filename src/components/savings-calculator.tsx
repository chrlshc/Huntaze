'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calculator, TrendingUp } from 'lucide-react'

export default function SavingsCalculator() {
  const [monthlyRevenue, setMonthlyRevenue] = useState(5000)
  const [currentCommission, setCurrentCommission] = useState(20)

  const huntazeCommissions = {
    basic: 5,
    grow: 3,
    advanced: 1.5
  }

  const calculateSavings = (plan: 'basic' | 'grow' | 'advanced') => {
    const huntazeCommission = huntazeCommissions[plan]
    const monthlySavings = (monthlyRevenue * (currentCommission - huntazeCommission)) / 100
    const yearlySavings = monthlySavings * 12
    return { monthlySavings, yearlySavings }
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Calculate your savings with Huntaze</h2>
          <p className="text-xl text-gray-600">See how much you can save compared to your current agency</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Monthly revenue (€)</label>
              <div className="relative">
                <Calculator className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={monthlyRevenue}
                  onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current commission (%)</label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="5"
                  max="50"
                  value={currentCommission}
                  onChange={(e) => setCurrentCommission(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-xl font-bold text-gray-900 w-12">
                  {currentCommission}%
                </span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(huntazeCommissions).map(([plan, commission]) => {
              const { monthlySavings, yearlySavings } = calculateSavings(plan as keyof typeof huntazeCommissions)
              const savingsPercentage = ((currentCommission - commission) / currentCommission) * 100

              return (
                <motion.div
                  key={plan}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-6 rounded-xl ${
                    plan === 'grow' 
                      ? 'bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-300' 
                      : 'bg-gray-50'
                  }`}
                >
                  <h3 className="font-bold text-lg capitalize mb-2">{plan}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Commission: {commission}%
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Per month:</span>
                      <span className="font-bold text-green-600">
                        +{monthlySavings.toFixed(0)}€
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Per year:</span>
                      <span className="font-bold text-green-600 text-lg">
                        +{yearlySavings.toFixed(0)}€
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-sm font-medium text-green-600">
                        {savingsPercentage.toFixed(0)}% savings
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <div className="mt-8 p-4 bg-purple-50 rounded-lg">
            <p className="text-center text-sm text-purple-800">
              💡 <strong>Tip:</strong> With the Grow plan you save {calculateSavings('grow').yearlySavings.toFixed(0)}€ per year —
              that’s like getting {Math.floor(calculateSavings('grow').yearlySavings / 66)} months free!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
