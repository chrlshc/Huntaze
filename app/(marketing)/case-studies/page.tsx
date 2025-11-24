"use client";

export const dynamic = 'force-static';

import { motion } from "framer-motion";
import { MessageSquare, Clock, BarChart3, Shield, Zap, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: MessageSquare,
    title: "AI-Powered Messaging",
    description: "Automate repetitive conversations while maintaining your authentic voice",
    benefits: [
      "Smart message templates",
      "Context-aware responses",
      "Multi-platform support"
    ]
  },
  {
    icon: Clock,
    title: "Time Management",
    description: "Focus on creating content while AI handles routine interactions",
    benefits: [
      "Automated scheduling",
      "Priority inbox",
      "Batch processing"
    ]
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description: "Track engagement and optimize your strategy with data",
    benefits: [
      "Performance metrics",
      "Fan engagement tracking",
      "Revenue analytics"
    ]
  },
  {
    icon: Shield,
    title: "Platform Compliant",
    description: "Built with platform guidelines in mind for safe automation",
    benefits: [
      "Terms of service compliant",
      "Human-in-the-loop controls",
      "Transparent AI usage"
    ]
  },
  {
    icon: Zap,
    title: "Quick Setup",
    description: "Get started in minutes with our intuitive onboarding",
    benefits: [
      "Easy integration",
      "Guided setup wizard",
      "24/7 support"
    ]
  },
  {
    icon: TrendingUp,
    title: "Growth Tools",
    description: "Scale your creator business with powerful automation",
    benefits: [
      "Campaign management",
      "Content scheduling",
      "Fan segmentation"
    ]
  }
];

const commonChallenges = [
  "Spending hours daily on repetitive messages",
  "Missing important fan interactions",
  "Burning out from constant availability",
  "Struggling to scale your business"
];

export default function CaseStudiesPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Built for <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Creator Success</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Powerful automation tools designed to help creators save time and grow their business.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Common Challenges */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Challenges We Help Solve
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {commonChallenges.map((challenge, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 flex-shrink-0" />
                <p className="text-gray-700 dark:text-gray-300">{challenge}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            How Huntaze Helps
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Creator Business?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Start saving time with AI automation today
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/features">
              <Button size="lg" variant="outline">
                Explore Features
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
