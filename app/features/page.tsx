"use client";

import { motion } from "framer-motion";
import { HeroLinear } from "@/components/sections/HeroLinear";
import HeaderImproved from "@/src/components/header-improved";
import FooterImproved from "@/src/components/footer-improved";
import { Brain, Zap, Shield, BarChart3, Users, Globe, MessageSquare, Calendar, DollarSign, Lock, Palette, Award } from "lucide-react";

const allFeatures = [
  {
    category: "AI Intelligence",
    icon: Brain,
    features: [
      {
        title: "Personality Mirroring",
        description: "AI learns your unique voice, humor, and selling style",
        icon: Brain
      },
      {
        title: "Smart Responses",
        description: "Context-aware replies that feel natural and engaging",
        icon: MessageSquare
      },
      {
        title: "Continuous Learning",
        description: "Improves conversion rates with every interaction",
        icon: Award
      }
    ]
  },
  {
    category: "Automation",
    icon: Zap,
    features: [
      {
        title: "24/7 Availability",
        description: "Never miss a message, even while you sleep",
        icon: Globe
      },
      {
        title: "Mass Messaging",
        description: "Send personalized campaigns to thousands instantly",
        icon: Users
      },
      {
        title: "Content Scheduling",
        description: "Plan and post content at optimal times automatically",
        icon: Calendar
      }
    ]
  },
  {
    category: "Revenue Optimization",
    icon: DollarSign,
    features: [
      {
        title: "Smart Upselling",
        description: "AI identifies perfect moments to suggest premium content",
        icon: DollarSign
      },
      {
        title: "Tip Optimization",
        description: "Maximize tips with personalized suggestions",
        icon: Award
      },
      {
        title: "PPV Automation",
        description: "Automatically send relevant paid content to interested fans",
        icon: Lock
      }
    ]
  },
  {
    category: "Analytics",
    icon: BarChart3,
    features: [
      {
        title: "Real-time Dashboard",
        description: "Track revenue, engagement, and growth metrics live",
        icon: BarChart3
      },
      {
        title: "Fan Insights",
        description: "Understand fan behavior and spending patterns",
        icon: Users
      },
      {
        title: "A/B Testing",
        description: "Test different approaches to maximize conversions",
        icon: Zap
      }
    ]
  },
  {
    category: "Security & Compliance",
    icon: Shield,
    features: [
      {
        title: "Platform Compliant",
        description: "100% ToS compliant across all platforms",
        icon: Shield
      },
      {
        title: "Data Encryption",
        description: "Bank-level security for all your content and data",
        icon: Lock
      },
      {
        title: "GDPR Compliant",
        description: "Full compliance with global privacy regulations",
        icon: Award
      }
    ]
  },
  {
    category: "Customization",
    icon: Palette,
    features: [
      {
        title: "Custom Workflows",
        description: "Build automated flows tailored to your strategy",
        icon: Zap
      },
      {
        title: "Multi-language Support",
        description: "Engage fans worldwide in 45+ languages",
        icon: Globe
      },
      {
        title: "Brand Voice Settings",
        description: "Fine-tune AI to match your exact personality",
        icon: Palette
      }
    ]
  }
];

export default function FeaturesPage() {
  return (
    <>
      <HeaderImproved />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-black text-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              Everything you need to
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
                dominate your niche
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-8">
              The most powerful creator platform ever built. Period.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="container-width">
          {allFeatures.map((category, categoryIndex) => (
            <motion.div
              key={categoryIndex}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
              viewport={{ once: true }}
              className="mb-20"
            >
              {/* Category Header */}
              <div className="flex items-center gap-4 mb-12">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
                  <category.icon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold">{category.category}</h2>
              </div>

              {/* Features in Category */}
              <div className="grid md:grid-cols-3 gap-6">
                {category.features.map((feature, featureIndex) => (
                  <motion.div
                    key={featureIndex}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: featureIndex * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-white dark:bg-black rounded-2xl p-8 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow"
                  >
                    <feature.icon className="w-12 h-12 text-purple-600 mb-4" />
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="container-width text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to 10x your income?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join 10,000+ creators already using Huntaze
          </p>
          <a
            href="/auth"
            className="inline-block bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Start free trial
          </a>
        </div>
      </section>

      <FooterImproved />
    </>
  );
}