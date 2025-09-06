"use client";

import { motion } from "framer-motion";
import { 
  UserPlus, 
  MessageSquare, 
  Brain, 
  TrendingUp, 
  Shield, 
  Zap,
  ChevronRight,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { MagneticButton } from "@/src/components/ui/magnetic-button";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    title: "Connect Your Accounts",
    description: "Link your OnlyFans, Instagram, and other platforms in under 5 minutes. Our secure OAuth integration keeps your login safe.",
    icon: UserPlus,
    details: [
      "Bank-level encryption",
      "No password storage",
      "Instant sync"
    ]
  },
  {
    number: "02",
    title: "AI Learns Your Style",
    description: "Our AI analyzes your top-performing messages and content to understand exactly how you communicate with fans.",
    icon: Brain,
    details: [
      "Reads your message history",
      "Learns your pricing strategy",
      "Mimics your personality"
    ]
  },
  {
    number: "03",
    title: "Automate Conversations",
    description: "AI handles repetitive messages while you focus on creating content. You stay in control with approval settings.",
    icon: MessageSquare,
    details: [
      "24/7 response capability",
      "Smart fan prioritization",
      "Manual override anytime"
    ]
  },
  {
    number: "04",
    title: "Track & Optimize",
    description: "See what's working with real-time analytics. Our AI continuously improves based on fan responses and revenue data.",
    icon: TrendingUp,
    details: [
      "Revenue attribution",
      "A/B message testing",
      "Performance insights"
    ]
  }
];

const features = [
  {
    title: "Start Small, Scale Smart",
    description: "Begin with basic automation and gradually increase as you see results",
    icon: Zap
  },
  {
    title: "Stay Compliant",
    description: "Built-in safety checks ensure you never violate platform rules",
    icon: Shield
  },
  {
    title: "Keep Control",
    description: "Review and approve AI suggestions before they go live",
    icon: CheckCircle
  }
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              How Huntaze <span className="text-gradient">Works</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              From setup to meaningful results in 4 simple steps. Many creators 
              report faster responses and time savings from day one.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/onboarding">
                <MagneticButton size="lg" variant="primary">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </MagneticButton>
              </Link>
              <Link href="/demo">
                <MagneticButton size="lg" variant="secondary">
                  Watch Demo
                </MagneticButton>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-20 md:py-32">
        <div className="container-width">
          <div className="space-y-20">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className={`flex flex-col lg:flex-row gap-12 items-center ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Visual */}
                <div className="flex-1">
                  <div className="relative">
                    <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
                          <step.icon className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-4xl font-bold text-gray-300 dark:text-gray-700">
                          {step.number}
                        </div>
                      </div>
                      <div className="space-y-3">
                        {step.details.map((detail, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-gray-700 dark:text-gray-300">{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">{step.title}</h2>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                    {step.description}
                  </p>
                  {index === 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Shield className="w-4 h-4" />
                      <span>SOC 2 Type II certified security</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-100 dark:bg-gray-800">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for Real Creators
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Built for sustainable growth. Results vary based on audience and effort.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-900 p-6 rounded-2xl"
              >
                <feature.icon className="w-10 h-10 text-purple-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="container-width text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Save Time and Grow?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join 5,000+ creators who work smarter, not harder
          </p>
          <Link href="/onboarding">
            <Button size="lg" className="bg-white text-purple-700 hover:bg-gray-100">
              Start Your Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}