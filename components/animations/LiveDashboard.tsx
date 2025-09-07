'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface LiveMetric {
  label: string;
  value: number;
  change: number;
  icon: string;
  color: string;
}

interface Message {
  id: string;
  user: {
    name: string;
    avatar: string;
    platform: 'OnlyFans' | 'Instagram' | 'TikTok';
  };
  content: string;
  revenue?: number;
  timestamp: Date;
  type: 'message' | 'tip' | 'subscription';
}

const LiveDashboard: React.FC = () => {
  const [revenue, setRevenue] = useState(48234);
  const [messages, setMessages] = useState<Message[]>([]);
  const [metrics, setMetrics] = useState<LiveMetric[]>([
    { label: 'Revenus Mensuels', value: 48234, change: 12.5, icon: '💰', color: 'from-green-400 to-emerald-500' },
    { label: 'Créateurs Actifs', value: 10847, change: 3.2, icon: '👥', color: 'from-blue-400 to-cyan-500' },
    { label: 'Messages/Heure', value: 523, change: 18.7, icon: '💬', color: 'from-purple-400 to-pink-500' },
    { label: 'Taux Rétention', value: 95.4, change: 2.1, icon: '🎯', color: 'from-orange-400 to-red-500' }
  ]);
  
  const messageIdRef = useRef(0);

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update revenue
      setRevenue(prev => {
        const change = Math.random() * 1000 - 300;
        return Math.max(0, prev + change);
      });

      // Update metrics
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: metric.value + (Math.random() * 10 - 5) * (metric.label === 'Taux Rétention' ? 0.1 : 1),
        change: metric.change + (Math.random() * 2 - 1)
      })));

      // Add new message randomly
      if (Math.random() > 0.3) {
        const messageTypes = ['message', 'tip', 'subscription'] as const;
        const platforms = ['OnlyFans', 'Instagram', 'TikTok'] as const;
        const userNames = ['Emma_Rose', 'Luna_Star', 'Sophia_Love', 'Mia_Dream', 'Ava_Angel'];
        
        const newMessage: Message = {
          id: `msg-${messageIdRef.current++}`,
          user: {
            name: userNames[Math.floor(Math.random() * userNames.length)],
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${messageIdRef.current}`,
            platform: platforms[Math.floor(Math.random() * platforms.length)]
          },
          content: getRandomMessage(),
          revenue: Math.random() > 0.5 ? Math.random() * 200 : undefined,
          timestamp: new Date(),
          type: messageTypes[Math.floor(Math.random() * messageTypes.length)]
        };
        
        setMessages(prev => [newMessage, ...prev].slice(0, 5));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Chart configuration
  const revenueChartData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
    datasets: [{
      label: 'Revenus',
      data: [32000, 35000, 38000, 42000, 45000, 48000, revenue],
      borderColor: 'rgb(147, 51, 234)',
      backgroundColor: 'rgba(147, 51, 234, 0.1)',
      tension: 0.4,
      fill: true,
      pointRadius: 0,
      pointHoverRadius: 6
    }]
  };

  const platformDistribution = {
    labels: ['OnlyFans', 'Instagram', 'TikTok'],
    datasets: [{
      data: [45, 35, 20],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(34, 197, 94, 0.8)'
      ],
      borderWidth: 0
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: {
        grid: { 
          color: 'rgba(255,255,255,0.05)',
          drawBorder: false
        },
        ticks: { color: 'rgba(255,255,255,0.5)' }
      },
      y: {
        grid: { 
          color: 'rgba(255,255,255,0.05)',
          drawBorder: false
        },
        ticks: { 
          color: 'rgba(255,255,255,0.5)',
          callback: (value: any) => '€' + value.toLocaleString()
        }
      }
    }
  };

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl lg:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Dashboard en temps réel
            </span>
          </h2>
          <p className="text-xl text-gray-300">
            Surveillez vos performances 24/7 avec des métriques en direct
          </p>
        </motion.div>

        {/* Main revenue counter */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="glass-card p-8 mb-8 text-center"
        >
          <h3 className="text-lg text-gray-400 mb-2">Revenus Totaux Aujourd'hui</h3>
          <motion.div
            key={revenue}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-6xl lg:text-7xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent"
          >
            €{revenue.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </motion.div>
        </motion.div>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">{metric.icon}</span>
                <motion.span
                  className={`text-xs px-2 py-1 rounded-full ${
                    metric.change > 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                </motion.span>
              </div>
              <motion.div
                key={metric.value}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className={`text-2xl font-bold bg-gradient-to-r ${metric.color} bg-clip-text text-transparent`}
              >
                {metric.label === 'Taux Rétention' 
                  ? `${metric.value.toFixed(1)}%`
                  : metric.value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })
                }
              </motion.div>
              <div className="text-sm text-gray-400 mt-1">{metric.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Live Messages Feed */}
          <div className="lg:col-span-1">
            <div className="glass-card p-6 h-[500px] overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Messages Live</h3>
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              </div>
              
              <div className="space-y-3 overflow-y-auto h-[420px] custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      layout
                      initial={{ x: -300, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: 300, opacity: 0 }}
                      className="p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                          {message.user.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-white text-sm">{message.user.name}</span>
                            <PlatformBadge platform={message.user.platform} />
                          </div>
                          <p className="text-gray-300 text-sm mt-1">{message.content}</p>
                          <div className="flex justify-between items-center mt-2">
                            {message.revenue && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-emerald-400 text-xs font-bold"
                              >
                                +€{message.revenue.toFixed(2)}
                              </motion.span>
                            )}
                            <span className="text-gray-500 text-xs">
                              {getRelativeTime(message.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="lg:col-span-2 space-y-8">
            {/* Revenue Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="glass-card p-6"
            >
              <h3 className="text-xl font-bold text-white mb-4">Évolution des Revenus</h3>
              <div className="h-64">
                <Line data={revenueChartData} options={chartOptions} />
              </div>
            </motion.div>

            {/* Platform Distribution & AI Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="glass-card p-6"
              >
                <h3 className="text-lg font-bold text-white mb-4">Répartition Plateformes</h3>
                <div className="h-48">
                  <Doughnut 
                    data={platformDistribution}
                    options={{
                      ...chartOptions,
                      plugins: {
                        legend: {
                          display: true,
                          position: 'bottom',
                          labels: { color: 'rgba(255,255,255,0.7)' }
                        }
                      }
                    }}
                  />
                </div>
              </motion.div>

              {/* AI Insights */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="glass-card p-6"
              >
                <h3 className="text-lg font-bold text-white mb-4">Insights IA</h3>
                <div className="space-y-3">
                  <AIInsight 
                    type="success"
                    text="Pic d'activité prévu dans 2h"
                    action="Programmer du contenu"
                  />
                  <AIInsight 
                    type="warning"
                    text="23 fans premium en ligne"
                    action="Engager maintenant"
                  />
                  <AIInsight 
                    type="info"
                    text="PPV optimal: €15-20"
                    action="Ajuster les prix"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Helper Components
const PlatformBadge: React.FC<{ platform: string }> = ({ platform }) => {
  const colors = {
    OnlyFans: 'bg-blue-500/20 text-blue-300',
    Instagram: 'bg-pink-500/20 text-pink-300',
    TikTok: 'bg-gray-900/50 text-gray-300'
  };
  
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${colors[platform as keyof typeof colors]}`}>
      {platform}
    </span>
  );
};

const AIInsight: React.FC<{ type: 'success' | 'warning' | 'info'; text: string; action: string }> = ({ 
  type, text, action 
}) => {
  const styles = {
    success: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    warning: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
    info: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30'
  };
  
  return (
    <motion.div
      className={`p-3 rounded-lg bg-gradient-to-r ${styles[type]} border backdrop-blur-sm`}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex justify-between items-start">
        <p className="text-sm text-white">{text}</p>
        <button className="text-xs text-white/70 hover:text-white transition-colors">
          {action} →
        </button>
      </div>
    </motion.div>
  );
};

// Helper functions
function getRandomMessage(): string {
  const messages = [
    "Nouveau tip reçu! 💰",
    "J'adore ton contenu!",
    "Peux-tu faire une vidéo personnalisée?",
    "Abonnement renouvelé ✨",
    "Merci pour le PPV!",
    "Tu es incroyable! 🔥",
    "Quand est ta prochaine live?",
    "Message privé débloqué"
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

function getRelativeTime(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'À l\'instant';
  if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)}min`;
  return `Il y a ${Math.floor(seconds / 3600)}h`;
}

export default LiveDashboard;