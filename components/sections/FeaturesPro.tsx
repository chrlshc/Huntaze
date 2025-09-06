"use client";

import { motion } from "framer-motion";
import { 
  MessageSquare, 
  Brain, 
  Shield, 
  BarChart3, 
  Zap, 
  Users, 
  Globe, 
  Lock,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle
} from "lucide-react";
import Image from "next/image";

const features = [
  {
    icon: Brain,
    title: "Turn fans into loyal customers",
    description: "AI that learns what keeps your fans engaged and subscribed",
    details: [
      "Learns from your best‑performing messages",
      "Drives faster, more consistent replies",
      "Never sleeps, never stops helping"
    ],
    gradient: "from-purple-600 to-pink-600",
    highlight: "From $3k to $8k/month (example)"
  },
  {
    icon: MessageSquare,
    title: "Scale without losing the personal touch",
    description: "Handle more fans with consistent quality",
    details: [
      "Instant responses to every fan",
      "Remembers conversation context",
      "Turns DMs into sales more often"
    ],
    gradient: "from-blue-600 to-cyan-600",
    highlight: "Automates thousands of messages daily"
  },
  {
    icon: Shield,
    title: "Compliance‑first by design",
    description: "Built with platform rules and safety guardrails",
    details: [
      "Compliance checks before sending",
      "Learns per‑platform guidelines",
      "You approve, you stay in control"
    ],
    gradient: "from-green-600 to-emerald-600",
    highlight: "Platform compliant"
  },
  {
    icon: BarChart3,
    title: "See what works, focus your time",
    description: "Understand the content and offers that perform",
    details: [
      "Forecast upcoming revenue",
      "Attribute sales to actions",
      "Get AI suggestions on what to post next"
    ],
    gradient: "from-orange-600 to-red-600",
    highlight: "Creators report 2–3x revenue growth"
  }
];

const stats = [
  { value: "+50%", label: "Time saved", icon: TrendingUp },
  { value: "2-3h", label: "Saved per day", icon: Clock },
  { value: "15min", label: "Setup", icon: Zap },
  { value: "GDPR", label: "Compliant", icon: Lock }
];

export function FeaturesPro() {
  return (
    <section className="py-20 md:py-32 bg-gray-50 dark:bg-gray-900">
      <div className="container-width">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-6 shadow-lg">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Built for busy creators</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Everything you need to grow<br />
            <span className="text-gradient bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">with less work</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Practical AI to save time, stay compliant, and focus on what matters
          </p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-lg"
            >
              <stat.icon className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gradient mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl overflow-hidden">
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center flex-shrink-0`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <ul className="space-y-3">
                    {feature.details.map((detail, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.2 + idx * 0.1 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-3"
                      >
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{detail}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Hover effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 dark:from-gray-800/0 dark:to-gray-700/10"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Integration showcase */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <h3 className="text-2xl font-bold mb-8">Works with your favorite platforms</h3>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {["Instagram", "TikTok", "Reddit", "OnlyFans", "Twitter"].map((platform) => (
              <motion.div
                key={platform}
                whileHover={{ scale: 1.1 }}
                className="px-6 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-md font-medium text-gray-700 dark:text-gray-300"
              >
                {platform}
              </motion.div>
            ))}
          </div>
          <p className="mt-8 text-xs text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Figures shown are examples reported by creators and not guarantees. Actual results vary based on audience, content, and effort.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
