'use client';

import { Shield, Lock, CheckCircle, FileCheck, Globe, Users, Server, Key } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'SOC 2 Type II Certified',
    description: 'Annual independent audits ensure the highest standards of security.'
  },
  {
    icon: Lock,
    title: 'Bank-level Encryption',
    description: 'AES-256 encryption at rest and TLS 1.3 in transit. Your content is always protected.'
  },
  {
    icon: FileCheck,
    title: 'GDPR Compliant',
    description: 'Full compliance with European privacy regulations. Your rights are protected.'
  },
  {
    icon: Globe,
    title: 'CCPA Compliant',
    description: 'Meeting California\'s strict privacy requirements.'
  },
  {
    icon: Users,
    title: 'Privacy by Design',
    description: 'Data minimization principles: we only collect what\'s necessary.'
  },
  {
    icon: Server,
    title: '99.9% Uptime SLA',
    description: 'Enterprise-grade infrastructure with redundancy across multiple zones.'
  }
];

const certifications = [
  { name: 'SOC 2', logo: '/badges/soc2.png' },
  { name: 'GDPR', logo: '/badges/gdpr.png' },
  { name: 'CCPA', logo: '/badges/ccpa.png' },
  { name: 'ISO 27001', logo: '/badges/iso27001.png' }
];

export default function SecurityCompliance() {
  return (
    <section className="py-20 bg-black">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-400 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-purple-500/20">
            <Shield className="w-4 h-4" />
            <span>Security & Compliance</span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-white">
            Your content.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-700">
              Always secure.
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Enterprise-grade security protecting 5,000+ creators and their fans. 
            We take your privacy and data protection seriously.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-500/10 rounded-lg mb-4 border border-purple-500/20">
                  <Icon className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Data Protection */}
        <div className="bg-gray-900 rounded-2xl p-8 lg:p-12 border border-gray-800 mb-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold text-white mb-4">
                How we protect your data
              </h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">Zero-knowledge architecture</p>
                    <p className="text-sm text-gray-400">Your content is encrypted before it reaches our servers</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">Automatic data anonymization</p>
                    <p className="text-sm text-gray-400">Personal data is anonymized for AI training</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">Regular security audits</p>
                    <p className="text-sm text-gray-400">Third-party penetration testing quarterly</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-white">Instant data deletion</p>
                    <p className="text-sm text-gray-400">Delete your data anytime, no questions asked</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-8 border border-purple-500/30">
              <Key className="w-12 h-12 text-purple-400 mb-4" />
              <h4 className="text-xl font-semibold text-white mb-3">
                Your data, your control
              </h4>
              <p className="text-gray-400 mb-4">
                Export or delete your data anytime. We believe in complete transparency 
                and giving you full control over your information.
              </p>
              <a 
                href="/security" 
                className="text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-1"
              >
                View security whitepaper →
              </a>
            </div>
          </div>
        </div>

        {/* Certifications */}
        <div className="text-center">
          <p className="text-gray-400 mb-6">Certified and audited by</p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {certifications.map((cert) => (
              <div key={cert.name} className="text-gray-400">
                {/* Placeholder for actual certification logos */}
                <div className="w-24 h-12 bg-gray-800 rounded flex items-center justify-center text-xs font-medium text-gray-400">
                  {cert.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Statement */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-400 max-w-3xl mx-auto">
            Huntaze is trusted by thousands of creators worldwide. We maintain the highest 
            standards of security and compliance to protect your business and your fans' data. 
            For security inquiries, contact{' '}
            <a href="mailto:security@huntaze.com" className="text-purple-600 hover:text-purple-700">
              security@huntaze.com
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}