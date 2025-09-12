'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Lock, 
  Award, 
  FileCheck, 
  Download, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Calendar,
  Users,
  Globe,
  Server,
  Key,
  Eye
} from 'lucide-react'

interface Certification {
  name: string
  logo?: string
  auditor?: string
  lastAudit: string
  nextAudit?: string
  scope: string
  downloadable: boolean
  status: 'active' | 'in-progress'
}

const certifications: Certification[] = [
  {
    name: 'SOC 2 Type II',
    auditor: 'Deloitte',
    lastAudit: '2024 Q4',
    nextAudit: '2025 Q4',
    scope: 'Full platform including AI systems',
    downloadable: true,
    status: 'active'
  },
  {
    name: 'ISO 27001:2022',
    auditor: 'BSI Group',
    lastAudit: '2024 Q3',
    nextAudit: '2025 Q3',
    scope: 'Information Security Management System',
    downloadable: true,
    status: 'active'
  },
  {
    name: 'GDPR Compliance',
    auditor: 'TrustArc',
    lastAudit: '2024 Q4',
    scope: 'EU data protection compliance',
    downloadable: true,
    status: 'active'
  },
  {
    name: 'CCPA Compliance',
    auditor: 'TrustArc',
    lastAudit: '2024 Q4',
    scope: 'California privacy compliance',
    downloadable: true,
    status: 'active'
  },
  {
    name: 'PCI DSS Level 1',
    auditor: 'Coalfire',
    lastAudit: '2024 Q3',
    scope: 'Payment card data security',
    downloadable: false,
    status: 'active'
  },
  {
    name: 'HIPAA Ready',
    lastAudit: '2025 Q2',
    scope: 'Healthcare data protection',
    downloadable: false,
    status: 'in-progress'
  }
]

const securityFeatures = [
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description: 'AES-256 encryption for all data at rest and in transit',
    details: [
      'TLS 1.3 for all API communications',
      'Encrypted database with key rotation',
      'Client-side encryption for sensitive data',
      'Hardware security module (HSM) for key management'
    ]
  },
  {
    icon: Key,
    title: 'Zero-Knowledge Architecture',
    description: 'We can\'t access your content, even if we wanted to',
    details: [
      'Client-side encryption keys',
      'No plaintext storage',
      'Cryptographic proof of privacy',
      'User-controlled data access'
    ]
  },
  {
    icon: Server,
    title: 'Infrastructure Security',
    description: 'Enterprise-grade infrastructure with multiple layers of protection',
    details: [
      'Multi-region deployment with failover',
      'DDoS protection with Cloudflare',
      'WAF (Web Application Firewall)',
      'Regular vulnerability scanning'
    ]
  },
  {
    icon: Users,
    title: 'Access Controls',
    description: 'Granular permissions and authentication systems',
    details: [
      'SSO/SAML support',
      'Multi-factor authentication',
      'Role-based access control (RBAC)',
      'Session management and timeout'
    ]
  }
]

export default function SecurityTrustCenter() {
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null)

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-full border border-green-500/20 mb-6">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium text-green-400">Security Trust Center</span>
            </div>
            
            <h1 className="text-5xl font-bold mb-6">
              Your Security is Our Priority
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Comprehensive security measures and compliance certifications to protect 
              your business and your fans' data at enterprise scale.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Compliance Matrix */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Compliance & Certifications
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Independently verified by leading security auditors
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certifications.map((cert, index) => (
              <motion.div
                key={cert.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`
                  bg-white rounded-lg p-6 border-2 cursor-pointer transition-all
                  ${cert.status === 'active' 
                    ? 'border-green-200 hover:border-green-400' 
                    : 'border-yellow-200 hover:border-yellow-400'
                  }
                `}
                onClick={() => setSelectedCert(cert)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Award className={`w-6 h-6 ${
                      cert.status === 'active' ? 'text-green-600' : 'text-yellow-600'
                    }`} />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {cert.name}
                    </h3>
                  </div>
                  {cert.status === 'in-progress' && (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                      In Progress
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  {cert.auditor && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Auditor:</span>
                      <span className="font-medium">{cert.auditor}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Last Audit:</span>
                    <span className="font-medium">{cert.lastAudit}</span>
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 mt-3">{cert.scope}</div>
                </div>

                {cert.downloadable && (
                  <button className="mt-4 text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    Download Report
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Architecture */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Security Architecture
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Multiple layers of protection for your peace of mind
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {securityFeatures.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-md"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Icon className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">{feature.description}</p>
                      <ul className="space-y-2">
                        {feature.details.map((detail) => (
                          <li key={detail} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pen Test Results */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-12 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-full mb-6">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Latest Security Assessment</span>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              A+ Security Rating
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Last penetration test completed January 2025 by CrowdStrike
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div>
                <div className="text-4xl font-bold text-green-600">0</div>
                <div className="text-gray-600 dark:text-gray-400">Critical vulnerabilities</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600">0</div>
                <div className="text-gray-600 dark:text-gray-400">High-risk findings</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-600">100%</div>
                <div className="text-gray-600 dark:text-gray-400">Remediation rate</div>
              </div>
            </div>
            
            <button className="mt-8 inline-flex items-center gap-2 text-green-700 hover:text-green-800 font-medium">
              View Full Report
              <ExternalLink className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Security Resources
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Documentation and tools for security teams
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <motion.a
              href="/security/whitepaper"
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-lg transition-all"
            >
              <FileCheck className="w-8 h-8 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Security Whitepaper
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Detailed technical documentation of our security architecture and practices
              </p>
              <span className="text-purple-600 font-medium text-sm flex items-center gap-1">
                Download PDF
                <Download className="w-4 h-4" />
              </span>
            </motion.a>

            <motion.a
              href="/security/vulnerability-disclosure"
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-lg transition-all"
            >
              <AlertCircle className="w-8 h-8 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Vulnerability Disclosure
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Report security vulnerabilities through our responsible disclosure program
              </p>
              <span className="text-purple-600 font-medium text-sm flex items-center gap-1">
                Learn More
                <ArrowRight className="w-4 h-4" />
              </span>
            </motion.a>

            <motion.a
              href="/api/security"
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md hover:shadow-lg transition-all"
            >
              <Eye className="w-8 h-8 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                API Security Guide
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Best practices for secure API integration and authentication
              </p>
              <span className="text-purple-600 font-medium text-sm flex items-center gap-1">
                View Docs
                <ExternalLink className="w-4 h-4" />
              </span>
            </motion.a>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 bg-purple-900 text-white">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Have Security Questions?
          </h2>
          <p className="text-xl text-purple-200 mb-8">
            Our security team is here to help with any questions or concerns
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:security@huntaze.com"
              className="inline-flex items-center justify-center px-8 py-3 bg-white dark:bg-gray-800 text-purple-900 rounded-full font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              security@huntaze.com
            </a>
            <a
              href="/contact-security"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition-colors"
            >
              Schedule Security Review
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}