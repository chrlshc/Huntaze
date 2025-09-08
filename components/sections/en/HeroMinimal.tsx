'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HeroMinimal() {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium mb-6"
            >
              <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              5,000+ creators scaling faster
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight tracking-tight"
            >
              Double your revenue.
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                Cut the busywork.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 mt-6 leading-relaxed max-w-xl mx-auto lg:mx-0"
            >
              Unified inbox, AI assistant, revenue analytics — working together from day one.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Link 
                href="/auth" 
                className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all hover:scale-[1.02] text-center shadow-lg shadow-gray-900/20"
              >
                Start free trial
              </Link>
              <Link 
                href="#features" 
                className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold border-2 border-gray-200 hover:border-gray-300 transition-all hover:scale-[1.02] text-center"
              >
                See how it works
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-12 flex items-center justify-center lg:justify-start gap-8"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-600">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-600">Cancel anytime</span>
              </div>
            </motion.div>
          </div>

          {/* Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="relative">
              {/* Browser mockup */}
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                {/* Browser header */}
                <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 bg-red-400 rounded-full" />
                    <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                    <div className="w-3 h-3 bg-green-400 rounded-full" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="bg-gray-100 rounded-lg px-4 py-1 text-xs text-gray-500 font-medium">
                      app.huntaze.com/dashboard
                    </div>
                  </div>
                </div>
                
                {/* Dashboard content */}
                <div className="p-6 bg-gray-50">
                  <div className="space-y-4">
                    {/* Revenue card */}
                    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-900">Today's Revenue</h3>
                        <span className="inline-flex items-center gap-1 text-sm text-green-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          +12.5%
                        </span>
                      </div>
                      <div className="text-3xl font-bold text-gray-900">$2,847</div>
                      <div className="mt-3 h-16 bg-gradient-to-t from-purple-100 to-transparent rounded-lg" />
                    </div>
                    
                    {/* Metrics grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                          <span className="text-xs text-gray-500">+23</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">147</div>
                        <div className="text-xs text-gray-600 mt-1">Messages</div>
                      </div>
                      
                      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                          </div>
                          <span className="text-xs text-gray-500">+82</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">892</div>
                        <div className="text-xs text-gray-600 mt-1">Active Fans</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements for depth */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="absolute -bottom-4 -left-4 bg-white rounded-xl p-3 shadow-lg border border-gray-100"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full" />
                  <div>
                    <div className="text-xs font-semibold text-gray-900">New subscriber!</div>
                    <div className="text-[10px] text-gray-500">Emily just joined</div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="absolute -top-4 -right-4 bg-white rounded-xl p-3 shadow-lg border border-gray-100"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm">💰</span>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-900">Payment received</div>
                    <div className="text-[10px] text-gray-500">$49.99 from Alex</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}