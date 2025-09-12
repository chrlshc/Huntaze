'use client';

import { useState, useEffect } from 'react';
// import CountUp from 'react-countup'; // Désactivé pour les performances
import { 
  MessageSquare, 
  TrendingUp, 
  Calendar, 
  Users, 
  BarChart3, 
  Zap,
  Brain,
  Shield,
  Globe,
  DollarSign,
  Clock,
  CheckCircle,
  Crown as CrownIcon
} from 'lucide-react';

const features = [
  {
    id: 'ai-chat',
    title: 'AI Chat Assistant',
    description: 'Responds to fans 24/7 in your voice with 98% accuracy',
    improvement: 98,
    icon: Brain,
    size: 'large', // 2x2 grid
    demo: true,
    gradient: 'from-purple-600/20 to-pink-600/20',
    borderGradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'smart-pricing',
    title: 'Smart Pricing',
    description: 'Dynamic pricing optimization based on fan behavior patterns',
    improvement: 42,
    icon: TrendingUp,
    size: 'tall', // 1x2 grid
    gradient: 'from-green-600/20 to-emerald-600/20',
    borderGradient: 'from-green-500 to-emerald-500',
  },
  {
    id: 'scheduler',
    title: 'Content Scheduler',
    description: 'Plan and automate your entire content strategy',
    improvement: 67,
    icon: Calendar,
    size: 'tall', // 1x2 grid
    gradient: 'from-blue-600/20 to-cyan-600/20',
    borderGradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'vip-detection',
    title: 'VIP Detection',
    description: 'AI identifies and nurtures high-value fans automatically',
    improvement: 35,
    icon: CrownIcon,
    size: 'small', // 1x1 grid
    gradient: 'from-yellow-600/20 to-orange-600/20',
    borderGradient: 'from-yellow-500 to-orange-500',
  },
  {
    id: 'analytics',
    title: 'Analytics Dashboard',
    description: 'Real-time insights and actionable metrics',
    improvement: 0, // No improvement badge
    icon: BarChart3,
    size: 'small', // 1x1 grid
    gradient: 'from-indigo-600/20 to-purple-600/20',
    borderGradient: 'from-indigo-500 to-purple-500',
  },
  {
    id: 'multi-platform',
    title: 'Multi-Platform Sync',
    description: 'Seamlessly manage all your platforms in one place',
    improvement: 89,
    icon: Globe,
    size: 'small', // 1x1 grid
    gradient: 'from-pink-600/20 to-rose-600/20',
    borderGradient: 'from-pink-500 to-rose-500',
  },
];

