'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Eye,
  MessageSquare,
  Heart,
  Share2,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';
import { useDemoTracking } from '@/lib/analytics/demo-tracking';

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  tooltip: string;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}

function MetricCard({ title, value, change, icon, tooltip, isHovered, onHover, onLeave }: MetricCardProps) {
  const isPositive = change >= 0;
  
  return (
    <div 
      className="relative bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      role="button"
      tabIndex={0}
      aria-label={`${title}: ${value}, ${isPositive ? 'up' : 'down'} ${Math.abs(change)}%`}
    >
      {/* Tooltip */}
      {isHovered && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap z-20 border border-purple-500/30">
          {tooltip}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 border-r border-b border-purple-500/30" />
        </div>
      )}
      
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(change)}%
        </div>
      </div>
      
      <div className="space-y-1">
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-white text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

interface ChartBarProps {
  height: number;
  label: string;
  value: string;
  isActive: boolean;
  onClick: () => void;
}

function ChartBar({ height, label, value, isActive, onClick }: ChartBarProps) {
  return (
    <div className="flex flex-col items-center gap-2 flex-1">
      <div className="relative w-full flex items-end justify-center h-32">
        <button
          onClick={onClick}
          className="relative w-full max-w-[40px] bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all duration-300 hover:from-purple-500 hover:to-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          style={{ height: `${height}%` }}
          aria-label={`${label}: ${value}`}
        >
          {isActive && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap border border-purple-500/30">
              {value}
            </div>
          )}
        </button>
      </div>
      <span className="text-gray-400 text-xs">{label}</span>
    </div>
  );
}

export function InteractiveDashboardDemo() {
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  const [activeBar, setActiveBar] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const { trackHover, trackClick, trackView, trackCTAShown, trackCTAClick } = useDemoTracking();

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => setAnimateIn(true), 100);
    
    // Track demo view
    trackView('dashboard_demo');
    
    return () => clearTimeout(timer);
  }, [trackView]);

  useEffect(() => {
    // Track when CTA is shown
    if (hasInteracted) {
      trackCTAShown();
    }
  }, [hasInteracted, trackCTAShown]);

  const handleInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  const metrics = [
    {
      id: 'followers',
      title: 'Total Followers',
      value: '24.5K',
      change: 12.5,
      icon: <Users className="w-5 h-5 text-purple-400" />,
      tooltip: 'Followers across all platforms'
    },
    {
      id: 'engagement',
      title: 'Engagement Rate',
      value: '8.2%',
      change: 3.1,
      icon: <Heart className="w-5 h-5 text-purple-400" />,
      tooltip: 'Average engagement across posts'
    },
    {
      id: 'revenue',
      title: 'Monthly Revenue',
      value: '$3,240',
      change: 18.3,
      icon: <DollarSign className="w-5 h-5 text-purple-400" />,
      tooltip: 'Revenue from all monetization sources'
    },
    {
      id: 'views',
      title: 'Total Views',
      value: '156K',
      change: -2.4,
      icon: <Eye className="w-5 h-5 text-purple-400" />,
      tooltip: 'Views across all content'
    }
  ];

  const chartData = [
    { label: 'Mon', value: '2.4K', height: 60 },
    { label: 'Tue', value: '3.1K', height: 75 },
    { label: 'Wed', value: '2.8K', height: 68 },
    { label: 'Thu', value: '4.2K', height: 95 },
    { label: 'Fri', value: '3.6K', height: 82 },
    { label: 'Sat', value: '5.1K', height: 100 },
    { label: 'Sun', value: '4.8K', height: 92 }
  ];

  return (
    <section 
      id="dashboard"
      className="relative min-h-screen flex items-center justify-center px-4 py-16 md:py-24 md:px-6 bg-[#131316] overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 mx-auto max-w-7xl w-full">
        {/* Section Title */}
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            See it in action
          </h2>
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Get a glimpse of your future dashboard. Everything you need to run your creator business, all in one place.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
            <Info className="w-4 h-4" />
            <span>Hover over elements to explore features</span>
          </div>
        </div>

        {/* Interactive Dashboard */}
        <div 
          className={`relative rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm shadow-2xl transition-all duration-700 ${
            animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          onMouseEnter={handleInteraction}
          onClick={handleInteraction}
        >
          {/* Purple glow shadow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 to-violet-600/20 rounded-2xl blur-xl opacity-50" />
          
          {/* Dashboard Content */}
          <div className="relative space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="text-white text-xl font-semibold">Dashboard Overview</h3>
                <p className="text-gray-400 text-sm mt-1">Last 7 days</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>Nov 18 - Nov 25, 2025</span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.map((metric) => (
                <MetricCard
                  key={metric.id}
                  {...metric}
                  isHovered={hoveredMetric === metric.id}
                  onHover={() => {
                    setHoveredMetric(metric.id);
                    handleInteraction();
                    trackHover(`metric_${metric.id}`);
                  }}
                  onLeave={() => setHoveredMetric(null)}
                />
              ))}
            </div>

            {/* Chart Section */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">Weekly Engagement</h4>
                    <p className="text-gray-400 text-sm">Click bars to see details</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-purple-500 rounded-full" />
                    <span className="text-gray-400">Interactions</span>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="flex items-end gap-2 justify-between">
                {chartData.map((bar) => (
                  <ChartBar
                    key={bar.label}
                    {...bar}
                    isActive={activeBar === bar.label}
                    onClick={() => {
                      setActiveBar(activeBar === bar.label ? null : bar.label);
                      handleInteraction();
                      trackClick(`chart_bar_${bar.label}`);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                </div>
                <h4 className="text-white font-semibold">Recent Activity</h4>
              </div>
              
              <div className="space-y-3">
                {[
                  { platform: 'Instagram', action: 'New post reached 5K views', time: '2h ago', icon: <Eye className="w-4 h-4" /> },
                  { platform: 'YouTube', action: '50 new subscribers', time: '5h ago', icon: <Users className="w-4 h-4" /> },
                  { platform: 'TikTok', action: 'Video shared 234 times', time: '1d ago', icon: <Share2 className="w-4 h-4" /> }
                ].map((activity, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                    onMouseEnter={() => {
                      handleInteraction();
                      trackHover(`activity_${activity.platform.toLowerCase()}`);
                    }}
                  >
                    <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{activity.platform}</p>
                      <p className="text-gray-400 text-xs truncate">{activity.action}</p>
                    </div>
                    <span className="text-gray-500 text-xs">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA - Shows after interaction */}
        {hasInteracted && (
          <div className="mt-8 text-center animate-fade-in">
            <div className="inline-flex flex-col items-center gap-4 p-6 rounded-xl bg-gradient-to-r from-purple-600/10 to-violet-600/10 border border-purple-500/20">
              <p className="text-white text-lg font-medium">
                Ready to see your own data?
              </p>
              <a
                href="/signup"
                onClick={() => trackCTAClick()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                Get Started Free
                <ArrowUpRight className="w-4 h-4" />
              </a>
              <p className="text-gray-400 text-sm">No credit card required</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
