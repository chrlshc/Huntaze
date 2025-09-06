"use client";

import { motion } from "framer-motion";
import { Building, Users, BarChart3, Shield, Zap, Globe, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import { MagneticButton } from "@/src/components/ui/magnetic-button";
import { Button } from "@/components/ui/button";

const benefits = [
  {
    icon: Users,
    title: "Manage Multiple Creators",
    description: "One dashboard for all your clients, with individual AI training per creator"
  },
  {
    icon: BarChart3,
    title: "White-Label Reports",
    description: "Professional analytics and insights with your agency branding"
  },
  {
    icon: Shield,
    title: "Team Permissions",
    description: "Control who sees what with role-based access for your team"
  },
  {
    icon: Zap,
    title: "Bulk Operations",
    description: "Apply strategies across multiple accounts simultaneously"
  }
];

const comparison = [
  {
    traditional: "50% commission rates",
    huntaze: "Transparent pricing per creator"
  },
  {
    traditional: "Manual chatters 24/7",
    huntaze: "AI automation that scales"
  },
  {
    traditional: "Risk of account bans",
    huntaze: "Platform-compliant by design"
  },
  {
    traditional: "Limited growth capacity",
    huntaze: "Handle 100+ creators easily"
  }
];

export default function AgenciesPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-b from-gray-900 to-black">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium mb-6">
              <Building className="w-4 h-4" />
              <span>For Creator Agencies</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white">
              Scale Your Agency 
              <span className="text-gradient bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent"> Without Limits</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8">
              Stop hiring chatters. Start scaling with AI. Manage 100+ creators 
              from one dashboard with enterprise-grade automation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/demo">
                <MagneticButton size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600">
                  Book Enterprise Demo
                  <ArrowRight className="ml-2 w-5 h-5" />
                </MagneticButton>
              </Link>
              <Link href="/agency-comparison">
                <MagneticButton size="lg" variant="secondary" className="w-full sm:w-auto bg-white/10 text-white border-white/20 hover:bg-white/20">
                  Compare vs Traditional
                </MagneticButton>
              </Link>
            </div>

            <p className="text-sm text-gray-400">
              Custom pricing • White-label options • Dedicated support
            </p>
          </motion.div>
        </div>

        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 -z-10" />
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Traditional Agencies Are Broken
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              High overhead, scaling issues, and compliance risks are killing agency profits
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {comparison.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="grid md:grid-cols-2 gap-4"
              >
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
                  <div className="font-semibold text-red-700 dark:text-red-400 mb-2">Traditional Way</div>
                  <p className="text-gray-700 dark:text-gray-300">{item.traditional}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
                  <div className="font-semibold text-green-700 dark:text-green-400 mb-2">Huntaze Way</div>
                  <p className="text-gray-700 dark:text-gray-300">{item.huntaze}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for Modern Agencies
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Everything you need to run a scalable, compliant creator agency
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg text-center"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Study */}
      <section className="py-20">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-3xl p-8 md:p-12"
          >
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
                How Elite Management Scaled to 150 Creators
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8 mb-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">150</div>
                  <p className="text-gray-600 dark:text-gray-400">Active Creators</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-600 mb-2">12</div>
                  <p className="text-gray-600 dark:text-gray-400">Team Members</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">3x</div>
                  <p className="text-gray-600 dark:text-gray-400">Revenue Per Creator</p>
                </div>
              </div>

              <blockquote className="text-lg italic text-center text-gray-700 dark:text-gray-300 mb-6">
                "We went from managing 20 creators with 50 chatters to 150 creators 
                with just 12 team members. The AI handles the volume while our team 
                focuses on strategy and growth."
              </blockquote>

              <p className="text-center font-semibold">- Michael Chen, CEO of Elite Management</p>
              
              <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-6">
                Individual results vary. Success depends on team, strategy, and execution.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Enterprise Features
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                title: "Multi-Creator Dashboard",
                features: ["Unified inbox", "Bulk actions", "Performance comparison", "Revenue tracking"]
              },
              {
                title: "Team Collaboration",
                features: ["Role-based access", "Activity logs", "Internal notes", "Task assignment"]
              },
              {
                title: "White Label Options",
                features: ["Custom domain", "Your branding", "Client portal", "Branded reports"]
              }
            ].map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6"
              >
                <h3 className="text-xl font-semibold mb-4">{section.title}</h3>
                <ul className="space-y-3">
                  {section.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <Shield className="w-16 h-16 text-blue-600 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Enterprise Security & Compliance
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Bank-level security for your agency and creators
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 text-left">
              {[
                "SOC 2 Type II certified",
                "256-bit encryption",
                "GDPR & CCPA compliant",
                "Regular security audits",
                "Platform rule monitoring",
                "Data isolation per creator"
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Scale Your Agency?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Get a custom demo and pricing for your agency needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/demo">
                <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                  Book Enterprise Demo
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                  Contact Sales
                </Button>
              </Link>
            </div>
            <p className="text-sm mt-6 opacity-75">
              Custom pricing • Onboarding support • Dedicated account manager
            </p>
          </motion.div>
        </div>
      </section>
    </main>
  );
}