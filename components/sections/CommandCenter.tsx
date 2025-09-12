'use client';
import { Sparkles, MessageSquare, Heart, DollarSign, Send, Zap, Crown, Star, Brain, Activity, TrendingUp, Clock } from 'lucide-react';
import PhoneMockup from '@/components/mockups/PhoneMockup';
import { useState, useEffect } from 'react';
// import CountUp from 'react-countup'; // Désactivé pour les performances

// Tailwind cannot parse dynamic class names reliably; map colors to static classes
const colorClasses: Record<string, { bg: string; text: string; hoverBorder: string; border: string; glow: string }> = {
  purple: { 
    bg: 'bg-purple-500/20', 
    text: 'text-purple-400', 
    hoverBorder: 'hover:border-purple-500/50', 
    border: 'border-purple-500/30',
    glow: 'hover:shadow-purple-500/20'
  },
  blue: { 
    bg: 'bg-blue-500/20', 
    text: 'text-blue-400', 
    hoverBorder: 'hover:border-blue-500/50', 
    border: 'border-blue-500/30',
    glow: 'hover:shadow-blue-500/20'
  },
  green: { 
    bg: 'bg-green-500/20', 
    text: 'text-green-400', 
    hoverBorder: 'hover:border-green-500/50', 
    border: 'border-green-500/30',
    glow: 'hover:shadow-green-500/20'
  },
  yellow: { 
    bg: 'bg-yellow-500/20', 
    text: 'text-yellow-400', 
    hoverBorder: 'hover:border-yellow-500/50', 
    border: 'border-yellow-500/30',
    glow: 'hover:shadow-yellow-500/20'
  },
};

// AI Activity Feed
const aiActivities = [
  { id: 1, type: 'reply', message: 'Replied to 12 fans', time: 'Just now', icon: MessageSquare },
  { id: 2, type: 'tip', message: '$50 tip received', time: '2m ago', icon: DollarSign },
  { id: 3, type: 'vip', message: 'New VIP identified', time: '5m ago', icon: Crown },
  { id: 4, type: 'campaign', message: 'Campaign optimized', time: '8m ago', icon: TrendingUp },
];

const ActionCard = ({ icon: Icon, title, description, color, delay, metric }: any) => {
  const colors = colorClasses[color] || colorClasses.purple;
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      className={`bg-white rounded-xl p-4 border border-gray-200 ${colors.hoverBorder} transition-all cursor-pointer hover:shadow-lg hover:-translate-y-[5px] hover:scale-[1.02] ${colors.glow}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <div 
          className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center mb-3`}
        >
          <Icon className={`w-5 h-5 ${colors.text}`} />
        </div>
        {metric && (
          <div
            className="absolute -top-2 -right-2 bg-black/80 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-bold"
          >
            <span className={colors.text}>+{metric}%</span>
          </div>
        )}
      </div>
      <h4 className="font-semibold mb-1 text-gray-900 dark:text-white">{title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      {isHovered && (
        <div
          className={`h-1 ${colors.bg} rounded-full mt-2 w-full`}
        />
      )}
    </div>
  );
};

