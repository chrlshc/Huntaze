'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, CheckCircle, RefreshCw } from 'lucide-react';

export default function SecuritySimplified() {
  return (
    <section className="py-20 px-4 bg-black">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-full border border-green-500/20 mb-6">
            <Shield className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-green-400">Enterprise Security</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Your content. Always secure.
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-6">
            As a creator, your reputation depends on trust. We apply the same security 
            standards as banks and give you full control over your data.
          </p>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* How We Protect Your Data */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gray-900/50 rounded-2xl p-8 border border-gray-800"
          >
            <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <Lock className="w-8 h-8 text-green-400" />
              How we protect your data
            </h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-white mb-2">End-to-end encryption</h4>
                  <p className="text-gray-400">
                    Your content is encrypted during storage and transfer, just like online banking
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-white mb-2">Automatic anonymization</h4>
                  <p className="text-gray-400">
                    AI learns from patterns, not personal data. Your identity stays private
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-white mb-2">Regular security checks</h4>
                  <p className="text-gray-400">
                    Independent experts test our security quarterly, just like major banks
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-white mb-2">Instant data deletion</h4>
                  <p className="text-gray-400">
                    Delete your data anytime with one click. No questions, no delays
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Compliance & Audits */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gray-900/50 rounded-2xl p-8 border border-gray-800"
          >
            <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <RefreshCw className="w-8 h-8 text-purple-400" />
              Compliance & audits
            </h3>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-purple-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-white mb-2">Annual security audit</h4>
                  <p className="text-gray-400">
                    SOC 2 certification means we're verified to keep your data confidential
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-purple-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-white mb-2">Privacy law compliant</h4>
                  <p className="text-gray-400">
                    We follow European (GDPR) and California (CCPA) privacy laws strictly
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-purple-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-white mb-2">99.9% uptime guarantee</h4>
                  <p className="text-gray-400">
                    Your business runs 24/7, and so do we. Check our live status anytime
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-purple-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-white mb-2">ISO 27001 certified</h4>
                  <p className="text-gray-400">
                    International standard for information security management
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Trust Signals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="text-gray-400">No data sold to third parties</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-green-500" />
              <span className="text-gray-400">Your content never trains other AIs</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-green-500" />
              <span className="text-gray-400">Export your data anytime</span>
            </div>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Have questions about security? Our team is here to help at{' '}
            <a href="mailto:security@huntaze.com" className="text-purple-400 hover:text-purple-300">
              security@huntaze.com
            </a>
          </p>
          
          <div className="mt-6">
            <a 
              href="/security/details" 
              className="text-purple-400 hover:text-purple-300 font-medium inline-flex items-center gap-2"
            >
              View technical security details
              <span className="text-sm">→</span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}