// AI Chat Demo Component
const AIChatDemo = () => {
  const [messages, setMessages] = useState([
    { type: 'fan', text: 'Hey beautiful, are you free tonight? 😍', time: '2:34 PM', isAI: false }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  
  const aiResponses = [
    "Hey babe! I'd love to spend time with you tonight 💕 Check out my exclusive content - I have something special just for you!",
    "Aww you're so sweet! 😊 I'm creating some amazing content right now. Want a sneak peek? It's 20% off for the next hour!",
    "Hi love! Tonight I'm all yours 💋 Just posted something that I think you'll really enjoy. Can't wait to hear what you think!"
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTyping(true);
      const response = aiResponses[Math.floor(Math.random() * aiResponses.length)];
      
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { 
          type: 'ai', 
          text: response, 
          time: '2:34 PM',
          isAI: true 
        }]);
        
        // Simulate another fan message after AI response
        setTimeout(() => {
          const fanMessages = [
            "Wow, I'd love that! 😊",
            "You're amazing! Tell me more 💕",
            "Can't wait to see it!"
          ];
          setMessages(prev => [...prev, { 
            type: 'fan', 
            text: fanMessages[Math.floor(Math.random() * fanMessages.length)], 
            time: '2:35 PM',
            isAI: false,
          }]);
        }, 3000);
      }, 2000);
    }, 1500);

    return () => clearTimeout(timer);
  }, [messages.length]);

  return (
    <div className="mt-4 bg-gray-900/50 rounded-xl p-4 backdrop-blur-sm">
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === 'ai' ? 'justify-end' : 'justify-start'}`}
          >
              <div className={`max-w-[80%] ${message.type === 'ai' ? 'order-2' : ''}`}>
                <div className={`rounded-2xl px-4 py-2 ${
                  message.type === 'ai' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-800 text-gray-200'
                }`}>
                  {message.isAI && (
                    <div className="flex items-center gap-2 mb-1">
                      <Brain className="w-3 h-3" />
                      <span className="text-xs font-medium">AI Assistant</span>
                    </div>
                  )}
                  <p className="text-sm">{message.text}</p>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
                  {message.time}
                  {message.type === 'ai' && (
                    <span className="ml-2 text-purple-400">✓✓</span>
                  )}
                </div>
              </div>
          </div>
        ))}
        
        {isTyping && (
          <div
            className="flex justify-end"
          >
            <div className="bg-purple-600/80 rounded-2xl px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-white dark:bg-gray-800 rounded-full opacity-50"
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-green-400" />
          AI Active
        </span>
        <button className="text-purple-400 hover:text-purple-300 transition-colors">
          Edit Responses →
        </button>
      </div>
    </div>
  );
};

// Smart Pricing Demo
const SmartPricingDemo = () => {
  const [price, setPrice] = useState(15);
  const [revenue, setRevenue] = useState(2250);
  
  useEffect(() => {
    setRevenue(price * 150 * (1 + (price - 15) * 0.05));
  }, [price]);
  
  return (
    <div className="mt-4 space-y-4">
      <div className="bg-gray-900/50 rounded-lg p-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Suggested Price</span>
          <span className="text-2xl font-bold text-green-400">${price}</span>
        </div>
        <input
          type="range"
          min="5"
          max="50"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          className="w-full"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-900/50 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-400">Est. Revenue</div>
          <div className="text-lg font-bold text-white">
            ${revenue.toFixed(0)}/mo
          </div>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-2 text-center">
          <div className="text-xs text-gray-400">Conversion</div>
          <div className="text-lg font-bold text-purple-400">
            {(15 + (price - 15) * 0.3).toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
};

// Content Scheduler Demo
const SchedulerDemo = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const scheduled = {
    Mon: 2,
    Wed: 3,
    Fri: 2,
    Sat: 4,
    Sun: 3
  };
  
  return (
    <div className="mt-4">
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <div key={day} className="text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{day}</div>
            <div
              className={`h-12 rounded-lg flex items-center justify-center text-xs font-bold ${
                scheduled[day as keyof typeof scheduled] 
                  ? 'bg-purple-600/30 border border-purple-500/50 text-purple-300' 
                  : 'bg-gray-800/50 text-gray-600'
              }`}
            >
              {scheduled[day as keyof typeof scheduled] || '-'}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-center text-xs text-gray-400">
        14 posts scheduled this week
      </div>
    </div>
  );
};

const FeatureCard = ({ feature, index, isHovered, onHover }: any) => {
  const Icon = feature.icon;
  
  // Determine grid span based on size
  const gridClass = {
    large: 'col-span-2 row-span-2',
    tall: 'col-span-1 row-span-2',
    small: 'col-span-1 row-span-1',
  }[feature.size];

  return (
    <div
      className={`${gridClass} relative bg-gradient-to-br ${feature.gradient} backdrop-blur-sm rounded-2xl overflow-hidden cursor-pointer group hover:scale-[1.02] hover:-translate-y-[5px] transition-transform`}
      onMouseEnter={() => onHover(feature.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Animated border gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${feature.borderGradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
      
      {/* Border */}
      <div className="absolute inset-[1px] bg-gray-900 rounded-2xl" />
      
      {/* Content */}
      <div className="relative p-6 h-full flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          {/* Icon */}
          <div 
            className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center`}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>

          {/* Improvement Badge */}
          {feature.improvement > 0 && (
            <div 
              className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-bold border border-green-500/30"
            >
              +{feature.improvement}%
            </div>
          )}
        </div>

        {/* Content */}
        <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
        <p className="text-gray-400 text-sm flex-grow">{feature.description}</p>

        {/* Demo components for specific features */}
        {feature.id === 'ai-chat' && feature.size === 'large' && <AIChatDemo />}
        {feature.id === 'smart-pricing' && <SmartPricingDemo />}
        {feature.id === 'scheduler' && <SchedulerDemo />}
        
        {/* Hover effect indicator */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 transition-transform duration-300 origin-left ${isHovered ? 'scale-x-100' : 'scale-x-0'}`}
        />
      </div>
    </div>
  );
};

export default function AIFeaturesBentoGrid() {
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const activeFeatures = features.length; // Valeur statique au lieu d'animée

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-gray-950 via-black to-gray-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 -right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full filter blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 -left-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full filter blur-3xl animate-pulse" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div 
          className="text-center mb-12"
        >
          <div 
            className="inline-flex items-center gap-2 bg-blue-900/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-blue-500/30 hover:scale-105 transition-transform"
          >
            <Zap className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="text-sm text-blue-300 font-medium">AI-Powered Automation</span>
          </div>
          
          <h2 className="text-5xl lg:text-6xl font-bold text-white mb-4">
            Your AI{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Command Center
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Control everything from one place. Let AI handle the repetitive tasks while you focus on creating.
          </p>
          
          {/* Active features counter */}
          <div 
            className="mt-6 inline-flex items-center gap-2 text-sm text-gray-400"
          >
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>
              {activeFeatures} features working 24/7 for you
            </span>
          </div>
        </div>

        {/* Bento Grid - Asymmetric Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[200px]">
          {features.map((feature, index) => (
            <FeatureCard 
              key={feature.id}
              feature={feature}
              index={index}
              isHovered={hoveredFeature === feature.id}
              onHover={setHoveredFeature}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div
          className="text-center mt-12"
        >
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            See how creators are saving <span className="text-purple-600 font-semibold">20+ hours</span> per week
          </p>
          <button
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold group relative overflow-hidden hover:scale-105 active:scale-95 transition-transform"
          >
            <span
              className="absolute inset-0 bg-white dark:bg-gray-800 opacity-20 -translate-x-full group-hover:translate-x-full transition-transform duration-500"
            />
            <Brain className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Explore All Features</span>
          </button>
        </div>
      </div>
    </section>
  );
}
