"use client";

import { motion } from "framer-motion";
import { TrendingUp, Clock, MessageSquare, DollarSign, Star, ArrowRight } from "lucide-react";
import Link from "next/link";
import { MagneticButton } from "@/src/components/ui/magnetic-button";
import { Button } from "@/components/ui/button";

const caseStudies = [
  {
    name: "Sarah M.",
    avatar: "SM",
    role: "Fitness Creator",
    before: {
      revenue: "$2,400/month",
      hours: "35 hours/week on messages",
      fans: "1,200 active fans"
    },
    after: {
      revenue: "$5,800/month",
      hours: "12 hours/week on messages",
      fans: "1,850 active fans"
    },
    timeframe: "3 months",
    testimonial: "I was drowning in messages. Now I create more content and still earn more.",
    highlights: [
      "2.4x revenue growth",
      "23 hours saved weekly",
      "Better fan engagement"
    ]
  },
  {
    name: "Jake T.",
    avatar: "JT",
    role: "Gaming Creator",
    before: {
      revenue: "$3,100/month",
      hours: "40 hours/week on messages",
      fans: "2,500 active fans"
    },
    after: {
      revenue: "$6,300/month",
      hours: "15 hours/week on messages",
      fans: "3,200 active fans"
    },
    timeframe: "4 months",
    testimonial: "The AI handles the repetitive stuff perfectly. I focus on high-value fans now.",
    highlights: [
      "2x revenue growth",
      "Improved conversion rates",
      "25 hours saved weekly"
    ]
  },
  {
    name: "Maria K.",
    avatar: "MK",
    role: "Lifestyle Creator",
    before: {
      revenue: "$1,800/month",
      hours: "25 hours/week on messages",
      fans: "800 active fans"
    },
    after: {
      revenue: "$3,200/month",
      hours: "8 hours/week on messages",
      fans: "1,100 active fans"
    },
    timeframe: "2 months",
    testimonial: "Started small with just welcome messages. Now AI handles 80% of my DMs.",
    highlights: [
      "1.7x revenue growth",
      "17 hours saved weekly",
      "Platform compliant"
    ]
  }
];

const commonChallenges = [
  "Spending 5+ hours daily on repetitive messages",
  "Missing high-value fans in the DM chaos",
  "Burning out from constant availability",
  "Revenue plateauing despite more work"
];

export default function CaseStudiesPage() {
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
              Real Creators, <span className="text-gradient">Real Results</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              See how creators like you save time and grow revenue with Huntaze. 
              Real examples from our community. Results vary.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-20 md:py-32">
        <div className="container-width">
          <div className="space-y-20">
            {caseStudies.map((study, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-12 shadow-xl"
              >
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {study.avatar}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{study.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{study.role}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Results in</p>
                    <p className="text-lg font-semibold text-purple-600">{study.timeframe}</p>
                  </div>
                </div>

                {/* Before/After */}
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl p-6">
                    <h4 className="font-semibold text-gray-600 dark:text-gray-400 mb-4">Before Huntaze</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-gray-400" />
                        <span>{study.before.revenue}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <span>{study.before.hours}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-gray-400" />
                        <span>{study.before.fans}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6">
                    <h4 className="font-semibold text-purple-600 mb-4">After Huntaze</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <span className="font-semibold">{study.after.revenue}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-green-600" />
                        <span className="font-semibold">{study.after.hours}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                        <span className="font-semibold">{study.after.fans}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Testimonial */}
                <blockquote className="text-lg italic text-gray-700 dark:text-gray-300 mb-6">
                  "{study.testimonial}"
                </blockquote>

                {/* Highlights */}
                <div className="flex flex-wrap gap-3">
                  {study.highlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full text-sm">
                      <Star className="w-4 h-4" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Disclaimer */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-16 text-sm text-gray-500 dark:text-gray-400 max-w-3xl mx-auto"
          >
            These are examples from real creators. Individual results vary based on audience, 
            content quality, and personal effort. Huntaze provides tools; success requires your engagement.
          </motion.p>
        </div>
      </section>

      {/* Common Challenges */}
      <section className="py-20 bg-gray-100 dark:bg-gray-800">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Sound Familiar?
            </h2>
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 md:p-12">
              <h3 className="text-xl font-semibold mb-6">
                Before using Huntaze, our creators struggled with:
              </h3>
              <div className="space-y-4">
                {commonChallenges.map((challenge, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{challenge}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-center">
                <p className="text-lg font-semibold mb-4">
                  You don't have to struggle alone
                </p>
                <Link href="/onboarding">
                  <MagneticButton variant="primary">
                    Start Your Success Story
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </MagneticButton>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="container-width text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Start Working Smarter Today
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join 5,000+ creators saving time with AI automation
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/pricing">
              <Button size="lg" className="bg-white text-purple-700 hover:bg-gray-100">
                View Pricing
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                Watch Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}