'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  MessageCircle, 
  BarChart3, 
  DollarSign, 
  Calendar, 
  Users, 
  Shield,
  TrendingUp,
  Zap
} from 'lucide-react';
import MetricCounter from '@/components/mockups/MetricCounter';
import AnimatedCard from '@/components/ui/AnimatedCard';
import WorkflowPreview from '@/components/sections/WorkflowPreview';

// Mini chart animation
const MiniChartAnimation = () => {
  const data = [20, 45, 30, 70, 55, 85, 90];
  const { ref, inView } = useInView({ triggerOnce: true });
  
  return (
    <div ref={ref} className="flex items-end gap-1 h-16 mt-4">
      {data.map((value, i) => (
        <motion.div
          key={i}
          className="bg-gradient-to-t from-purple-500 to-purple-400 w-3 rounded-t"
          initial={{ height: 0 }}
          animate={inView ? { height: `${value}%` } : { height: 0 }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
        />
      ))}
    </div>
  );
};

// Mini chat bubbles animation
const MiniChatAnimation = () => {
  const { ref, inView } = useInView({ triggerOnce: true });
  
  return (
    <div ref={ref} className="space-y-2 mt-4">
      <motion.div
        className="bg-gray-800 rounded-lg p-2 text-xs max-w-[80%]"
        initial={{ opacity: 0, x: -20 }}
        animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
        transition={{ delay: 0.2 }}
      >
        Hey! 👋
      </motion.div>
      <motion.div
        className="bg-purple-600 dark:bg-purple-500 rounded-lg p-2 text-xs max-w-[80%] ml-auto"
        initial={{ opacity: 0, x: 20 }}
        animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
        transition={{ delay: 0.4 }}
      >
        Hi babe! 💕
      </motion.div>
    </div>
  );
};

// Calendar animation
const MiniCalendarAnimation = () => {
  const { ref, inView } = useInView({ triggerOnce: true });
  
  return (
    <div ref={ref} className="grid grid-cols-7 gap-1 mt-4">
      {[...Array(14)].map((_, i) => (
        <motion.div
          key={i}
          className={`h-3 rounded-sm ${
            [3, 7, 10, 13].includes(i) ? 'bg-purple-500' : 'bg-gray-800'
          }`}
          initial={{ scale: 0 }}
          animate={inView ? { scale: 1 } : { scale: 0 }}
          transition={{ delay: i * 0.05 }}
        />
      ))}
    </div>
  );
};

const features = [
  {
    title: 'Real-time AI Chat',
    description: 'AI responds 24/7 in your voice',
    icon: MessageCircle,
    color: 'from-purple-500 to-purple-600',
    animation: <MiniChatAnimation />
  },
  {
    title: 'Analytics Dashboard',
    description: 'Track revenue & growth metrics',
    icon: BarChart3,
    color: 'from-blue-500 to-blue-600',
    animation: <MiniChartAnimation />
  },
  {
    title: 'Smart PPV Sales',
    description: 'Maximize earnings per fan',
    icon: DollarSign,
    color: 'from-green-500 to-green-600',
    animation: (
      <div className="text-3xl font-bold mt-4">
        <MetricCounter start={0} end={547} prefix="$" duration={2} />
      </div>
    )
  },
  {
    title: 'Content Scheduler',
    description: 'Plan posts across platforms',
    icon: Calendar,
    color: 'from-pink-500 to-pink-600',
    animation: <MiniCalendarAnimation />
  },
  {
    title: 'Fan Management',
    description: 'Track VIPs & top spenders',
    icon: Users,
    color: 'from-orange-500 to-orange-600',
    animation: (
      <div className="flex -space-x-2 mt-4">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-gray-900"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.1 }}
          />
        ))}
      </div>
    )
  },
  {
    title: 'Multi-Platform',
    description: 'OnlyFans, Instagram, TikTok+',
    icon: Zap,
    color: 'from-yellow-500 to-yellow-600',
    animation: (
      <div className="flex gap-2 mt-4">
        {['OF', 'IG', 'TT'].map((platform, i) => (
          <motion.div
            key={platform}
            className="px-3 py-1 bg-gray-800 rounded text-xs font-semibold"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2 }}
          >
            {platform}
          </motion.div>
        ))}
      </div>
    )
  }
];

export default function FeaturesGrid() {
  return (
    <section className="py-20 bg-gray-950">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold mb-4">Everything you need to scale</h2>
          <p className="text-xl text-gray-400">Powerful features that grow your business</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main feature - Workflow Preview (large card) */}
          <div className="lg:col-span-2">
            <AnimatedCard>
              <WorkflowPreview />
            </AnimatedCard>
          </div>

          {/* Side features */}
          <div className="space-y-6">
            {features.slice(0, 2).map((feature, index) => {
              const Icon = feature.icon;
              return (
                <AnimatedCard key={feature.title} delay={index * 0.1}>
                  <div className="p-6">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-400 text-sm">{feature.description}</p>
                    {feature.animation}
                  </div>
                </AnimatedCard>
              );
            })}
          </div>
        </div>

        {/* Bottom features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {features.slice(2).map((feature, index) => {
            const Icon = feature.icon;
            return (
              <AnimatedCard key={feature.title} delay={(index + 2) * 0.1}>
                <div className="p-6">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                  {feature.animation}
                </div>
              </AnimatedCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}