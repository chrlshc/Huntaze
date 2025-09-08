'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Zap, 
  TrendingUp, 
  Users, 
  Shield, 
  DollarSign, 
  ArrowRight,
  BarChart3,
  Clock,
  Sparkles,
  MessageSquare,
  Calendar,
  Globe
} from 'lucide-react';

export default function FeaturesPage() {
  const features = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Intelligent Automation",
      description: "Save 10+ hours per week with AI-powered workflows that handle repetitive tasks automatically",
      metric: "Save 10h/week",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Real-time Analytics",
      description: "Make data-driven decisions 3x faster with instant insights and customizable dashboards",
      metric: "3x faster decisions",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Seamless Collaboration",
      description: "Cut meeting time by 50% with built-in collaboration tools and real-time updates",
      metric: "50% fewer meetings",
      gradient: "from-pink-500 to-rose-500"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Enhanced Security",
      description: "Enterprise-grade security with AES-256 encryption and compliance certifications",
      metric: "AES-256 encryption",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Native Integrations",
      description: "Connect with 100+ tools you already use. No complex setup required",
      metric: "100+ integrations",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "24/7 Support",
      description: "Get help when you need it with average response times under 2 minutes",
      metric: "< 2min response",
      gradient: "from-red-500 to-pink-500"
    }
  ];

  const showcaseFeatures = [
    {
      title: "Unified Dashboard",
      subtitle: "All your metrics in one place",
      description: "Stop switching between tabs. Our unified dashboard brings together data from all your platforms, giving you a complete view of your business performance in real-time.",
      features: [
        "Cross-platform analytics",
        "Customizable widgets",
        "Real-time updates",
        "Export reports in one click"
      ],
      mockup: "dashboard"
    },
    {
      title: "Smart Automation",
      subtitle: "Work smarter, not harder",
      description: "Set up powerful automation rules that adapt to your workflow. From auto-responses to scheduled content, let AI handle the repetitive tasks while you focus on growth.",
      features: [
        "Visual workflow builder",
        "Pre-built templates",
        "Conditional logic",
        "Performance tracking"
      ],
      mockup: "automation"
    },
    {
      title: "Team Collaboration",
      subtitle: "Built for teams that move fast",
      description: "Keep everyone on the same page with real-time collaboration features. Share insights, assign tasks, and track progress without endless meetings.",
      features: [
        "Real-time comments",
        "Task assignments",
        "Activity feed",
        "Role-based permissions"
      ],
      mockup: "collaboration"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-pink-50" />
        <div className="relative max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="section-header"
          >
            <span className="overline">Platform Features</span>
            <h1 className="display-1 mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent balance-text">
              Features that Drive Success
            </h1>
            <p className="lead">
              Discover how Huntaze transforms your workflow with powerful tools 
              and an intuitive interface designed for modern teams
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative bg-white rounded-2xl p-8 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Gradient border on hover */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl"
                  style={{
                    backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
                    '--tw-gradient-from': feature.gradient.split(' ')[1],
                    '--tw-gradient-to': feature.gradient.split(' ')[3],
                  } as any}
                />
                
                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                
                {/* Content */}
                <h3 className="feature-title mb-3 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {feature.description}
                </p>
                <div className="text-sm font-medium text-purple-600">
                  {feature.metric}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Showcases */}
      {showcaseFeatures.map((showcase, index) => (
        <section key={showcase.title} className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className={`grid lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {/* Text Content */}
              <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                <motion.div
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <h2 className="heading-2 mb-2 text-gray-900">
                    {showcase.title}
                  </h2>
                  <p className="lead text-purple-600 mb-6">
                    {showcase.subtitle}
                  </p>
                  <p className="text-gray-600 mb-8 text-lg">
                    {showcase.description}
                  </p>
                  <ul className="space-y-3">
                    {showcase.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>

              {/* Mockup */}
              <div className={`relative ${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden shadow-2xl">
                    {/* Placeholder for mockup - replace with actual mockup component */}
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span className="text-2xl font-medium">
                        {showcase.mockup} mockup
                      </span>
                    </div>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-200 rounded-full blur-2xl opacity-60" />
                  <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-pink-200 rounded-full blur-2xl opacity-60" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      ))}

      {/* Comparison Table */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4 text-gray-900">
              Huntaze vs. Alternatives
            </h2>
            <p className="text-xl text-gray-600">
              See why teams choose Huntaze over the competition
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-6 font-semibold text-gray-900">Features</th>
                    <th className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50">
                      <span className="font-bold text-purple-600">Huntaze</span>
                    </th>
                    <th className="text-center p-6 font-semibold text-gray-600">Competitor A</th>
                    <th className="text-center p-6 font-semibold text-gray-600">Competitor B</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    "AI-powered automation",
                    "Real-time analytics",
                    "100+ integrations",
                    "24/7 support",
                    "Custom workflows",
                    "Team collaboration",
                    "Mobile app",
                    "API access"
                  ].map((feature, index) => (
                    <tr key={feature} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="p-6 text-gray-900">{feature}</td>
                      <td className="text-center p-6 bg-gradient-to-br from-purple-50/50 to-pink-50/50">
                        <svg className="w-6 h-6 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </td>
                      <td className="text-center p-6">
                        {Math.random() > 0.5 ? (
                          <svg className="w-6 h-6 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </td>
                      <td className="text-center p-6">
                        {Math.random() > 0.6 ? (
                          <svg className="w-6 h-6 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-12 text-white"
          >
            <h2 className="text-4xl font-bold mb-6">
              Ready to Transform Your Workflow?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of teams already using Huntaze to work smarter
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white text-purple-600 font-bold rounded-xl hover:shadow-xl transition-all duration-300"
                >
                  Start Free Trial
                </motion.button>
              </Link>
              <Link href="/demo">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white/20 backdrop-blur text-white font-bold rounded-xl hover:bg-white/30 transition-all duration-300"
                >
                  Watch Demo
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}