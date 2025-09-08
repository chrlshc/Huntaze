'use client';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export function StorySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const timeline = [
    {
      year: '2022',
      title: 'The Spark',
      description: 'Frustrated by juggling multiple platforms and losing hours to busywork, our founders decided there had to be a better way.'
    },
    {
      year: '2023',
      title: 'Building Magic',
      description: 'We assembled a team of dreamers and builders to create the all-in-one platform creators deserve.'
    },
    {
      year: '2024',
      title: 'Growing Together',
      description: 'Today, thousands of creators trust Huntaze to manage their business, saving 20+ hours per week.'
    }
  ];

  return (
    <section id="story" className="py-32 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="overline">Our Journey</span>
          <h2 className="heading-1 mb-6">
            From Frustration to Innovation
          </h2>
          <p className="lead max-w-3xl mx-auto">
            Every great product starts with a problem. Ours began when we saw creators 
            drowning in administrative tasks instead of doing what they love.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="space-y-8">
              {timeline.map((item, index) => (
                <motion.div
                  key={item.year}
                  initial={{ opacity: 0, x: -30 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className="flex gap-6"
                >
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                      {item.year}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold mb-2 text-gray-900">
                      {item.title}
                    </h3>
                    <p className="text-gray-600">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            <div className="aspect-square relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl transform rotate-3"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl transform -rotate-3"></div>
              <div className="relative bg-white rounded-3xl shadow-xl p-8 h-full flex flex-col justify-center">
                <blockquote className="text-2xl font-medium text-gray-900 mb-6">
                  "We believe creators should focus on creating, not on spreadsheets and scheduling."
                </blockquote>
                <cite className="text-gray-600 not-italic">
                  <div className="font-semibold">The Huntaze Team</div>
                  <div className="text-sm">Building the future of creator business</div>
                </cite>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}