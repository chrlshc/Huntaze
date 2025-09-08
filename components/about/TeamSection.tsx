'use client';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';

const team = [
  {
    name: 'Alex Chen',
    role: 'Co-Founder & CEO',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    bio: 'Former creator turned entrepreneur, passionate about empowering creators worldwide.'
  },
  {
    name: 'Sarah Johnson',
    role: 'Co-Founder & CTO',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    bio: 'Engineering wizard with 10+ years building scalable platforms.'
  },
  {
    name: 'Marcus Williams',
    role: 'Head of Product',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus',
    bio: 'Design thinker obsessed with creating delightful user experiences.'
  },
  {
    name: 'Emily Rodriguez',
    role: 'Head of Growth',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    bio: 'Growth strategist helping creators maximize their potential.'
  }
];

export function TeamSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className="overline">Meet the Team</span>
          <h2 className="heading-1 mb-6">
            The Humans Behind Huntaze
          </h2>
          <p className="lead max-w-3xl mx-auto">
            A diverse team of creators, engineers, and dreamers working together to build 
            something extraordinary.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center group"
            >
              <motion.div 
                className="mb-6 relative overflow-hidden rounded-full mx-auto w-48 h-48"
                whileHover={{ scale: 1.05 }}
              >
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover"
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-t from-purple-600/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                {member.name}
              </h3>
              <p className="text-purple-600 font-medium mb-3">
                {member.role}
              </p>
              <p className="text-gray-600 text-sm">
                {member.bio}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 text-center"
        >
          <h3 className="text-2xl font-semibold mb-6 text-gray-900">
            Want to Join Our Mission?
          </h3>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            We're always looking for talented individuals who share our passion for 
            empowering creators. Check out our open positions.
          </p>
          <a 
            href="/careers" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300"
          >
            View Open Positions
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}