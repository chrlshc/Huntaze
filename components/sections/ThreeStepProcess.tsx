"use client";

import { motion } from "framer-motion";
import { Plug, Brain, TrendingUp } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Plug,
    title: "Connect your platforms",
    description: "Link Instagram, TikTok, OnlyFans in 60 seconds. We handle the tech.",
    color: "from-blue-600 to-cyan-600"
  },
  {
    number: "02",
    icon: Brain,
    title: "AI learns your style",
    description: "Our AI analyzes your best conversations and mimics your personality.",
    color: "from-purple-600 to-pink-600"
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Watch revenue grow",
    description: "AI responds 24/7, converts fans to buyers. You keep 93-97% of earnings.",
    color: "from-pink-600 to-orange-600"
  }
];

export function ThreeStepProcess() {
  return (
    <section className="py-20 md:py-32 bg-white dark:bg-black">
      <div className="container-width">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-4">
            How it works
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Start earning in <span className="text-gradient bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">3 simple steps</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            No tech skills needed. No complicated setup. Just connect and grow.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-20 left-full w-full h-0.5 bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-700" />
              )}
              
              <div className="text-center">
                {/* Number */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-900 mb-6">
                  <span className="text-2xl font-bold bg-gradient-to-r ${step.color} bg-clip-text text-transparent">
                    {step.number}
                  </span>
                </div>
                
                {/* Icon */}
                <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${step.color} p-0.5`}>
                  <div className="w-full h-full bg-white dark:bg-black rounded-2xl flex items-center justify-center">
                    <step.icon className={`w-10 h-10 text-transparent bg-gradient-to-br ${step.color} bg-clip-text`} />
                  </div>
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Most creators see results within <span className="font-semibold text-gray-900 dark:text-white">48 hours</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}