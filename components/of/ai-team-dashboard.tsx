'use client';

import { useState, useEffect } from 'react';
import { 
  Brain, 
  TrendingUp, 
  DollarSign, 
  Shield, 
  MessageSquare,
  Sparkles,
  Network,
  Activity,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Users
} from 'lucide-react';

export default function AITeamDashboard() {
  const [activeInsights, setActiveInsights] = useState<any[]>([]);
  const [teamMetrics, setTeamMetrics] = useState({
    collectiveLearningRate: 0.89,
    sharedInsights: 156,
    synergyScore: 0.87,
    activeConnections: 12
  });
  
  // Simulate real-time insights
  useEffect(() => {
    const interval = setInterval(() => {
      const newInsight = generateRandomInsight();
      setActiveInsights(prev => [newInsight, ...prev.slice(0, 4)]);
      
      // Update metrics
      setTeamMetrics(prev => ({
        ...prev,
        sharedInsights: prev.sharedInsights + 1,
        collectiveLearningRate: Math.min(prev.collectiveLearningRate + 0.001, 1),
        activeConnections: Math.floor(Math.random() * 5) + 10
      }));
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const aiTeamMembers = [
    {
      name: 'Emma',
      role: 'Messaging AI',
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      model: 'GPT-4 + Claude',
      status: 'active',
      learningRate: 0.85,
      insights: 42,
      specialties: ['Conversation', 'Personality matching', 'Upsell timing']
    },
    {
      name: 'Alex',
      role: 'Analytics AI',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      model: 'Custom ML',
      status: 'processing',
      learningRate: 0.90,
      insights: 67,
      specialties: ['Pattern recognition', 'Prediction', 'Anomaly detection']
    },
    {
      name: 'Sarah',
      role: 'Sales AI',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      model: 'GPT-4 Custom',
      status: 'active',
      learningRate: 0.88,
      insights: 31,
      specialties: ['Psychological tactics', 'Pricing optimization', 'Urgency']
    },
    {
      name: 'Claire',
      role: 'Compliance AI',
      icon: Shield,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      model: 'Rules Engine',
      status: 'monitoring',
      learningRate: 0.95,
      insights: 16,
      specialties: ['Platform rules', 'Risk assessment', 'Content filtering']
    }
  ];
  
  function generateRandomInsight() {
    const insights = [
      {
        from: 'Alex',
        to: 'Emma',
        type: 'pattern',
        message: 'Peak engagement detected at 22:45 EST',
        impact: 'high'
      },
      {
        from: 'Sarah',
        to: 'Alex',
        type: 'optimization',
        message: '$25 PPV converting 23% better than $35',
        impact: 'medium'
      },
      {
        from: 'Claire',
        to: 'All',
        type: 'warning',
        message: 'New TikTok rule detected - updating filters',
        impact: 'critical'
      },
      {
        from: 'Emma',
        to: 'Sarah',
        type: 'opportunity',
        message: 'VIP fan showing high purchase intent',
        impact: 'high'
      }
    ];
    
    return {
      ...insights[Math.floor(Math.random() * insights.length)],
      id: Date.now(),
      timestamp: new Date()
    };
  }
  
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing': return <Activity className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'monitoring': return <Shield className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Team Overview */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">AI Team Intelligence</h2>
            <p className="opacity-90">Vos IA travaillent ensemble et apprennent en continu</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/20 rounded-lg p-3">
            <p className="text-sm opacity-90">Learning Rate</p>
            <p className="text-2xl font-bold">{(teamMetrics.collectiveLearningRate * 100).toFixed(1)}%</p>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <p className="text-sm opacity-90">Shared Insights</p>
            <p className="text-2xl font-bold">{teamMetrics.sharedInsights}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <p className="text-sm opacity-90">Synergy Score</p>
            <p className="text-2xl font-bold">{(teamMetrics.synergyScore * 100).toFixed(0)}%</p>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <p className="text-sm opacity-90">Active Links</p>
            <p className="text-2xl font-bold">{teamMetrics.activeConnections}</p>
          </div>
        </div>
      </div>
      
      {/* AI Team Members */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Votre Équipe AI</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {aiTeamMembers.map(member => {
            const Icon = member.icon;
            return (
              <div key={member.name} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className={`${member.bgColor} p-2 rounded-lg`}>
                    <Icon className={`w-5 h-5 ${member.color}`} />
                  </div>
                  {getStatusIcon(member.status)}
                </div>
                
                <h4 className="font-semibold">{member.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{member.role}</p>
                <p className="text-xs text-gray-400 mt-1">{member.model}</p>
                
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Learning</span>
                    <span className="font-medium">{(member.learningRate * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-pink-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${member.learningRate * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">{member.insights} insights shared</p>
                </div>
                
                <div className="mt-3">
                  <p className="text-xs font-medium mb-1">Specialties:</p>
                  <div className="flex flex-wrap gap-1">
                    {member.specialties.slice(0, 2).map(specialty => (
                      <span key={specialty} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Real-time Intelligence Network */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Network className="w-5 h-5" />
            Intelligence Network
          </h3>
          <span className="text-sm text-gray-500">Real-time collaboration</span>
        </div>
        
        <div className="space-y-3">
          {activeInsights.map(insight => (
            <div key={insight.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg animate-fade-in">
              <div className={`px-2 py-1 rounded text-xs font-medium ${getImpactColor(insight.impact)}`}>
                {insight.impact.toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">{insight.from}</span>
                  <span className="text-gray-500"> → </span>
                  <span className="font-medium">{insight.to}</span>
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{insight.message}</p>
              </div>
              <Lightbulb className="w-4 h-4 text-yellow-500" />
            </div>
          ))}
          
          {activeInsights.length === 0 && (
            <p className="text-center text-gray-500 py-4">Waiting for insights...</p>
          )}
        </div>
      </div>
      
      {/* How It Works */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Comment ça marche
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <span className="text-purple-600">1.</span> Collaboration Continue
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chaque IA partage ses découvertes avec les autres en temps réel, créant une intelligence collective.
              </p>
            </div>
          </div>
          
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <span className="text-purple-600">2.</span> Apprentissage Exponentiel
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Les patterns découverts par une IA améliorent instantanément les performances des autres.
              </p>
            </div>
          </div>
          
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <span className="text-purple-600">3.</span> Actions Optimisées
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chaque décision combine l'expertise de toute l'équipe pour des résultats maximaux.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Current Benefits */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Bénéfices Actuels
          </h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Conversion +42% grâce à l'intelligence croisée</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Détection de patterns 3x plus rapide</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Prédictions de churn 85% précises</span>
            </li>
          </ul>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Votre Rôle
          </h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 mt-0.5" />
              <span>Focus sur la création de contenu</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 mt-0.5" />
              <span>Validez les suggestions importantes</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 mt-0.5" />
              <span>L'équipe AI gère le reste 24/7</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}