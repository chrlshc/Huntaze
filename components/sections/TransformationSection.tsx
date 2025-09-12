'use client';

import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Clock, MessageSquare, DollarSign } from 'lucide-react';

export default function TransformationSection() {
  const transformations = [
    {
      icon: Clock,
      before: "40+ hours/week responding manually",
      after: "2-3 hours of supervision per week",
      metric: "-93%",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: MessageSquare,
      before: "50-100 messages/day managed alone",
      after: "500+ automated conversations/day",
      metric: "10x",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: DollarSign,
      before: "Fixed prices without strategy",
      after: "AI-optimized dynamic pricing",
      metric: "+32%",
      color: "from-green-500 to-emerald-500"
    }
  ];

  return (
    <section className="py-20 px-4 bg-black relative overflow-hidden">
      {/* Background pattern - More subtle */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              The transformation our creators experience
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              From burnout to efficiency. See how Huntaze transforms 
              your daily workflow in just days.
            </p>
          </motion.div>
        </div>

        {/* Transformation Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {transformations.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="relative group"
            >
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800 hover:border-gray-700 transition-all">
                {/* Icon with gradient background */}
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${item.color} p-0.5 mb-6`}>
                  <div className="w-full h-full bg-gray-900 rounded-xl flex items-center justify-center">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Before State */}
                <div className="mb-6">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">BEFORE</p>
                  <p className="text-gray-500 dark:text-gray-400 opacity-80">{item.before}</p>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center mb-6">
                  <ArrowRight className="w-6 h-6 text-purple-500" />
                </div>

                {/* After State */}
                <div className="mb-6">
                  <p className="text-sm text-purple-400 mb-2">AFTER</p>
                  <p className="text-white font-medium">{item.after}</p>
                </div>

                {/* Metric */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${item.color} bg-opacity-10`}>
                  <TrendingUp className="w-4 h-4 text-white" />
                  <span className="text-white font-bold">{item.metric}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-gray-400 mb-6">
            Join 5,000+ creators who have already transformed their business
          </p>
          <a
            href="/onboarding"
            className="cta-primary"
          >
            Start your transformation
            <ArrowRight className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}