const CommandInterface = () => {
  const [activeMessages, setActiveMessages] = useState(245);
  const [conversions, setConversions] = useState(87);
  const [earnings, setEarnings] = useState(3420);
  const [aiStatus, setAiStatus] = useState('thinking');
  const [currentActivity, setCurrentActivity] = useState(0);
  
  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMessages(prev => prev + Math.floor(Math.random() * 3));
      if (Math.random() > 0.7) {
        setConversions(prev => prev + 1);
        setEarnings(prev => prev + Math.floor(Math.random() * 100) + 20);
      }
      setAiStatus(prev => {
        const statuses = ['thinking', 'replying', 'analyzing', 'optimizing'];
        const currentIndex = statuses.indexOf(prev);
        return statuses[(currentIndex + 1) % statuses.length];
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Rotate activities
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentActivity((prev) => (prev + 1) % aiActivities.length);
    }, 2500);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 h-full border border-gray-200 dark:border-gray-700 shadow-lg">
      {/* Header with animated status */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="relative"
          >
            <Brain className="w-6 h-6 text-purple-400" />
            <div
              className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
            />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Command Center</h3>
        </div>
        <div 
          className="flex items-center gap-2 bg-purple-50 dark:bg-gray-900 px-3 py-1 rounded-full"
        >
          <Activity className="w-3 h-3 text-purple-400" />
          <span className="text-xs text-purple-600 font-medium">{aiStatus}</span>
        </div>
      </div>
      
      {/* Real-time AI Activity Feed */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">AI Activity</span>
          <div
            className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
          />
        </div>
          <div
            className="flex items-center gap-2"
          >
            {(() => {
              const activity = aiActivities[currentActivity];
              const Icon = activity.icon;
              return (
                <>
                  <Icon className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-900 dark:text-white">{activity.message}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">{activity.time}</span>
                </>
              );
            })()}
          </div>
      </div>

      {/* Quick actions with real-time toggles */}
      <div className="space-y-3 mb-6">
        <div 
          className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200 hover:scale-[1.02] transition-transform"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Smart Reply Mode</span>
            </div>
            <div
              className="relative w-12 h-6 bg-purple-600 dark:bg-purple-500 rounded-full p-1 cursor-pointer flex justify-end"
            >
              <div 
                className="w-4 h-4 bg-white dark:bg-gray-800 rounded-full shadow-lg animate-pulse"
              />
              <div
                className="absolute inset-0 bg-purple-400 rounded-full opacity-30 animate-ping"
              />
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">AI responds instantly to all messages</p>
        </div>

        <div className="flex gap-2">
          <button 
            className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700 hover:scale-105 active:scale-95"
          >
            <Heart className="w-4 h-4 mx-auto mb-1 text-pink-400" />
            <span className="text-xs">Send Hearts</span>
          </button>
          <button 
            className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700 hover:scale-105 active:scale-95"
          >
            <Send className="w-4 h-4 mx-auto mb-1 text-blue-400" />
            <span className="text-xs">Mass Message</span>
          </button>
        </div>
      </div>

      {/* Active campaigns with real-time metrics */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Active Campaigns</h4>
        
        <div 
          className="relative bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 rounded-lg p-3 border border-purple-200 overflow-hidden animate-pulse"
        >
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-200/30 to-transparent animate-shimmer"
          />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2 text-gray-900 dark:text-white">
                Valentine's Day Special
                <span
                  className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"
                />
              </span>
              <span className="text-xs text-green-400 font-bold">Live</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span 
                className="text-gray-600 dark:text-gray-400 animate-pulse"
              >
                {activeMessages} sent
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {conversions} converted
              </span>
              <span className="text-green-400 font-bold">
                ${earnings.toLocaleString()}
              </span>
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                style={{ width: `${(conversions / activeMessages) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div 
          className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:border-yellow-300 transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-2 text-gray-900 dark:text-white">
              Welcome Series
              <Clock className="w-3 h-3 text-yellow-400" />
            </span>
            <span className="text-xs text-yellow-400">Scheduled</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full bg-yellow-400/20 animate-pulse"
              />
              Starts in 2h
            </span>
            <span>150 recipients</span>
          </div>
        </div>
        
        {/* AI Performance Metrics */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div 
            className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center hover:scale-105 transition-transform"
          >
            <div className="text-xs text-gray-600 dark:text-gray-400">Response Time</div>
            <div className="text-sm font-bold text-purple-400">0.8s</div>
          </div>
          <div 
            className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center hover:scale-105 transition-transform"
          >
            <div className="text-xs text-gray-600 dark:text-gray-400">Accuracy</div>
            <div className="text-sm font-bold text-green-400">98.5%</div>
          </div>
          <div 
            className="bg-gray-50 dark:bg-gray-900 rounded-lg p-2 text-center hover:scale-105 transition-transform"
          >
            <div className="text-xs text-gray-600 dark:text-gray-400">Saved Time</div>
            <div className="text-sm font-bold text-blue-400">24h</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Floating AI particles - Now static
const AIParticle = ({ delay }: { delay: number }) => {
  const randomX = Math.random() * 400 - 200;
  const randomY = Math.random() * 400 - 200;
  return (
    <div
      className="absolute w-1 h-1 bg-purple-600 dark:bg-purple-500 rounded-full opacity-70"
      style={{
        left: `${randomX}px`,
        top: `${randomY}px`,
      }}
    />
  );
};

export default function CommandCenter() {
  const [showParticles, setShowParticles] = useState(false);
  
  useEffect(() => {
    setShowParticles(true);
  }, []);
  
  return (
    <section className="relative py-20 bg-white dark:bg-gray-800 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gray-50 dark:bg-gray-900 opacity-50" />
      <div
        className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-purple-200/30 rounded-full blur-3xl"
      />
      <div
        className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-pink-200/30 rounded-full blur-3xl"
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <div
          className="text-center mb-16"
        >
          <div 
            className="inline-flex items-center gap-2 bg-purple-50 dark:bg-gray-900 text-purple-600 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-purple-200 hover:scale-105 transition-transform"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Automation</span>
            <div
              className="w-2 h-2 bg-purple-600 dark:bg-purple-500 rounded-full animate-pulse"
            />
          </div>
          
          <h2 className="text-4xl lg:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
            Your AI Command Center
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Control everything from one place. Let AI handle the repetitive tasks while you focus on creating.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Phone mockup with command interface */}
          <div
            className="relative"
          >
            <div className="relative">
              <PhoneMockup variant="iphone15pro">
                <CommandInterface />
              </PhoneMockup>
              
              {/* Floating particles around phone */}
              {showParticles && [...Array(10)].map((_, i) => (
                <AIParticle key={i} delay={i * 0.5} />
              ))}
            </div>
            
            {/* Floating action indicators with enhanced animations */}
            <div
              className="absolute -top-8 -right-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-4 shadow-2xl shadow-purple-500/50"
            >
              <Zap className="w-6 h-6 text-white" />
            </div>
            
            <div
              className="absolute -bottom-8 -left-8 bg-gradient-to-br from-pink-600 to-pink-700 rounded-2xl p-4 shadow-2xl shadow-pink-500/50"
            >
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            
            <div
              className="absolute top-1/2 -right-16 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-3 shadow-2xl shadow-green-500/50"
            >
              <DollarSign className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Features grid with enhanced animations */}
          <div className="grid sm:grid-cols-2 gap-4">
            <ActionCard
              icon={Crown}
              title="VIP Management"
              description="Automatically identify and nurture your highest-value fans"
              color="purple"
              delay={0.1}
              metric={42}
            />
            <ActionCard
              icon={MessageSquare}
              title="Smart Replies"
              description="AI responds instantly in your voice, 24/7"
              color="blue"
              delay={0.2}
              metric={98}
            />
            <ActionCard
              icon={DollarSign}
              title="Price Optimization"
              description="Dynamic pricing based on fan behavior"
              color="green"
              delay={0.3}
              metric={35}
            />
            <ActionCard
              icon={Star}
              title="Content Scheduling"
              description="Plan and automate your content strategy"
              color="yellow"
              delay={0.4}
              metric={67}
            />
          </div>
        </div>

        {/* Stats bar */}
        <div
          className="mt-16 grid grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {[
            { label: 'Messages Sent', value: 125000, suffix: '+' },
            { label: 'Response Rate', value: 98.5, suffix: '%' },
            { label: 'Time Saved', value: 2500, suffix: 'hrs' },
            { label: 'Revenue Boost', value: 3.2, suffix: 'x' },
          ].map((stat, i) => (
            <div
              key={i}
              className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:scale-105 hover:border-purple-300 hover:shadow-md transition-all"
            >
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.suffix === 'x' || stat.suffix === '%' 
                  ? stat.value.toFixed(1) 
                  : stat.value}{stat.suffix}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div
          className="text-center mt-16"
        >
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Join <span className="text-purple-600 font-semibold">15,000+</span> creators who save 20+ hours per week with automation
          </p>
          <button
            className="relative inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl overflow-hidden group hover:scale-105 active:scale-95 transition-transform shadow-lg"
          >
            <div
              className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-100 transition-opacity"
            />
            <Sparkles className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Start Automating Now</span>
          </button>
        </div>
      </div>
    </section>
  );
}