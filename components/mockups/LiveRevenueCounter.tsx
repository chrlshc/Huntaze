'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, DollarSign, Users, Zap } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  type: 'tip' | 'subscription' | 'message' | 'ppv';
  username: string;
  timestamp: Date;
}

export default function LiveRevenueCounter() {
  const [revenue, setRevenue] = useState(1247.50);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [growthRate, setGrowthRate] = useState(23);

  useEffect(() => {
    // Simulate real-time revenue updates
    const revenueInterval = setInterval(() => {
      const increment = Math.random() * 50 + 10;
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        amount: increment,
        type: ['tip', 'subscription', 'message', 'ppv'][Math.floor(Math.random() * 4)] as any,
        username: ['John', 'Sarah', 'Mike', 'Emma', 'Alex'][Math.floor(Math.random() * 5)],
        timestamp: new Date()
      };

      setRevenue(prev => prev + increment);
      setTransactions(prev => [newTransaction, ...prev.slice(0, 4)]);
      setGrowthRate(prev => prev + (Math.random() * 2 - 1));
    }, 3000);

    return () => clearInterval(revenueInterval);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'tip': return '💰';
      case 'subscription': return '⭐';
      case 'message': return '💬';
      case 'ppv': return '🔒';
      default: return '💵';
    }
  };

  return (
    <motion.div 
      className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-2xl p-6 border border-purple-500/20"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">Today's Revenue</h3>
          <div className="flex items-center gap-2">
            <motion.span 
              className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
              key={revenue}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring" }}
            >
              {formatCurrency(revenue)}
            </motion.span>
          </div>
        </div>
        
        <motion.div 
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
            growthRate > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{growthRate > 0 ? '+' : ''}{growthRate.toFixed(1)}%</span>
        </motion.div>
      </div>

      {/* Live transactions feed */}
      <div className="space-y-2 mb-4">
        <AnimatePresence mode="popLayout">
          {transactions.map((transaction) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -50, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 50, height: 0 }}
              className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <motion.span 
                  className="text-2xl"
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring" }}
                >
                  {getTransactionIcon(transaction.type)}
                </motion.span>
                <div>
                  <p className="text-sm font-medium text-white">{transaction.username}</p>
                  <p className="text-xs text-gray-400 capitalize">{transaction.type}</p>
                </div>
              </div>
              <motion.span 
                className="text-green-400 font-semibold"
                initial={{ scale: 1.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" }}
              >
                +{formatCurrency(transaction.amount)}
              </motion.span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-800">
        <motion.div 
          className="text-center"
          whileHover={{ scale: 1.05 }}
        >
          <div className="flex items-center justify-center mb-1">
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xl font-bold text-white">127</p>
          <p className="text-xs text-gray-400">New fans</p>
        </motion.div>
        
        <motion.div 
          className="text-center"
          whileHover={{ scale: 1.05 }}
        >
          <div className="flex items-center justify-center mb-1">
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-xl font-bold text-white">3.2K</p>
          <p className="text-xs text-gray-400">Messages</p>
        </motion.div>
        
        <motion.div 
          className="text-center"
          whileHover={{ scale: 1.05 }}
        >
          <div className="flex items-center justify-center mb-1">
            <DollarSign className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-xl font-bold text-white">$89</p>
          <p className="text-xs text-gray-400">Avg sale</p>
        </motion.div>
      </div>

      {/* Animated pulse effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(168, 85, 247, 0)',
            '0 0 0 10px rgba(168, 85, 247, 0.1)',
            '0 0 0 20px rgba(168, 85, 247, 0)',
          ]
        }}
        transition={{ repeat: Infinity, duration: 2 }}
      />
    </motion.div>
  );
}