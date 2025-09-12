'use client';
import { DollarSign, Users, MessageSquare, TrendingUp, Calendar, Activity } from 'lucide-react';
import PhoneMockup from '@/components/mockups/PhoneMockup';
import { useState } from 'react';
// import CountUp from 'react-countup'; // Désactivé pour les performances

const DashboardInterface = () => {
  const [revenue, setRevenue] = useState(47832);
  const [fans, setFans] = useState(1284);
  const [messages, setMessages] = useState(8439);
  const [conversionRate, setConversionRate] = useState(18.7);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  
  // Animation désactivée pour les performances
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setRevenue(prev => prev + Math.floor(Math.random() * 100) + 50);
  //     setMessages(prev => prev + Math.floor(Math.random() * 5) + 1);
  //     if (Math.random() > 0.8) {
  //       setFans(prev => prev + 1);
  //       setConversionRate(prev => Math.min(prev + 0.1, 25));
  //     }
  //   }, 3000);
    
  //   return () => clearInterval(interval);
  // }, []);
  
  // Sample chart data
  const chartData = [
    { day: 'Mon', value: 4200 },
    { day: 'Tue', value: 5100 },
    { day: 'Wed', value: 4800 },
    { day: 'Thu', value: 6200 },
    { day: 'Fri', value: 7500 },
    { day: 'Sat', value: 9200 },
    { day: 'Sun', value: 8100 },
  ];
  
  const maxValue = Math.max(...chartData.map(d => d.value));
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl h-full p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Revenue Intelligence Dashboard</h3>
        <div
          className="flex items-center gap-1 text-xs text-green-400"
        >
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Live
        </div>
      </div>
      
      {/* Subtitle */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Real-time insights that help you make smarter business decisions and maximize earnings
      </p>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div 
          className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-xs text-green-400 font-medium">+28%</span>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Monthly Revenue</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            ${revenue.toLocaleString()}
          </div>
        </div>
        
        <div 
          className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-xs text-green-400 font-medium">+12%</span>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Active Fans</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {fans.toLocaleString()}
          </div>
        </div>
        
        <div 
          className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-xs text-green-400 font-medium">+45%</span>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Messages Sent</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {messages.toLocaleString()}
          </div>
        </div>
        
        <div 
          className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-xs text-green-400 font-medium">+5%</span>
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Conversion Rate</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {conversionRate.toFixed(1)}%
          </div>
        </div>
      </div>
      
      {/* Revenue Chart */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">Revenue Growth</h4>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            {['all', '30', '7'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 text-xs rounded-md transition-all ${
                  selectedPeriod === period 
                    ? 'bg-purple-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {period === 'all' ? 'All time' : `${period} days`}
              </button>
            ))}
          </div>
        </div>
        
        {/* Chart */}
        <div className="h-32 flex items-end gap-1.5">
          {chartData.map((data, index) => (
            <div
              key={data.day}
              className="flex-1 flex flex-col items-center gap-1 h-full"
            >
              <div
                className="w-full bg-gradient-to-t from-purple-600 to-pink-600 rounded-t-lg relative hover:opacity-80 transition-opacity"
                style={{ height: `${(data.value / maxValue) * 100}%` }}
              >
                <span
                  className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-900 dark:text-white opacity-0 hover:opacity-100 transition-opacity"
                >
                  ${data.value}
                </span>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">{data.day}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Bottom insights */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div 
          className="bg-purple-600/20 rounded-lg p-2 text-center hover:scale-105 transition-transform"
        >
          <div className="text-xs text-purple-400">Best Day</div>
          <div className="text-sm font-bold text-gray-900 dark:text-white">Saturday</div>
        </div>
        <div 
          className="bg-green-600/20 rounded-lg p-2 text-center hover:scale-105 transition-transform"
        >
          <div className="text-xs text-green-400">Top Fan</div>
          <div className="text-sm font-bold text-gray-900 dark:text-white">$2,450</div>
        </div>
        <div 
          className="bg-blue-600/20 rounded-lg p-2 text-center hover:scale-105 transition-transform"
        >
          <div className="text-xs text-blue-400">Avg. Sale</div>
          <div className="text-sm font-bold text-gray-900 dark:text-white">$127</div>
        </div>
      </div>
    </div>
  );
};

export default function RevenueIntelligence() {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <section className="relative py-20 bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Background effects */}
      <div
        className="absolute top-1/3 -left-1/4 w-[500px] h-[500px] bg-purple-200/30 rounded-full blur-3xl"
      />
      <div
        className="absolute bottom-1/3 -right-1/4 w-[600px] h-[600px] bg-pink-200/30 rounded-full blur-3xl"
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <div
          className="text-center mb-16"
        >
          <div 
            className="inline-flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-green-200 hover:scale-105 transition-transform"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Real-Time Analytics</span>
          </div>
          
          <h2 className="text-4xl lg:text-6xl font-bold mb-6 text-gray-900 dark:text-white">
            Revenue Intelligence{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-500">
              Dashboard
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Make data-driven decisions with real-time insights into your business performance
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Phone mockup with dashboard */}
          <div
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <PhoneMockup variant="iphone15pro">
              <DashboardInterface />
            </PhoneMockup>
            
            {/* Floating metric cards */}
            <div
              className="absolute -top-4 -right-4 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl px-4 py-2 shadow-2xl"
              style={{ 
                transform: isHovered ? 'translateY(-10px) rotate(5deg)' : 'translateY(0) rotate(0)',
                transition: 'transform 0.3s ease'
              }}
            >
              <div className="text-xs text-green-100">Today\'s Earnings</div>
              <div className="text-lg font-bold text-white">+$3,247</div>
            </div>
            
            <div
              className="absolute -bottom-4 -left-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl px-4 py-2 shadow-2xl"
              style={{ 
                transform: isHovered ? 'translateY(10px) rotate(-5deg)' : 'translateY(0) rotate(0)',
                transition: 'transform 0.3s ease'
              }}
            >
              <div className="text-xs text-purple-100">Active Now</div>
              <div className="text-lg font-bold text-white">147 fans</div>
            </div>
          </div>

          {/* Features list */}
          <div className="space-y-6">
            {[
              {
                icon: Activity,
                title: "Real-Time Performance Tracking",
                description: "Monitor your revenue, engagement, and growth metrics as they happen",
                color: "text-green-400"
              },
              {
                icon: TrendingUp,
                title: "Predictive Analytics",
                description: "AI-powered insights predict your best content and optimal pricing strategies",
                color: "text-purple-400"
              },
              {
                icon: Calendar,
                title: "Historical Trends",
                description: "Analyze patterns across days, weeks, and months to maximize earnings",
                color: "text-blue-400"
              },
              {
                icon: MessageSquare,
                title: "Engagement Insights",
                description: "See which messages convert best and optimize your communication strategy",
                color: "text-pink-400"
              }
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="flex gap-4 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md hover:translate-x-2 transition-all"
              >
                <div className={`mt-1 ${feature.color}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1 text-gray-900 dark:text-white">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Stats bar */}
        <div
          className="mt-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Avg Revenue Increase', value: '312%', icon: TrendingUp },
              { label: 'Data Points Analyzed', value: '50M+', icon: Activity },
              { label: 'Accuracy Rate', value: '97.8%', icon: DollarSign },
              { label: 'Time Saved Weekly', value: '15hrs', icon: Calendar },
            ].map((stat, index) => (
              <div
                key={stat.label}
              >
                <stat.icon className="w-8 h-8 mx-auto mb-2 text-white" />
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-purple-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}