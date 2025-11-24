'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, Clock, BarChart3, Sparkles, Plus, ChevronRight, 
  Twitter, Youtube, Globe, Check, AlertCircle,
  TrendingUp, Users, Eye, DollarSign, Settings
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

// Mock data for demo
const scheduledPosts = [
  {
    id: 1,
    content: "New exclusive content drop! 🔥 Check your DMs for something special",
    platforms: ['instagram', 'twitter'],
    scheduledTime: '2025-01-10T14:00:00',
    status: 'scheduled',
    expectedReach: 12500,
    engagement: 0
  },
  {
    id: 2,
    content: "Good morning loves! Starting the day with some yoga 🧘‍♀️ Who's joining me?",
    platforms: ['instagram'],
    scheduledTime: '2025-01-10T09:00:00',
    status: 'published',
    expectedReach: 8200,
    engagement: 89
  },
  {
    id: 3,
    content: "SALE ALERT: 30% off all premium sets this weekend only! 💝",
    platforms: ['onlyfans', 'twitter'],
    scheduledTime: '2025-01-11T18:00:00',
    status: 'draft',
    expectedReach: 15000,
    engagement: 0
  }
]

// Platform icon components using official logos
const PlatformIcon = ({ platform, className = "w-4 h-4" }: { platform: string; className?: string }) => {
  switch (platform) {
    case 'instagram':
      return <Image src="/logos/instagram.svg" alt="Instagram" width={16} height={16} className={className} />
    case 'twitter':
      return <Twitter className={className + " text-gray-600 dark:text-gray-400"} />
    case 'tiktok':
      return <Image src="/logos/tiktok.svg" alt="TikTok" width={16} height={16} className={className} />
    case 'onlyfans':
      return <Image src="/logos/onlyfans.svg" alt="OnlyFans" width={16} height={16} className={className} />
    case 'reddit':
      return <Image src="/logos/reddit.svg" alt="Reddit" width={16} height={16} className={className} />
    case 'threads':
      return <Image src="/logos/threads.svg" alt="Threads" width={16} height={16} className={className} />
    case 'youtube':
      return <Youtube className={className + " text-gray-600 dark:text-gray-400"} />
    default:
      return <Globe className={className + " text-gray-600 dark:text-gray-400"} />
  }
}

const platformNames: Record<string, string> = {
  instagram: 'Instagram',
  twitter: 'Twitter',
  youtube: 'YouTube',
  onlyfans: 'OnlyFans',
  tiktok: 'TikTok',
  reddit: 'Reddit',
  threads: 'Threads'
}

const bestTimes = {
  instagram: ['9:00 AM', '12:00 PM', '7:00 PM'],
  twitter: ['8:00 AM', '1:00 PM', '5:00 PM'],
  onlyfans: ['11:00 AM', '3:00 PM', '9:00 PM']
}

