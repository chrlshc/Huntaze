"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const platforms = [
  {
    name: "Instagram",
    features: [
      "Auto-reply to DMs",
      "Story mentions tracking",
      "Reel engagement boost",
      "Link-in-bio monetization"
    ],
    gradient: "from-pink-500 to-purple-500"
  },
  {
    name: "TikTok",
    features: [
      "Live stream assistant",
      "Comment management",
      "Viral content insights",
      "Creator fund optimization"
    ],
    gradient: "from-black to-gray-800"
  },
  {
    name: "OnlyFans",
    features: [
      "PPV automation",
      "Tip menu suggestions",
      "Fan relationship scoring",
      "Content vault management"
    ],
    gradient: "from-blue-500 to-cyan-500"
  }
];

export function PlatformIntegrations() {
  return (
    <section className="py-20 md:py-32 bg-white dark:bg-gray-950">
      <div className="container-width">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-sm font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-4">
            Platform integrations
          </p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Works where you work
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Native integrations with every major creator platform. One dashboard to rule them all.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {platforms.map((platform, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="h-full bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800">
                <div className={`inline-flex px-4 py-2 rounded-full bg-gradient-to-r ${platform.gradient} text-white font-semibold mb-6`}>
                  {platform.name}
                </div>
                <ul className="space-y-4">
                  {platform.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Plus Reddit, Fansly, Twitter, Telegram, and 10+ more platforms
          </p>
          <Button
            size="lg"
            variant="outline"
            className="border-gray-300 dark:border-gray-700"
          >
            See all integrations
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}