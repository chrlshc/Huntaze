'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, Building, Users, DollarSign, Target } from 'lucide-react'

interface ContactSalesModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ContactSalesModal({ isOpen, onClose }: ContactSalesModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    monthlyRevenue: '',
    currentPainPoint: '',
    teamSize: '',
    timeline: ''
  })

  const [step, setStep] = useState(1)

  const monthlyRevenueOptions = [
    { value: '10-50k', label: '$10K - $50K/month' },
    { value: '50-200k', label: '$50K - $200K/month' },
    { value: '200k-500k', label: '$200K - $500K/month' },
    { value: '500k+', label: '$500K+/month' }
  ]

  const painPointOptions = [
    { value: 'overwhelmed-messages', label: "Can't keep up with messages", icon: Users },
    { value: 'working-too-much', label: 'Spending 60+ hours/week on admin', icon: DollarSign },
    { value: 'refuse-hire', label: 'Want to scale but refuse to hire', icon: Building },
    { value: 'missing-revenue', label: 'Missing revenue from slow responses', icon: Target }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Route to appropriate sales team based on revenue
    const routing = formData.monthlyRevenue === '1m+' ? 'enterprise-team' : 
                   formData.monthlyRevenue === '200k-1m' ? 'scale-team' : 'growth-team'
    
    // Submit form with routing
    const payload = {
      ...formData,
      routing,
      source: 'enterprise-landing',
      timestamp: new Date().toISOString()
    }
    
    console.log('Submitting to sales team:', payload)
    // TODO: Actual API call
    
    // Show success state
    setStep(3)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  {step === 1 && 'Tell us about your business'}
                  {step === 2 && 'How can we help?'}
                  {step === 3 && 'Thank you!'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {/* Form Content */}
              <form onSubmit={handleSubmit} className="p-6">
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    {/* Email & Company */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Work Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Creator Name / Brand
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                        placeholder="Your creator name or brand"
                      />
                    </div>
                    
                    {/* Monthly Revenue - Key Qualifier */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monthly Revenue *
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {monthlyRevenueOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, monthlyRevenue: option.value })}
                            className={`
                              p-4 border rounded-lg text-left transition-all
                              ${formData.monthlyRevenue === option.value
                                ? 'border-purple-600 bg-purple-50 text-purple-900'
                                : 'border-gray-300 hover:border-gray-400'
                              }
                            `}
                          >
                            <div className="font-medium">{option.label}</div>
                            {option.value === '1m+' && (
                              <div className="text-xs text-purple-600 mt-1">Enterprise Plan</div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Continue Button */}
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.monthlyRevenue}
                      className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </motion.div>
                )}
                
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    {/* Current Pain Point */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        What's your biggest challenge right now? *
                      </label>
                      <div className="space-y-3">
                        {painPointOptions.map((option) => {
                          const Icon = option.icon
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setFormData({ ...formData, currentPainPoint: option.value })}
                              className={`
                                w-full p-4 border rounded-lg text-left transition-all flex items-center gap-4
                                ${formData.currentPainPoint === option.value
                                  ? 'border-purple-600 bg-purple-50'
                                  : 'border-gray-300 hover:border-gray-400'
                                }
                              `}
                            >
                              <Icon className="w-6 h-6 text-purple-600" />
                              <div>
                                <div className="font-medium text-gray-900">{option.label}</div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    
                    {/* Current Setup */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Setup
                      </label>
                      <select
                        value={formData.teamSize}
                        onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      >
                        <option value="">Select your setup</option>
                        <option value="solo">Just me, no help</option>
                        <option value="part-time-va">One part-time VA</option>
                        <option value="doing-everything">Trying to do everything myself</option>
                        <option value="burning-out">Burning out from workload</option>
                      </select>
                    </div>
                    
                    {/* Timeline */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        When are you looking to get started?
                      </label>
                      <select
                        value={formData.timeline}
                        onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      >
                        <option value="">Select timeline</option>
                        <option value="asap">ASAP</option>
                        <option value="month">Within a month</option>
                        <option value="quarter">Within 3 months</option>
                        <option value="evaluating">Just evaluating</option>
                      </select>
                    </div>
                    
                    {/* Submit Button */}
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={!formData.currentPainPoint}
                        className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Submit & Book a Call
                      </button>
                    </div>
                  </motion.div>
                )}
                
                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Perfect! We'll be in touch within 24 hours.
                    </h3>
                    <p className="text-gray-600 mb-8">
                      {formData.monthlyRevenue === '1m+' 
                        ? 'Your dedicated enterprise account executive will reach out to schedule a call.'
                        : 'Our sales team will contact you to discuss your specific needs.'
                      }
                    </p>
                    <button
                      onClick={onClose}
                      className="px-8 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                    >
                      Close
                    </button>
                  </motion.div>
                )}
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}