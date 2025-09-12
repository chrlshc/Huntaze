'use client'

import React from 'react'
import { motion } from 'framer-motion'
import LinearHeader from '@/components/LinearHeader'

export default function PerformancePage() {
  return (
    <>
      <LinearHeader />
      <section className="relative min-h-screen bg-black">
        <div className="container mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-16">
          
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-5xl mx-auto mb-20"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Built for speed,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                designed to scale
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-white/60 max-w-3xl mx-auto">
              Handle millions of messages, thousands of fans, and hundreds of campaigns 
              without breaking a sweat. Enterprise performance at creator prices.
            </p>
          </motion.div>

          {/* Performance Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto mb-20"
          >
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-white mb-2">99.99%</div>
              <p className="text-white/60">Uptime SLA</p>
              <p className="text-sm text-white/40 mt-2">Zero downtime in 2 years</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-white mb-2">50ms</div>
              <p className="text-white/60">Response time</p>
              <p className="text-sm text-white/40 mt-2">Lightning fast globally</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-white mb-2">10M+</div>
              <p className="text-white/60">Messages/day</p>
              <p className="text-sm text-white/40 mt-2">Handles any volume</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-white mb-2">∞</div>
              <p className="text-white/60">Scalability</p>
              <p className="text-sm text-white/40 mt-2">No limits on growth</p>
            </div>
          </motion.div>

          {/* Infrastructure Features */}
          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto mb-20">
            
            {/* Global Infrastructure */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl font-bold text-white mb-4">Global Infrastructure</h2>
                <p className="text-white/60 mb-8">
                  Distributed across 30+ data centers worldwide for maximum speed and reliability.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Edge Computing</h3>
                    <p className="text-white/60">
                      Process data closest to your fans for instant responses anywhere in the world.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Military-Grade Security</h3>
                    <p className="text-white/60">
                      End-to-end encryption, DDoS protection, and continuous security monitoring.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Auto-Scaling</h3>
                    <p className="text-white/60">
                      Automatically scales to handle traffic spikes without any action needed from you.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Real-time Monitoring */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Live System Status</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80">API Response Time</span>
                    <span className="text-green-500 text-sm font-medium">Excellent</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80">Server Load</span>
                    <span className="text-green-500 text-sm font-medium">23%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '23%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80">Memory Usage</span>
                    <span className="text-green-500 text-sm font-medium">41%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '41%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80">Network Latency</span>
                    <span className="text-green-500 text-sm font-medium">12ms</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/30 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">47</p>
                  <p className="text-white/60 text-sm">Active regions</p>
                </div>
                <div className="bg-black/30 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-white">0</p>
                  <p className="text-white/60 text-sm">Incidents today</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Technology Stack */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-6xl mx-auto mb-20"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">
                Enterprise-grade technology stack
              </h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                Built with the same tools that power the world's largest platforms.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 text-center hover:border-purple-600/50 transition-all">
                <div className="text-3xl mb-3">⚡</div>
                <h4 className="text-white font-semibold mb-1">Next.js 14</h4>
                <p className="text-white/60 text-sm">React framework</p>
              </div>
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 text-center hover:border-purple-600/50 transition-all">
                <div className="text-3xl mb-3">🚀</div>
                <h4 className="text-white font-semibold mb-1">Vercel Edge</h4>
                <p className="text-white/60 text-sm">Global deployment</p>
              </div>
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 text-center hover:border-purple-600/50 transition-all">
                <div className="text-3xl mb-3">🗄️</div>
                <h4 className="text-white font-semibold mb-1">PostgreSQL</h4>
                <p className="text-white/60 text-sm">Database</p>
              </div>
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 text-center hover:border-purple-600/50 transition-all">
                <div className="text-3xl mb-3">🔄</div>
                <h4 className="text-white font-semibold mb-1">Redis</h4>
                <p className="text-white/60 text-sm">Caching layer</p>
              </div>
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 text-center hover:border-purple-600/50 transition-all">
                <div className="text-3xl mb-3">🤖</div>
                <h4 className="text-white font-semibold mb-1">GPT-4</h4>
                <p className="text-white/60 text-sm">AI engine</p>
              </div>
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 text-center hover:border-purple-600/50 transition-all">
                <div className="text-3xl mb-3">📦</div>
                <h4 className="text-white font-semibold mb-1">Docker</h4>
                <p className="text-white/60 text-sm">Containerization</p>
              </div>
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 text-center hover:border-purple-600/50 transition-all">
                <div className="text-3xl mb-3">☸️</div>
                <h4 className="text-white font-semibold mb-1">Kubernetes</h4>
                <p className="text-white/60 text-sm">Orchestration</p>
              </div>
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 text-center hover:border-purple-600/50 transition-all">
                <div className="text-3xl mb-3">📊</div>
                <h4 className="text-white font-semibold mb-1">Grafana</h4>
                <p className="text-white/60 text-sm">Monitoring</p>
              </div>
            </div>
          </motion.div>

          {/* Compliance & Certifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 rounded-3xl p-8 sm:p-12 backdrop-blur-sm border border-purple-600/30 max-w-5xl mx-auto mb-16"
          >
            <h3 className="text-2xl font-bold text-white text-center mb-8">
              Compliance & Certifications
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-2">🔒</div>
                <p className="text-white font-semibold">SOC 2 Type II</p>
                <p className="text-white/60 text-sm">Security certified</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🛡️</div>
                <p className="text-white font-semibold">ISO 27001</p>
                <p className="text-white/60 text-sm">Information security</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🏛️</div>
                <p className="text-white font-semibold">GDPR</p>
                <p className="text-white/60 text-sm">Privacy compliant</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">💳</div>
                <p className="text-white font-semibold">PCI DSS</p>
                <p className="text-white/60 text-sm">Payment security</p>
              </div>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Experience the difference
            </h2>
            <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
              See why top creators trust our platform to handle their most critical business operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/signup"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
              >
                Start free trial
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
              <a
                href="/docs"
                className="inline-flex items-center px-8 py-4 border border-white/20 text-white font-medium rounded-xl hover:bg-white/10 transition-colors"
              >
                Technical docs
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}

