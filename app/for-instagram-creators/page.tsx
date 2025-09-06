"use client";

import { motion } from "framer-motion";
import { Instagram, Users, MessageSquare, TrendingUp, Shield, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { MagneticButton } from "@/src/components/ui/magnetic-button";
import { Button } from "@/components/ui/button";

const benefits = [
  {
    icon: MessageSquare,
    title: "Never Miss a DM Sale",
    description: "AI responds to every Instagram DM instantly, turning followers into customers 24/7"
  },
  {
    icon: Clock,
    title: "Post While You Sleep",
    description: "Schedule content across Stories, Reels, and Posts at optimal times"
  },
  {
    icon: Shield,
    title: "Stay Instagram Safe",
    description: "Built with Instagram's guidelines to protect your account"
  },
  {
    icon: TrendingUp,
    title: "Grow Faster",
    description: "Data-driven insights show you what content converts followers to fans"
  }
];

const painPoints = [
  "Spending 4+ hours daily answering the same DMs",
  "Missing sales because you can't reply fast enough",
  "Struggling to convert Instagram followers to paying fans",
  "Losing track of conversations across multiple platforms"
];

export default function InstagramCreatorsPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-b from-pink-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-sm font-medium mb-6">
              <Instagram className="w-4 h-4" />
              <span>For Instagram Creators</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Turn Your Instagram Into a 
              <span className="text-gradient bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"> Revenue Machine</span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Stop losing money in your DMs. Let AI handle conversations while you create content. 
              Instagram creators save 20+ hours weekly with smart automation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/onboarding">
                <MagneticButton size="lg" variant="primary" className="w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </MagneticButton>
              </Link>
              <Link href="/demo">
                <MagneticButton size="lg" variant="secondary" className="w-full sm:w-auto">
                  See How It Works
                </MagneticButton>
              </Link>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              No credit card required • Works with Instagram DMs
            </p>
          </motion.div>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-100/50 to-purple-100/50 dark:from-pink-900/10 dark:to-purple-900/10 -z-10" />
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              We Know Your Instagram Struggles
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              You're not alone. Every Instagram creator faces these challenges:
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {painPoints.map((pain, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl"
              >
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                <p className="text-gray-700 dark:text-gray-300">{pain}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built Specifically for Instagram Creators
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Every feature designed to help you monetize your Instagram following
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
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-pink-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Instagram to Income in 3 Steps
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "1",
                title: "Connect Instagram",
                description: "Link your Instagram Business account securely in minutes"
              },
              {
                step: "2",
                title: "Train Your AI",
                description: "AI learns from your best messages and content style"
              },
              {
                step: "3",
                title: "Watch Revenue Grow",
                description: "AI converts DMs to sales while you focus on content"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-600 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-8 left-full w-full">
                    <svg className="w-full h-2" viewBox="0 0 100 10">
                      <path
                        d="M 0 5 L 100 5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="5 5"
                        className="text-gray-300 dark:text-gray-700"
                      />
                    </svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20 rounded-3xl p-8 md:p-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8">
              Join 2,000+ Instagram Creators
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">20+ hrs</div>
                <p className="text-gray-600 dark:text-gray-400">Saved weekly on DMs</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">2-3x</div>
                <p className="text-gray-600 dark:text-gray-400">Revenue growth reported</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">24/7</div>
                <p className="text-gray-600 dark:text-gray-400">AI working for you</p>
              </div>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              Results vary based on audience and engagement. These are typical outcomes reported by active users.
            </p>

            <Link href="/onboarding">
              <MagneticButton size="lg" variant="primary">
                Start Your Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </MagneticButton>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Instagram Creator FAQs
            </h2>

            <div className="space-y-6">
              {[
                {
                  q: "Is this safe for my Instagram account?",
                  a: "Yes. We follow Instagram's API guidelines and best practices. Your account stays secure."
                },
                {
                  q: "How does the AI learn my style?",
                  a: "The AI analyzes your past conversations and content to match your tone and personality."
                },
                {
                  q: "Can I still reply to DMs myself?",
                  a: "Absolutely! You stay in control. AI suggests responses, you approve before sending."
                },
                {
                  q: "What kind of results can I expect?",
                  a: "Creators typically save 20+ hours weekly and see 2-3x revenue growth. Results vary."
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6"
                >
                  <h3 className="text-lg font-semibold mb-2">{faq.q}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Monetize Your Instagram?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Start your free trial today. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/onboarding">
                <Button size="lg" className="bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}