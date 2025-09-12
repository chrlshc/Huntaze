'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, BarChart3, DollarSign, Calendar, Users, Zap,
  Instagram, Twitter, Video, ChevronRight 
} from 'lucide-react';
import CountUp from 'react-countup';

const features = [
  {
    id: 'ai-chat',
    icon: MessageSquare,
    title: 'AI Chat Assistant',
    description: 'Responds instantly in your voice',
    color: 'purple',
    animation: 'chat'
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Smart Analytics',
    description: 'Track growth and revenue',
    color: 'blue',
    animation: 'chart'
  },
  {
    id: 'ppv-sales',
    icon: DollarSign,
    title: 'PPV Sales Boost',
    description: 'Automated upselling',
    color: 'green',
    animation: 'money'
  },
  {
    id: 'scheduler',
    icon: Calendar,
    title: 'Content Scheduler',
    description: 'Post at perfect times',
    color: 'orange',
    animation: 'calendar'
  },
  {
    id: 'fan-management',
    icon: Users,
    title: 'Fan Management',
    description: 'VIP segmentation',
    color: 'pink',
    animation: 'fans'
  },
  {
    id: 'multi-platform',
    icon: Zap,
    title: 'Multi-Platform',
    description: 'One dashboard for all',
    color: 'yellow',
    animation: 'platforms'
  }
];

const ChatAnimation = () => {
  const messages = ['Hey babe! 😘', 'How are you?', 'Miss you! 💕'];
  const [currentMessage, setCurrentMessage] = useState(0);

  return (
    <div className="space-y-2">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMessage}
          className="bg-purple-600 dark:bg-purple-500 text-white text-xs px-3 py-2 rounded-xl rounded-bl-none"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          onAnimationComplete={() => {
            setTimeout(() => {
              setCurrentMessage((prev) => (prev + 1) % messages.length);
            }, 2000);
          }}
        >
          {messages[currentMessage]}
        </motion.div>
      </AnimatePresence>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1 h-1 bg-purple-400 rounded-full"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
};

const ChartAnimation = () => {
  return (
    <div className="flex items-end gap-1 h-12">
      {[40, 65, 45, 80, 95, 70, 85].map((height, i) => (
        <motion.div
          key={i}
          className="w-2 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t"
          initial={{ height: 0 }}
          animate={{ height: `${height}%` }}
          transition={{ delay: i * 0.1, duration: 0.8, ease: "easeOut" }}
        />
      ))}
    </div>
  );
};

const MoneyAnimation = () => {
  const [value, setValue] = useState(0);

  return (
    <motion.div
      className="text-2xl font-bold text-green-400"
      onViewportEnter={() => setValue(547)}
    >
      $<CountUp end={value} duration={2.5} />
    </motion.div>
  );
};

const CalendarAnimation = () => {
  return (
    <div className="grid grid-cols-7 gap-1">
      {[...Array(28)].map((_, i) => (
        <motion.div
          key={i}
          className={`w-2 h-2 rounded-sm ${
            [7, 14, 21, 25].includes(i) ? 'bg-orange-400' : 'bg-gray-700'
          }`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.02 }}
        />
      ))}
    </div>
  );
};

const FansAnimation = () => {
  return (
    <div className="flex -space-x-2">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 border-2 border-gray-900"
          initial={{ scale: 0, x: -20 }}
          animate={{ scale: 1, x: 0 }}
          transition={{ delay: i * 0.1, type: "spring" }}
        />
      ))}
    </div>
  );
};

const PlatformsAnimation = () => {
  const platforms = [
    { icon: '💜', name: 'OF' },
    { icon: '📸', name: 'IG' },
    { icon: '🎵', name: 'TT' }
  ];
  const [current, setCurrent] = useState(0);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={current}
        className="text-3xl"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 180 }}
        transition={{ type: "spring" }}
        onAnimationComplete={() => {
          setTimeout(() => {
            setCurrent((prev) => (prev + 1) % platforms.length);
          }, 2000);
        }}
      >
        {platforms[current].icon}
      </motion.div>
    </AnimatePresence>
  );
};

const getAnimation = (type: string) => {
  switch (type) {
    case 'chat': return <ChatAnimation />;
    case 'chart': return <ChartAnimation />;
    case 'money': return <MoneyAnimation />;
    case 'calendar': return <CalendarAnimation />;
    case 'fans': return <FansAnimation />;
    case 'platforms': return <PlatformsAnimation />;
    default: return null;
  }
};

const getColorClasses = (color: string) => {
  const colors: Record<string, { bg: string; border: string; glow: string }> = {
    purple: { 
      bg: 'from-purple-600/20 to-purple-700/20', 
      border: 'border-purple-500/30',
      glow: '0 0 30px rgba(147, 51, 234, 0.3)'
    },
    blue: { 
      bg: 'from-blue-600/20 to-blue-700/20', 
      border: 'border-blue-500/30',
      glow: '0 0 30px rgba(59, 130, 246, 0.3)'
    },
    green: { 
      bg: 'from-green-600/20 to-green-700/20', 
      border: 'border-green-500/30',
      glow: '0 0 30px rgba(34, 197, 94, 0.3)'
    },
    orange: { 
      bg: 'from-orange-600/20 to-orange-700/20', 
      border: 'border-orange-500/30',
      glow: '0 0 30px rgba(251, 146, 60, 0.3)'
    },
    pink: { 
      bg: 'from-pink-600/20 to-pink-700/20', 
      border: 'border-pink-500/30',
      glow: '0 0 30px rgba(236, 72, 153, 0.3)'
    },
    yellow: { 
      bg: 'from-yellow-600/20 to-yellow-700/20', 
      border: 'border-yellow-500/30',
      glow: '0 0 30px rgba(250, 204, 21, 0.3)'
    }
  };
  return colors[color] || colors.purple;
};

export default function AnimatedFeatureCards() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feature, index) => {
        const colors = getColorClasses(feature.color);
        const Icon = feature.icon;

        return (
          <motion.div
            key={feature.id}
            className="relative group"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onMouseEnter={() => setHoveredCard(feature.id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            {/* Background glow */}
            <motion.div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ boxShadow: colors.glow }}
            />

            {/* Card content */}
            <motion.div
              className={`relative bg-gradient-to-br ${colors.bg} backdrop-blur-sm rounded-2xl p-6 border ${colors.border} h-full`}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              {/* Icon and animation container */}
              <div className="mb-6 h-16 flex items-center justify-between">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 flex justify-end">
                  {hoveredCard === feature.id && getAnimation(feature.animation)}
                </div>
              </div>

              {/* Text content */}
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>

              {/* Hover arrow */}
              <motion.div
                className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100"
                initial={{ x: -10 }}
                animate={{ x: hoveredCard === feature.id ? 0 : -10 }}
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </motion.div>
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}