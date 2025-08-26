'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Shield, CreditCard, Settings, LogOut } from 'lucide-react'
import PremiumButton from '@/components/premium-button'

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link 
          href="/" 
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8">
            Account Settings
          </h1>

          {/* Profile Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Profile Information
              </h2>
              <PremiumButton size="sm" variant="secondary">
                Edit Profile
              </PremiumButton>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">@sarahcreator</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900 dark:text-white">sarah@example.com</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Subscription
              </h2>
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium">
                PRO Plan
              </span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg mb-4">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">PRO Plan</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">$49/month</p>
                </div>
              </div>
              <Link href="/pricing">
                <PremiumButton size="sm">
                  Manage Plan
                </PremiumButton>
              </Link>
            </div>
            
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <CreditCard className="w-4 h-4" />
              <span>Next billing date: January 1, 2025</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">Account Settings</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">Sign Out</span>
            </motion.button>
          </div>

          {/* Support Card */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Need help with your account?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Our support team is here to assist you 24/7
            </p>
            <Link href="/support">
              <PremiumButton size="sm">
                Contact Support
              </PremiumButton>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}