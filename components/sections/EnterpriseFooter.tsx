'use client'

import React from 'react'
import Link from 'next/link'
import { Shield, Award, Lock } from 'lucide-react'

export default function EnterpriseFooter() {
  const footerLinks = {
    Platform: [
      { label: 'API Docs', href: '/docs/api' },
      { label: 'System Status', href: '/status' },
      { label: 'Security', href: '/security' },
      { label: 'Changelog', href: '/changelog' }
    ],
    Company: [
      { label: 'About', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press Kit', href: '/press' },
      { label: 'Contact', href: '/contact' }
    ],
    Resources: [
      { label: 'Blog', href: '/blog' },
      { label: 'Case Studies', href: '/case-studies' },
      { label: 'Help Center', href: '/help' },
      { label: 'Community', href: '/community' }
    ],
    Legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'DPA', href: '/dpa' },
      { label: 'Acceptable Use', href: '/acceptable-use' }
    ]
  }

  const certifications = [
    { icon: <Shield className="w-5 h-5" />, label: 'SOC 2' },
    { icon: <Award className="w-5 h-5" />, label: 'GDPR' },
    { icon: <Lock className="w-5 h-5" />, label: 'ISO 27001' }
  ]

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Certifications */}
        <div className="flex flex-wrap items-center justify-center gap-8 py-8 border-t border-gray-200 dark:border-gray-700">
          {certifications.map((cert, index) => (
            <div key={index} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              {cert.icon}
              <span className="font-medium">{cert.label}</span>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
          <div className="mb-4 md:mb-0">
            © 2025 Huntaze, Inc. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a href="https://twitter.com/huntaze" className="hover:text-gray-900 dark:hover:text-white">Twitter</a>
            <a href="https://linkedin.com/company/huntaze" className="hover:text-gray-900 dark:hover:text-white">LinkedIn</a>
            <a href="https://github.com/huntaze" className="hover:text-gray-900 dark:hover:text-white">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  )
}