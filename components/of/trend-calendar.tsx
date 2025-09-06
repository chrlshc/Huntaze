'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  Video,
  Hash,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  DollarSign,
  Zap
} from 'lucide-react';
import { trendDetector, CONTENT_FORMULAS } from '@/lib/of/trend-detector';

interface TrendEvent {
  date: Date;
  trend: {
    id: string;
    name: string;
    platform: 'tiktok' | 'instagram' | 'twitter';
    type: string;
    metrics: {
      views: number;
      growth: number;
    };
  };
  content: {
    type: string;
    concept: string;
    ofTieIn: string;
  };
  bestTime: string;
}

export default function TrendCalendar() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedTrend, setSelectedTrend] = useState<TrendEvent | null>(null);
  const [trendEvents, setTrendEvents] = useState<TrendEvent[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'tiktok' | 'instagram'>('all');

  useEffect(() => {
    loadTrendCalendar();
  }, [currentWeek]);

  const loadTrendCalendar = async () => {
    const calendar = await trendDetector.generateTrendCalendar(['fitness', 'lifestyle'], 7);
    setTrendEvents(calendar);
  };

  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(currentWeek);
    startOfWeek.setDate(currentWeek.getDate() - currentWeek.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek);
    newDate.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newDate);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'tiktok': return '🎵';
      case 'instagram': return '📸';
      case 'twitter': return '🐦';
      default: return '📱';
    }
  };

  const getTrendColor = (platform: string) => {
    switch (platform) {
      case 'tiktok': return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300';
      case 'instagram': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
      case 'twitter': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(0)}K`;
    return views.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <TrendingUp className="w-5 h-5 text-green-600 mb-2" />
          <p className="text-sm text-gray-500">Active Trends</p>
          <p className="text-2xl font-bold">12</p>
          <p className="text-xs text-green-600">+3 new this week</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <Eye className="w-5 h-5 text-blue-600 mb-2" />
          <p className="text-sm text-gray-500">Avg Trend Views</p>
          <p className="text-2xl font-bold">89M</p>
          <p className="text-xs text-gray-600">Per trending audio</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <DollarSign className="w-5 h-5 text-purple-600 mb-2" />
          <p className="text-sm text-gray-500">Revenue from Trends</p>
          <p className="text-2xl font-bold">$4.8K</p>
          <p className="text-xs text-green-600">+142% vs generic</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <Zap className="w-5 h-5 text-yellow-600 mb-2" />
          <p className="text-sm text-gray-500">Conversion Rate</p>
          <p className="text-2xl font-bold">3.7%</p>
          <p className="text-xs text-green-600">+2.1% vs avg</p>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Trend Calendar
          </h2>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {(['all', 'tiktok', 'instagram'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    activeFilter === filter
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900'
                  }`}
                >
                  {filter === 'all' ? 'All' : filter === 'tiktok' ? '🎵 TikTok' : '📸 Instagram'}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigateWeek('prev')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium">
                {currentWeek.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <button 
                onClick={() => navigateWeek('next')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-4">
          {getWeekDays().map((day, idx) => {
            const dayEvents = trendEvents.filter(event => 
              event.date.toDateString() === day.toDateString() &&
              (activeFilter === 'all' || event.trend.platform === activeFilter)
            );
            const isToday = day.toDateString() === new Date().toDateString();
            
            return (
              <div 
                key={idx}
                className={`border rounded-lg p-3 min-h-[150px] ${
                  isToday 
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs text-gray-500">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className="text-lg font-semibold">
                      {day.getDate()}
                    </p>
                  </div>
                  {isToday && (
                    <span className="text-xs px-2 py-0.5 bg-purple-600 text-white rounded">
                      Today
                    </span>
                  )}
                </div>
                
                <div className="space-y-2">
                  {dayEvents.map((event, eventIdx) => (
                    <button
                      key={eventIdx}
                      onClick={() => setSelectedTrend(event)}
                      className={`w-full p-2 rounded text-xs font-medium transition-all hover:scale-105 ${
                        getTrendColor(event.trend.platform)
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{getPlatformIcon(event.trend.platform)}</span>
                        <TrendingUp className="w-3 h-3" />
                      </div>
                      <p className="mt-1 text-left truncate">
                        {event.trend.name}
                      </p>
                      <p className="text-[10px] opacity-75">
                        {event.bestTime}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Trend Details */}
      {selectedTrend && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">{selectedTrend.trend.name}</h3>
              <p className="text-sm text-gray-500">
                {getPlatformIcon(selectedTrend.trend.platform)} {selectedTrend.trend.platform} • 
                Best time: {selectedTrend.bestTime}
              </p>
            </div>
            <button 
              onClick={() => setSelectedTrend(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Trend Metrics</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Views</span>
                  <span className="text-sm font-medium">
                    {formatViews(selectedTrend.trend.metrics.views)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Growth Rate</span>
                  <span className="text-sm font-medium text-green-600">
                    +{selectedTrend.trend.metrics.growth}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Content Type</span>
                  <span className="text-sm font-medium capitalize">
                    {selectedTrend.content.type}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Content Suggestion</h4>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <p className="text-sm font-medium mb-2">{selectedTrend.content.concept}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  OF Tie-in: {selectedTrend.content.ofTieIn}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              Create Content Plan
            </button>
            <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <Video className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Content Creation Tips */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5" />
          Quick Content Formulas
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(CONTENT_FORMULAS).map(([type, formula]) => (
            <div key={type} className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2 capitalize">{type}</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                {formula.formula}
              </p>
              <div className="space-y-1">
                {formula.examples.slice(0, 2).map((example, idx) => (
                  <p key={idx} className="text-xs text-purple-600 dark:text-purple-400">
                    • {example}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Warning */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-yellow-800 dark:text-yellow-200">
              Platform Guidelines
            </p>
            <p className="text-yellow-700 dark:text-yellow-300 mt-1">
              Never mention OnlyFans directly on TikTok/Instagram. Use "link in bio", "exclusive content", or "VIP page" instead.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}