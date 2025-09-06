'use client';

import { useState, useEffect } from 'react';
import { 
  Brain,
  TrendingUp,
  Zap,
  Target,
  Activity,
  BarChart3,
  Users,
  Sparkles,
  Timer,
  DollarSign,
  ChevronUp,
  ChevronDown,
  AlertCircle
} from 'lucide-react';

export default function AITeamMetrics() {
  const [metrics, setMetrics] = useState({
    evolutionRate: 2.4,
    collectiveIQ: 156,
    synergyBoost: 340,
    activeConnections: 12,
    knowledgeNodes: 1847,
    learningVelocity: 89
  });
  
  const [realtimeData, setRealtimeData] = useState({
    messagesProcessed: 15234,
    decisionsImproved: 89,
    revenue24h: 12450,
    conversionRate: 14.8
  });
  
  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        evolutionRate: prev.evolutionRate + (Math.random() - 0.5) * 0.1,
        collectiveIQ: prev.collectiveIQ + Math.floor(Math.random() * 3),
        synergyBoost: prev.synergyBoost + (Math.random() - 0.5) * 5,
        activeConnections: Math.floor(Math.random() * 4) + 10,
        knowledgeNodes: prev.knowledgeNodes + Math.floor(Math.random() * 5),
        learningVelocity: Math.min(100, prev.learningVelocity + (Math.random() - 0.3))
      }));
      
      setRealtimeData(prev => ({
        messagesProcessed: prev.messagesProcessed + Math.floor(Math.random() * 10),
        decisionsImproved: Math.min(100, prev.decisionsImproved + (Math.random() - 0.2)),
        revenue24h: prev.revenue24h + Math.floor(Math.random() * 50),
        conversionRate: Math.max(10, Math.min(20, prev.conversionRate + (Math.random() - 0.5) * 0.2))
      }));
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  const performanceData = [
    {
      ai: 'Emma (Messaging)',
      learningRate: 94,
      contributions: 342,
      impact: 'high',
      specialty: 'Conversation optimization',
      recentWin: '+18% response rate'
    },
    {
      ai: 'Alex (Analytics)',
      learningRate: 97,
      contributions: 567,
      impact: 'critical',
      specialty: 'Pattern recognition',
      recentWin: 'Predicted 92% of purchases'
    },
    {
      ai: 'Sarah (Sales)',
      learningRate: 91,
      contributions: 289,
      impact: 'high',
      specialty: 'Conversion tactics',
      recentWin: '$35 PPV sweet spot found'
    },
    {
      ai: 'Claire (Compliance)',
      learningRate: 98,
      contributions: 156,
      impact: 'critical',
      specialty: 'Risk prevention',
      recentWin: '100% platform compliance'
    }
  ];
  
  const evolutionMilestones = [
    { date: '2 hours ago', event: 'Discovered VIP evening pattern', impact: '+12% revenue' },
    { date: '5 hours ago', event: 'New emoji strategy learned', impact: '+8% opens' },
    { date: '8 hours ago', event: 'Crisis response improved', impact: '3x faster' },
    { date: '1 day ago', event: 'Cross-learning breakthrough', impact: '+15% synergy' }
  ];
  
  return (
    <div className="space-y-6">
      {/* Header Metrics */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">AI Team Intelligence Metrics</h2>
            <p className="opacity-90">Real-time collective performance</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard 
            label="Evolution Rate"
            value={`${metrics.evolutionRate.toFixed(1)}/min`}
            icon={Zap}
            trend="up"
          />
          <MetricCard 
            label="Collective IQ"
            value={metrics.collectiveIQ}
            icon={Brain}
            trend="up"
          />
          <MetricCard 
            label="Synergy Boost"
            value={`+${metrics.synergyBoost.toFixed(0)}%`}
            icon={Sparkles}
            trend="stable"
          />
          <MetricCard 
            label="Active Links"
            value={metrics.activeConnections}
            icon={Activity}
            trend="stable"
          />
          <MetricCard 
            label="Knowledge Nodes"
            value={metrics.knowledgeNodes.toLocaleString()}
            icon={BarChart3}
            trend="up"
          />
          <MetricCard 
            label="Learning Speed"
            value={`${metrics.learningVelocity.toFixed(0)}%`}
            icon={Timer}
            trend="up"
          />
        </div>
      </div>
      
      {/* Real-time Performance */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Live Performance (24h)
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Messages Processed</span>
              <span className="font-semibold text-lg">{realtimeData.messagesProcessed.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Decision Accuracy</span>
              <span className="font-semibold text-lg text-green-600">{realtimeData.decisionsImproved.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Revenue Generated</span>
              <span className="font-semibold text-lg text-green-600">${realtimeData.revenue24h.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Conversion Rate</span>
              <span className="font-semibold text-lg">{realtimeData.conversionRate.toFixed(1)}%</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              🚀 Performance is <span className="text-green-600 font-medium">340% better</span> than individual AIs
            </p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Evolution Timeline
          </h3>
          
          <div className="space-y-3">
            {evolutionMilestones.map((milestone, index) => (
              <div key={index} className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{milestone.event}</p>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500">{milestone.date}</p>
                    <p className="text-xs text-green-600 font-medium">{milestone.impact}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ⚡ New discoveries every <span className="font-medium">25 minutes</span>
            </p>
          </div>
        </div>
      </div>
      
      {/* Individual AI Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          AI Team Members Performance
        </h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          {performanceData.map((ai, index) => (
            <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium">{ai.ai}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{ai.specialty}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  ai.impact === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                }`}>
                  {ai.impact.toUpperCase()}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Learning Rate</span>
                  <span className="font-medium">{ai.learningRate}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full"
                    style={{ width: `${ai.learningRate}%` }}
                  />
                </div>
                <p className="text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Contributions:</span> 
                  <span className="font-medium ml-1">{ai.contributions}</span>
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✨ {ai.recentWin}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Predictions */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-purple-600" />
            <h4 className="font-medium">Next Evolution</h4>
          </div>
          <p className="text-2xl font-bold text-purple-600 mb-1">~45 min</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Predicted: Messaging tone optimization
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h4 className="font-medium">Revenue Impact</h4>
          </div>
          <p className="text-2xl font-bold text-green-600 mb-1">+42%</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            vs. manual messaging
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium">Learning Velocity</h4>
          </div>
          <p className="text-2xl font-bold text-blue-600 mb-1">3.2x</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Faster than last month
          </p>
        </div>
      </div>
      
      {/* System Health */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium mb-1">Exponential Growth Active</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              The AI team is currently experiencing exponential learning growth. Each AI is contributing an average of 12 insights per hour, 
              with a 94% cross-utilization rate. This collaborative intelligence is resulting in continuous improvement across all metrics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ label, value, icon: Icon, trend }: {
  label: string;
  value: string | number;
  icon: any;
  trend: 'up' | 'down' | 'stable';
}) {
  return (
    <div className="bg-white/10 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-4 h-4 text-white/70" />
        {trend === 'up' && <ChevronUp className="w-4 h-4 text-green-400" />}
        {trend === 'down' && <ChevronDown className="w-4 h-4 text-red-400" />}
      </div>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-xs text-white/70">{label}</p>
    </div>
  );
}