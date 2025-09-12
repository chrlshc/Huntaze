'use client';

import { useState } from 'react';
import { CheckCircle, TrendingUp, Calendar, DollarSign, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const stories = [
  {
    id: 1,
    name: 'Sarah M.',
    role: 'Fashion Creator',
    initials: 'SM',
    before: 3000,
    after: 45000,
    duration: '6 months',
    platform: 'OnlyFans',
    topPercentage: '0.5%',
    verified: true,
    growthPercentage: 1400,
    monthlyGrowth: 233,
    currentMRR: 45000,
    chartData: [
      { month: 'Jan', revenue: 3000 },
      { month: 'Feb', revenue: 5500 },
      { month: 'Mar', revenue: 12000 },
      { month: 'Apr', revenue: 22000 },
      { month: 'May', revenue: 35000 },
      { month: 'Jun', revenue: 45000 },
    ],
    color: 'purple'
  },
  {
    id: 2,
    name: 'Emma L.',
    role: 'Fitness Creator',
    initials: 'EL',
    before: 8000,
    after: 62000,
    duration: '4 months',
    platform: 'OnlyFans',
    topPercentage: '1%',
    verified: true,
    growthPercentage: 675,
    monthlyGrowth: 169,
    currentMRR: 62000,
    chartData: [
      { month: 'Mar', revenue: 8000 },
      { month: 'Apr', revenue: 18000 },
      { month: 'May', revenue: 38000 },
      { month: 'Jun', revenue: 62000 },
    ],
    color: 'green'
  },
  {
    id: 3,
    name: 'Mia R.',
    role: 'Lifestyle Creator',
    initials: 'MR',
    before: 5000,
    after: 38000,
    duration: '5 months',
    platform: 'Instagram',
    topPercentage: '2%',
    verified: true,
    growthPercentage: 660,
    monthlyGrowth: 132,
    currentMRR: 38000,
    chartData: [
      { month: 'Feb', revenue: 5000 },
      { month: 'Mar', revenue: 9000 },
      { month: 'Apr', revenue: 17000 },
      { month: 'May', revenue: 26000 },
      { month: 'Jun', revenue: 38000 },
    ],
    color: 'pink'
  }
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl">
        <p className="text-gray-900 dark:text-white font-semibold">${payload[0].value.toLocaleString()}</p>
        <p className="text-gray-600 dark:text-gray-400 text-xs">Monthly Revenue</p>
      </div>
    );
  }
  return null;
};

export default function AnimatedSuccessStories() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentStory = stories[currentIndex];

  const gradientColors = {
    purple: ['#a855f7', '#7c3aed'],
    green: ['#10b981', '#059669'],
    pink: ['#ec4899', '#db2777']
  };
  
  const [startColor, endColor] = gradientColors[currentStory.color as keyof typeof gradientColors] || gradientColors.purple;

  const nextStory = () => {
    setCurrentIndex((prev) => (prev + 1) % stories.length);
  };

  const prevStory = () => {
    setCurrentIndex((prev) => (prev - 1 + stories.length) % stories.length);
  };

  return (
    <section className="relative h-full flex items-center justify-center">
      <div className="w-full max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-green-200">
            <Star className="w-4 h-4" />
            <span>Success Stories</span>
          </div>
          
          <h2 className="text-4xl lg:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
            Real creators.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              Real results.
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Join thousands who transformed their business with Huntaze
          </p>
        </div>

        {/* Story Content */}
        <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 lg:p-12 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left side - Creator info and growth */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${
                  currentStory.color === 'purple' ? 'from-purple-500 to-purple-600' :
                  currentStory.color === 'green' ? 'from-green-500 to-emerald-600' :
                  'from-pink-500 to-rose-600'
                } flex items-center justify-center text-white font-bold text-xl`}>
                  {currentStory.initials}
                </div>
                <div>
                  <h3 className="text-xl font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                    {currentStory.name}
                    {currentStory.verified && <CheckCircle className="w-5 h-5 text-blue-500" />}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">{currentStory.role}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-purple-600 bg-purple-50 dark:bg-gray-900 px-2 py-1 rounded">
                      Top {currentStory.topPercentage}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">on {currentStory.platform}</span>
                  </div>
                </div>
              </div>

              <div className="text-right mb-8">
                <div className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  +{currentStory.growthPercentage}%
                </div>
                <p className="text-gray-600 dark:text-gray-400">in {currentStory.duration}</p>
              </div>

              {/* Chart */}
              <div className="h-64 mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={currentStory.chartData}>
                    <defs>
                      <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={startColor} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={endColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="month" 
                      stroke="#9ca3af" 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af' }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke={startColor}
                      strokeWidth={3}
                      fill="url(#gradient)"
                      animationDuration={0}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right side - Stats */}
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-600 dark:text-gray-400">Time on Platform</span>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{currentStory.duration}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="text-gray-600 dark:text-gray-400">Monthly Growth</span>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">+{currentStory.monthlyGrowth}%</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="w-5 h-5 text-pink-400" />
                  <span className="text-gray-600 dark:text-gray-400">Current MRR</span>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">${(currentStory.currentMRR / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none">
            <button 
              onClick={prevStory}
              className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors pointer-events-auto ml-4 shadow-md"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <button 
              onClick={nextStory}
              className="p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors pointer-events-auto mr-4 shadow-md"
            >
              <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-2 mt-8">
          {stories.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-purple-600 w-8' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center items-center text-sm text-gray-600 dark:text-gray-400 mt-12">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>100% Verified Results</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>Real Platform Data</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>Transparent Metrics</span>
          </div>
        </div>
      </div>
    </section>
  );
}