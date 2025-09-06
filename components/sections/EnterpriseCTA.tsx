"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building, Users, Shield, Zap, Crown, BarChart3 } from "lucide-react";
import Link from "next/link";

const benefits = [
  {
    icon: Building,
    title: "White-Label Options",
    description: "Your brand, our technology"
  },
  {
    icon: Shield,
    title: "99.9% SLA Guarantee",
    description: "Enterprise-grade reliability"
  },
  {
    icon: Users,
    title: "Unlimited Team Seats",
    description: "Scale without limits"
  },
  {
    icon: BarChart3,
    title: "1% Commission Only",
    description: "Volume-based pricing"
  },
  {
    icon: Zap,
    title: "Dedicated Infrastructure",
    description: "Isolated high-performance servers"
  },
  {
    icon: Crown,
    title: "Custom AI Training",
    description: "Models trained on your data"
  }
];

export function EnterpriseCTA() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-gray-900 to-black text-white overflow-hidden relative">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
      </div>

      <div className="container-width relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white/90 text-sm font-medium mb-6">
            <Crown className="w-4 h-4" />
            <span>For Agencies & Networks</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Ready for <span className="text-gradient bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Enterprise Scale?</span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Join the top 1% of agencies saving 95%+ on talent management costs while scaling 10x faster
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                <benefit.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
              <p className="text-gray-400 text-sm">{benefit.description}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link href="/contact-enterprise">
            <Button
              size="lg"
              className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-6 text-lg font-medium"
            >
              Schedule Enterprise Demo
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          
          <p className="mt-4 text-sm text-gray-400">
            Custom pricing • Dedicated support • Migration assistance
          </p>
        </motion.div>
      </div>
    </section>
  );
}