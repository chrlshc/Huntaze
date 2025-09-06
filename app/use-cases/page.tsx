"use client";

import { motion } from "framer-motion";
import HeaderImproved from "@/src/components/header-improved";
import FooterImproved from "@/src/components/footer-improved";
import { Instagram, Video, DollarSign, Users, Clock, TrendingUp, MessageSquare, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const useCases = [
  {
    title: "Instagram DM Monetization",
    icon: Instagram,
    description: "Turn every DM into a sales opportunity",
    stats: {
      revenue: "+312%",
      time: "-85%",
      conversion: "4x"
    },
    features: [
      "Auto-reply to story mentions",
      "PPV content suggestions",
      "Tip menu automation",
      "Personalized upsells"
    ],
    testimonial: {
      content: "I went from spending 8 hours daily on DMs to 30 minutes. Revenue tripled in 2 months.",
      author: "Sarah K.",
      role: "127K Instagram followers"
    }
  },
  {
    title: "TikTok Live Streaming",
    icon: Video,
    description: "Maximize earnings during live streams",
    stats: {
      revenue: "+450%",
      time: "-90%",
      conversion: "6x"
    },
    features: [
      "Real-time chat management",
      "Gift thank-you automation",
      "Follow-up DM campaigns",
      "Cross-platform funneling"
    ],
    testimonial: {
      content: "My AI handles thousands of messages during streams. I focus on content, it handles sales.",
      author: "Mike T.",
      role: "89K TikTok followers"
    }
  },
  {
    title: "OnlyFans Automation",
    icon: DollarSign,
    description: "Scale your OF without burning out",
    stats: {
      revenue: "+580%",
      time: "-95%",
      conversion: "8x"
    },
    features: [
      "Mass message campaigns",
      "PPV vault management",
      "Rebill reminders",
      "VIP tier automation"
    ],
    testimonial: {
      content: "From $3k to $25k/month in 6 months. The AI knows exactly when and what to sell.",
      author: "Jessica R.",
      role: "Top 0.8% creator"
    }
  },
  {
    title: "Multi-Platform Management",
    icon: Users,
    description: "One dashboard for all your platforms",
    stats: {
      revenue: "+420%",
      time: "-80%",
      conversion: "5x"
    },
    features: [
      "Cross-platform analytics",
      "Unified inbox",
      "Content repurposing",
      "Fan journey tracking"
    ],
    testimonial: {
      content: "Managing 5 platforms used to be chaos. Now it's all automated and profitable.",
      author: "Alex D.",
      role: "Multi-platform creator"
    }
  }
];

const metrics = [
  {
    icon: Clock,
    value: "20+ hours",
    label: "Saved per week"
  },
  {
    icon: TrendingUp,
    value: "2-3x",
    label: "Revenue increase"
  },
  {
    icon: MessageSquare,
    value: "<1 sec",
    label: "Response time"
  },
  {
    icon: Zap,
    value: "24/7",
    label: "Always working"
  }
];

export default function UseCasesPage() {
  return (
    <>
      <HeaderImproved />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-purple-50 to-white dark:from-gray-950 dark:to-black">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              Built for
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                every creator
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400">
              See how creators like you are transforming their business with AI
            </p>
          </motion.div>
        </div>
      </section>

      {/* Metrics Bar */}
      <section className="py-12 bg-gray-50 dark:bg-gray-950 border-y border-gray-200 dark:border-gray-800">
        <div className="container-width">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {metrics.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <metric.icon className="w-8 h-8 mx-auto mb-3 text-purple-600" />
                <p className="text-3xl font-bold mb-1">{metric.value}</p>
                <p className="text-gray-600 dark:text-gray-400">{metric.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20">
        <div className="container-width">
          {useCases.map((useCase, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`mb-32 ${
                index % 2 === 0 ? "" : "md:flex-row-reverse"
              }`}
            >
              <div className="grid md:grid-cols-2 gap-12 items-center">
                {/* Content */}
                <div className={index % 2 !== 0 ? "md:order-2" : ""}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                      <useCase.icon className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold">{useCase.title}</h2>
                  </div>
                  
                  <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                    {useCase.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-6 mb-8">
                    <div>
                      <p className="text-3xl font-bold text-green-600">{useCase.stats.revenue}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Revenue increase</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-blue-600">{useCase.stats.time}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Time saved</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-purple-600">{useCase.stats.conversion}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Conversion rate</p>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {useCase.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-purple-600 rounded-full" />
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Testimonial */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6">
                    <p className="text-lg mb-4 italic">"{useCase.testimonial.content}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full" />
                      <div>
                        <p className="font-semibold">{useCase.testimonial.author}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{useCase.testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visual */}
                <div className={`relative ${index % 2 !== 0 ? "md:order-1" : ""}`}>
                  <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-3xl flex items-center justify-center">
                    <useCase.icon className="w-32 h-32 text-purple-600 opacity-20" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="container-width text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to transform your business?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of creators earning more while working less
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-gray-900 hover:bg-gray-100"
            >
              Start free trial
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              Book a demo
            </Button>
          </div>
        </div>
      </section>

      <FooterImproved />
    </>
  );
}