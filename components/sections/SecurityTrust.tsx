"use client";

import { motion } from "framer-motion";
import { Shield, Lock, CheckCircle, Award, Key, FileCheck } from "lucide-react";

const securityFeatures = [
  {
    icon: Lock,
    title: "Bank-level encryption",
    description: "256-bit SSL encryption for all data"
  },
  {
    icon: Shield,
    title: "GDPR compliant",
    description: "Full compliance with global privacy laws"
  },
  {
    icon: Key,
    title: "OAuth 2.0",
    description: "Secure authentication, no passwords stored"
  },
  {
    icon: FileCheck,
    title: "SOC 2 Type II",
    description: "Annual security audits and compliance"
  },
  {
    icon: Award,
    title: "ISO 27001",
    description: "International security standard certified"
  },
  {
    icon: CheckCircle,
    title: "99.9% uptime SLA",
    description: "Enterprise-grade reliability guaranteed"
  }
];

export function SecurityTrust() {
  return (
    <section className="py-20 md:py-32 bg-gray-50 dark:bg-gray-950">
      <div className="container-width">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            <span>Enterprise security</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Your data is sacred
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            We protect your content and earnings with military-grade security
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-black rounded-2xl p-6 border border-gray-200 dark:border-gray-800"
            >
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 md:p-12 text-center"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Trusted by 10,000+ creators worldwide
          </h3>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Your content, conversations, and earnings are protected by the same security standards used by major banks.
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-white">$50M+</p>
              <p className="text-gray-400">Secured in earnings</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-white">0</p>
              <p className="text-gray-400">Security breaches</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-white">24/7</p>
              <p className="text-gray-400">Security monitoring</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}