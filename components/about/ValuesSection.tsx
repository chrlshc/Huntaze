'use client';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const values = [
  {
    icon: "🚀",
    title: "Constant Innovation",
    description: "We push the boundaries of technology to create exceptional experiences for creators."
  },
  {
    icon: "💡",
    title: "Simplicity First",
    description: "Intuitive interfaces that make business management accessible to everyone."
  },
  {
    icon: "🤝",
    title: "Human-Centered",
    description: "Technology serving human relationships, not the other way around."
  },
  {
    icon: "⚡",
    title: "Speed of Execution",
    description: "Lightning-fast results without compromising quality or security."
  },
  {
    icon: "🎯",
    title: "Creator Focus",
    description: "Every feature is built with creators' success as the primary goal."
  },
  {
    icon: "🔒",
    title: "Privacy & Trust",
    description: "Your data is sacred. We protect it with enterprise-grade security."
  }
];

export function ValuesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const
      }
    }
  };

  return (
    <section id="values" className="py-32 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="overline">Our Values</span>
          <h2 className="heading-1 mb-6">
            Principles That Drive Us Forward
          </h2>
          <p className="lead max-w-3xl mx-auto">
            These core values guide every decision, from product development to company culture.
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {values.map((value) => (
            <motion.div
              key={value.title}
              variants={itemVariants}
              className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              whileHover={{ scale: 1.02 }}
            >
              <motion.div 
                className="text-5xl mb-6"
                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                {value.icon}
              </motion.div>
              <h3 className="feature-title mb-4 text-gray-900">
                {value.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {value.description}
              </p>
              <motion.div
                className="mt-4 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                initial={{ width: 0 }}
                whileHover={{ width: "100%" }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}