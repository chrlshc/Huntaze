'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';

const metrics = [
  { label: 'Active Creators', value: 5847, suffix: '+', prefix: '' },
  { label: 'Messages Sent', value: 2.4, suffix: 'M+', prefix: '' },
  { label: 'Revenue Processed', value: 18, suffix: 'M+', prefix: '$' },
  { label: 'Time Saved Weekly', value: 20, suffix: ' hrs', prefix: '' }
];

function AnimatedNumber({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const duration = 2000; // 2 seconds
      const steps = 60;
      const stepValue = value / steps;
      let currentStep = 0;

      const timer = setInterval(() => {
        currentStep++;
        setCount(Math.min(stepValue * currentStep, value));
        
        if (currentStep >= steps) {
          clearInterval(timer);
          setCount(value);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [value, isInView]);

  return (
    <span ref={ref}>
      {prefix}{count.toFixed(value % 1 !== 0 ? 1 : 0)}{suffix}
    </span>
  );
}

export default function MetricsMinimal() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Trusted by thousands of creators
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join a community that's collectively earning millions while saving hours every day.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
                <AnimatedNumber value={metric.value} prefix={metric.prefix} suffix={metric.suffix} />
              </div>
              <p className="text-gray-600">{metric.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Social proof logos */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-20"
        >
          <p className="text-center text-sm text-gray-500 mb-8">Integrates seamlessly with</p>
          <div className="flex items-center justify-center gap-12 flex-wrap">
            {/* Platform logos */}
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}