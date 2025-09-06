"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Zap, Shield, BarChart3, Globe, Palette } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI that learns you",
    description: "Mimics your tone, humor, and selling style perfectly",
    image: "/features/ai-learning.png",
    details: [
      "Analyzes your top-performing messages",
      "Adapts to each fan's preferences",
      "Improves conversion rates over time"
    ]
  },
  {
    icon: Zap,
    title: "Instant everything",
    description: "0.8s average response time keeps fans engaged",
    image: "/features/instant-response.png",
    details: [
      "Real-time message processing",
      "Queue-free architecture",
      "Works 24/7 across timezones"
    ]
  },
  {
    icon: Shield,
    title: "Platform safe",
    description: "100% compliant with ToS of all platforms",
    image: "/features/compliance.png",
    details: [
      "Regular compliance audits",
      "No shadowban risks",
      "Secure data handling"
    ]
  },
  {
    icon: BarChart3,
    title: "Revenue analytics",
    description: "Know exactly what's working and scale it",
    image: "/features/analytics.png",
    details: [
      "Real-time revenue tracking",
      "Fan lifetime value metrics",
      "A/B testing built-in"
    ]
  },
  {
    icon: Globe,
    title: "Multi-language",
    description: "Engage fans worldwide in their language",
    image: "/features/languages.png",
    details: [
      "45+ languages supported",
      "Cultural context awareness",
      "Automatic translation"
    ]
  },
  {
    icon: Palette,
    title: "Your brand, amplified",
    description: "Maintains your unique voice and personality",
    image: "/features/branding.png",
    details: [
      "Custom personality settings",
      "Brand voice consistency",
      "Emoji and slang matching"
    ]
  }
];

export function PowerfulFeatures() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <section className="py-20 md:py-32 bg-gray-50 dark:bg-black">
      <div className="container-width">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-4">
            Powerful features
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Everything you need to <span className="text-gradient bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">10x your income</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Built by creators, for creators. Every feature designed to make you more money.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Feature list */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                onClick={() => setActiveFeature(index)}
                className={`p-6 rounded-2xl cursor-pointer transition-all ${
                  activeFeature === index
                    ? "bg-white dark:bg-gray-900 shadow-lg border-2 border-purple-600"
                    : "bg-transparent hover:bg-white/50 dark:hover:bg-gray-900/50 border-2 border-transparent"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    activeFeature === index
                      ? "bg-gradient-to-br from-purple-600 to-pink-600 text-white"
                      : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                  }`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                    {activeFeature === index && (
                      <ul className="mt-4 space-y-2">
                        {feature.details.map((detail, idx) => (
                          <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Feature preview */}
          <motion.div
            key={activeFeature}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600 p-0.5">
              <div className="bg-gray-50 dark:bg-gray-950 rounded-2xl p-8">
                <div className="aspect-video bg-gray-200 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                  {(() => {
                    const Feature = features[activeFeature];
                    return <Feature.icon className="w-24 h-24 text-gray-400" />;
                  })()}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}