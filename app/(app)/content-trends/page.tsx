'use client';

import { useState } from 'react';
import { ContentTrendsDashboard } from '@/components/content-trends/ContentTrendsDashboard';
import { TrendsScraper } from '@/components/content-trends/TrendsScraper';
import { PlatformTrendsView } from '@/components/content-trends/PlatformTrendsView';
import { AIRecommendations } from '@/components/content-trends/AIRecommendations';

type Tab = 'overview' | 'scraper' | 'trends' | 'recommendations';

export default function ContentTrendsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs: { id: Tab; name: string; icon: string }[] = [
    { id: 'overview', name: 'Vue d\'ensemble', icon: '📊' },
    { id: 'scraper', name: 'Scraper', icon: '🔍' },
    { id: 'trends', name: 'Tendances', icon: '📈' },
    { id: 'recommendations', name: 'Recommandations IA', icon: '🤖' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🎯 Content Trends AI</h1>
        <p className="text-gray-600">
          Analysez le potentiel viral, découvrez les tendances et obtenez des recommandations IA
          pour maximiser la portée de votre contenu.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b pb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg transition-all font-medium ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && <ContentTrendsDashboard />}
        {activeTab === 'scraper' && <TrendsScraper />}
        {activeTab === 'trends' && <PlatformTrendsView />}
        {activeTab === 'recommendations' && <AIRecommendations />}
      </div>
    </div>
  );
}