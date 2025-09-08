'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

const features = [
  {
    id: 'inbox',
    title: 'Unified Inbox',
    description: 'Manage all your platforms in one place. Reply faster, earn more.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    ),
    features: ['Instagram DMs', 'OnlyFans messages', 'TikTok comments', 'All in one dashboard'],
    preview: {
      messages: [
        { name: 'Emma S.', message: 'Hey! Love your content 💕', time: '2m ago', platform: 'instagram' },
        { name: 'Alex M.', message: 'Just subscribed! Can\'t wait...', time: '5m ago', platform: 'onlyfans' },
        { name: 'Sophia R.', message: 'Your tips really helped me!', time: '12m ago', platform: 'tiktok' },
      ]
    }
  },
  {
    id: 'ai',
    title: 'AI Assistant',
    description: 'Smart replies that sound like you. Never miss a conversation.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    features: ['Context-aware responses', 'Your tone of voice', 'Auto-categorization', 'Smart scheduling'],
    preview: {
      suggestions: [
        'Thanks for your support! New content dropping tomorrow 🔥',
        'Hey love! Check your DMs for exclusive content 💕',
        'Appreciate you! What type of content do you enjoy most?'
      ]
    }
  },
  {
    id: 'analytics',
    title: 'Revenue Analytics',
    description: 'Track what works. Double down on success.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    features: ['Real-time earnings', 'Fan lifetime value', 'Content performance', 'Growth predictions'],
    preview: {
      metrics: [
        { label: 'Today', value: '$2,847', change: '+12.5%' },
        { label: 'This Week', value: '$18,392', change: '+8.2%' },
        { label: 'This Month', value: '$74,821', change: '+15.7%' }
      ]
    }
  }
];

export default function FeaturesMinimal() {
  const [activeFeature, setActiveFeature] = useState('inbox');

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            Everything you need to scale
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Stop switching between apps. Manage your entire creator business from one powerful dashboard.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Feature tabs */}
          <div className="space-y-4">
            {features.map((feature, index) => (
              <motion.button
                key={feature.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                onClick={() => setActiveFeature(feature.id)}
                className={`w-full text-left p-6 rounded-2xl border transition-all ${
                  activeFeature === feature.id 
                    ? 'bg-gray-900 border-purple-500 shadow-lg shadow-purple-500/20' 
                    : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    activeFeature === feature.id ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                    {activeFeature === feature.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 grid grid-cols-2 gap-2"
                      >
                        {feature.features.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {item}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Preview */}
          <motion.div
            key={activeFeature}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="sticky top-8"
          >
            <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden">
              {/* Browser header */}
              <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 bg-red-400 rounded-full" />
                  <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                  <div className="w-3 h-3 bg-green-400 rounded-full" />
                </div>
              </div>

              {/* Content based on active feature */}
              <div className="p-6">
                {activeFeature === 'inbox' && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-white mb-4">Recent Messages</h4>
                    {features[0].preview.messages?.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-white">{msg.name}</span>
                            <span className="text-xs text-gray-500">{msg.time}</span>
                          </div>
                          <p className="text-sm text-gray-400">{msg.message}</p>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${
                          msg.platform === 'instagram' ? 'bg-pink-500' :
                          msg.platform === 'onlyfans' ? 'bg-blue-500' : 'bg-purple-500'
                        }`} />
                      </motion.div>
                    ))}
                  </div>
                )}

                {activeFeature === 'ai' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-white mb-4">AI Suggested Replies</h4>
                    {features[1].preview.suggestions?.map((suggestion, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-4 bg-purple-900/20 border border-purple-800 rounded-xl cursor-pointer hover:bg-purple-900/30 transition-colors"
                      >
                        <p className="text-sm text-gray-200">{suggestion}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <button className="text-xs text-purple-400 font-medium">Use this</button>
                          <button className="text-xs text-gray-500">Edit</button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {activeFeature === 'analytics' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-white mb-4">Revenue Overview</h4>
                    {features[2].preview.metrics?.map((metric, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-4 bg-gray-800 rounded-xl"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400">{metric.label}</span>
                          <span className="text-xs text-green-600 font-medium">{metric.change}</span>
                        </div>
                        <div className="text-2xl font-bold text-white">{metric.value}</div>
                        <div className="mt-2 h-8 bg-gradient-to-r from-purple-200 to-purple-100 rounded" />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}