export default function ContentSchedulerPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'calendar' | 'analytics' | 'ai'>('calendar')
  const [aiSuggestions, setAiSuggestions] = useState(false)

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-24">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Content Scheduler
          </h1>
          <p className="text-lg text-gray-700 dark:text-[var(--text-secondary-dark)]">
            Plan, optimize, and automate your content across all platforms
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-8 max-w-md">
          {[
            { id: 'calendar', label: 'Calendar', icon: Calendar },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'ai', label: 'AI Optimize', icon: Sparkles }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-3 gap-8"
          >
            {/* Calendar View */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    January 2025
                  </h2>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <ChevronRight className="w-5 h-5 rotate-180 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-gray-600 dark:text-gray-400 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }, (_, i) => {
                    const day = i - 2; // Start from correct day
                    const isToday = day === 8;
                    const hasContent = [5, 8, 12, 15, 20, 25].includes(day);
                    
                    if (day < 1 || day > 31) return <div key={i} />;
                    
                    return (
                      <button
                        key={i}
                        className={`aspect-square p-2 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-700 ${
                          isToday ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-semibold' : ''
                        }`}
                      >
                        <div className="text-sm">{day}</div>
                        {hasContent && (
                          <div className="flex justify-center mt-1 gap-0.5">
                            <div className="w-1 h-1 bg-purple-600 dark:bg-purple-400 rounded-full" />
                            <div className="w-1 h-1 bg-pink-600 dark:bg-pink-400 rounded-full" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Quick Add */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    <Plus className="w-5 h-5" />
                    Schedule New Content
                  </button>
                </div>
              </div>
            </div>

            {/* Scheduled Posts */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Upcoming Posts
              </h3>
              {scheduledPosts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex gap-2">
                      {post.platforms.map((platform) => (
                        <div
                          key={platform}
                          className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center overflow-hidden"
                        >
                          <PlatformIcon platform={platform} className="w-4 h-4" />
                        </div>
                      ))}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      post.status === 'published' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : post.status === 'scheduled'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                    }`}>
                      {post.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {post.content}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>{new Date(post.scheduledTime).toLocaleString()}</span>
                    {post.status === 'published' && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.engagement}% eng.
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            {/* Performance Overview */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Best Times to Post
                </h3>
                <div className="space-y-4">
                  {Object.entries(bestTimes).map(([platform, times]) => (
                    <div key={platform} className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                        <PlatformIcon platform={platform} className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white capitalize mb-1">
                          {platform}
                        </p>
                        <div className="flex gap-2">
                          {times.map((time) => (
                            <span
                              key={time}
                              className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded"
                            >
                              {time}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Content Performance
                </h3>
                <div className="space-y-4">
                  {[
                    { type: 'Photos', engagement: 85, revenue: '$2,450' },
                    { type: 'Videos', engagement: 92, revenue: '$3,100' },
                    { type: 'Stories', engagement: 78, revenue: '$1,200' },
                    { type: 'Promos', engagement: 65, revenue: '$4,500' }
                  ].map((item) => (
                    <div key={item.type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{item.type}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{item.revenue}</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                          style={{ width: `${item.engagement}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-4">
              {[
                { label: 'Posts This Week', value: '23', icon: Calendar, trend: '+12%' },
                { label: 'Avg. Engagement', value: '8.7%', icon: TrendingUp, trend: '+2.3%' },
                { label: 'Total Reach', value: '125K', icon: Users, trend: '+18%' },
                { label: 'Revenue Impact', value: '$4.2K', icon: DollarSign, trend: '+25%' }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs text-green-600 dark:text-green-400">{stat.trend}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* AI Optimization Tab */}
        {activeTab === 'ai' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-8 mb-8">
              <div className="max-w-3xl mx-auto text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl mb-6">
                  <Sparkles className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  AI-Powered Content Optimization
                </h2>
                <p className="text-lg text-gray-700 dark:text-[var(--text-secondary-dark)] mb-8">
                  Let our AI analyze your audience and optimize your posting schedule for maximum engagement
                </p>
                <button
                  onClick={() => setAiSuggestions(true)}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium inline-flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate AI Schedule
                </button>
              </div>
            </div>

            {/* AI Suggestions */}
            <AnimatePresence>
              {aiSuggestions && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid md:grid-cols-2 gap-6"
                >
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      Optimal Schedule This Week
                    </h3>
                    <div className="space-y-3">
                      {[
                        { day: 'Monday', time: '9:00 AM', content: 'Morning motivation post' },
                        { day: 'Tuesday', time: '7:00 PM', content: 'Behind-the-scenes content' },
                        { day: 'Thursday', time: '12:00 PM', content: 'New content announcement' },
                        { day: 'Friday', time: '6:00 PM', content: 'Weekend special promo' },
                        { day: 'Sunday', time: '8:00 PM', content: 'Week recap & preview' }
                      ].map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{item.day} - {item.time}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{item.content}</p>
                          </div>
                          <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      AI Insights
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Peak Engagement Window</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Your audience is most active between 6-9 PM EST. Schedule premium content during these hours.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Content Mix Optimization</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Increase video content by 20% - your audience engages 3x more with videos than photos.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">Geographic Timing</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            40% of your audience is in Europe. Consider adding morning posts at 3 AM EST.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Schedule Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setShowScheduleModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full p-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Schedule New Content
              </h3>
              <div className="space-y-4">
                <textarea
                  className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  rows={3}
                  placeholder="What's on your mind?"
                />
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Select Platforms
                  </label>
                  <div className="flex gap-2">
                    {['instagram', 'twitter', 'tiktok', 'onlyfans', 'reddit', 'threads'].map((platform) => (
                      <button
                        key={platform}
                        className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-600 dark:hover:border-purple-400 transition-colors overflow-hidden"
                        title={platformNames[platform]}
                      >
                        <PlatformIcon platform={platform} className="w-5 h-5" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="date"
                    className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                  <input
                    type="time"
                    className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowScheduleModal(false)}
                    className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button className="flex-1 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    Schedule Post
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}