'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Code, 
  Shield, 
  Globe, 
  Zap,
  CheckCircle,
  ArrowRight,
  FileText,
  Lock,
  Server
} from 'lucide-react'

const developerFeatures = [
  'RESTful & GraphQL APIs',
  'Real-time webhooks & events',
  '500M+ requests/day capacity',
  '<99ms p95 latency',
  'SDK libraries (Node, Python, Ruby)',
  'Comprehensive API documentation'
]

const complianceFeatures = [
  'SOC 2 Type II certified',
  'GDPR & CCPA compliant',
  'End-to-end encryption (AES-256)',
  'Zero-knowledge architecture',
  'PCI DSS Level 1 compliant',
  'Regular third-party audits'
]

const integrations = [
  { name: 'Stripe', logo: '/logos/stripe.svg' },
  { name: 'Zapier', logo: '/logos/zapier.svg' },
  { name: 'Segment', logo: '/logos/segment.svg' },
  { name: 'Datadog', logo: '/logos/datadog.svg' },
  { name: 'Slack', logo: '/logos/slack.svg' },
  { name: 'Webhook.site', logo: '/logos/webhook.svg' }
]

export default function EnterpriseReady() {
  return (
    <section className="py-24 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Enterprise-ready from day one
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Built for creators doing $1M+ annually
          </p>
        </motion.div>

        {/* Main Features Grid */}
        <div className="grid lg:grid-cols-2 gap-12 mb-20">
          {/* Developer First */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Code className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Developer-first platform
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Built by developers, for developers. Integrate Huntaze into your existing 
                  workflow with our comprehensive APIs and SDKs.
                </p>
                <ul className="space-y-3 mb-6">
                  {developerFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-4">
                  <a
                    href="/docs/api"
                    className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
                  >
                    View API Docs
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href="/docs/quickstart"
                    className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Quickstart Guide
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Global Compliance */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Global compliance
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Meet the strictest security and compliance standards. Your data is protected 
                  by the same infrastructure that powers Fortune 500 companies.
                </p>
                <ul className="space-y-3 mb-6">
                  {complianceFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-4">
                  <a
                    href="/security/whitepaper"
                    className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
                  >
                    <FileText className="w-4 h-4" />
                    Security Whitepaper
                  </a>
                  <a
                    href="/compliance"
                    className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
                  >
                    <Lock className="w-4 h-4" />
                    Compliance Center
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Additional Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6"
          >
            <Globe className="w-8 h-8 text-purple-600 mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Global Infrastructure
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              15 data centers worldwide ensure &lt;50ms latency globally. Auto-scaling 
              infrastructure handles traffic spikes seamlessly.
            </p>
            <a href="/infrastructure" className="text-purple-600 hover:text-purple-700 font-medium text-sm">
              View network map →
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6"
          >
            <Zap className="w-8 h-8 text-purple-600 mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              99.99% Uptime SLA
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Enterprise SLA with guaranteed uptime. Real-time status monitoring and 
              instant incident notifications.
            </p>
            <a href="/status" className="text-purple-600 hover:text-purple-700 font-medium text-sm">
              Check system status →
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6"
          >
            <Server className="w-8 h-8 text-purple-600 mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Dedicated Support
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              24/7 dedicated support team. Average response time under 15 minutes for 
              enterprise clients.
            </p>
            <a href="/support/enterprise" className="text-purple-600 hover:text-purple-700 font-medium text-sm">
              Learn about support →
            </a>
          </motion.div>
        </div>

        {/* Integration Partners */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center pt-16 border-t border-gray-200 dark:border-gray-700"
        >
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
            Seamless integration with your existing stack
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12">
            {integrations.map((integration, index) => (
              <motion.div
                key={integration.name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 0.5 }}
                whileHover={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="grayscale hover:grayscale-0 transition-all"
              >
                <span className="text-2xl font-semibold text-gray-400">
                  {integration.name}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
