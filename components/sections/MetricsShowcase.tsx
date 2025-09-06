"use client";

import { motion } from "framer-motion";
import { TrendingUp, Clock, Users, DollarSign } from "lucide-react";

const metrics = [
  {
    label: "Response time",
    value: "<1s",
    change: "10x faster than manual",
    icon: Clock,
    color: "text-blue-600"
  },
  {
    label: "Conversion rate",
    value: "32%",
    change: "vs 8% industry average",
    icon: TrendingUp,
    color: "text-green-600"
  },
  {
    label: "Active conversations",
    value: "∞",
    change: "No limits, ever",
    icon: Users,
    color: "text-purple-600"
  },
  {
    label: "Revenue per creator",
    value: "2-3x",
    change: "Average increase",
    icon: DollarSign,
    color: "text-orange-600"
  }
];

export function MetricsShowcase() {
  return (
    <section className="py-20 md:py-32 bg-black text-white overflow-hidden">
      <div className="container-width">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Numbers that matter
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Real-time performance metrics from our platform
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 hover:border-gray-700 transition-all">
                <metric.icon className={`w-8 h-8 ${metric.color} mb-4`} />
                <p className="text-sm text-gray-400 mb-2">{metric.label}</p>
                <p className="text-4xl font-bold mb-2">{metric.value}</p>
                <p className="text-sm text-gray-500">{metric.change}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}