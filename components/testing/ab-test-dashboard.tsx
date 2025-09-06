'use client';

import { useState } from 'react';
import { 
  FlaskConical, 
  TrendingUp, 
  Award, 
  BarChart3, 
  Clock,
  DollarSign,
  MessageSquare,
  Hash
} from 'lucide-react';
import { COMMON_AB_TESTS } from '@/lib/testing/ab-testing-engine';

interface TestResult {
  id: string;
  name: string;
  status: 'active' | 'completed';
  type: string;
  duration: string;
  variants: Array<{
    name: string;
    sent: number;
    conversions: number;
    revenue: number;
    rate: number;
    isWinner?: boolean;
  }>;
  confidence: number;
  improvement?: number;
}

export default function ABTestDashboard() {
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'create'>('active');
  
  // Mock data
  const activeTests: TestResult[] = [
    {
      id: '1',
      name: 'PPV Message Style',
      status: 'active',
      type: 'message',
      duration: '3 days',
      variants: [
        { name: 'Direct', sent: 145, conversions: 23, revenue: 575, rate: 15.9 },
        { name: 'Curiosity Gap', sent: 142, conversions: 38, revenue: 950, rate: 26.8 },
        { name: 'Personal', sent: 148, conversions: 31, revenue: 775, rate: 20.9 }
      ],
      confidence: 72
    },
    {
      id: '2',
      name: 'Best Send Time',
      status: 'active',
      type: 'timing',
      duration: '5 days',
      variants: [
        { name: '9pm', sent: 89, conversions: 12, revenue: 300, rate: 13.5 },
        { name: '11pm', sent: 92, conversions: 19, revenue: 475, rate: 20.7 },
        { name: '2am', sent: 87, conversions: 21, revenue: 525, rate: 24.1 }
      ],
      confidence: 68
    }
  ];

  const completedTests: TestResult[] = [
    {
      id: '3',
      name: 'PPV Pricing Test',
      status: 'completed',
      type: 'price',
      duration: '14 days',
      variants: [
        { name: '$25 flat', sent: 312, conversions: 45, revenue: 1125, rate: 14.4 },
        { name: '$19 flat', sent: 308, conversions: 67, revenue: 1273, rate: 21.8, isWinner: true },
        { name: '$35→$25', sent: 315, conversions: 51, revenue: 1275, rate: 16.2 }
      ],
      confidence: 95,
      improvement: 51.4
    }
  ];

  const getTestIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-4 h-4" />;
      case 'price': return <DollarSign className="w-4 h-4" />;
      case 'timing': return <Clock className="w-4 h-4" />;
      case 'hashtag': return <Hash className="w-4 h-4" />;
      default: return <FlaskConical className="w-4 h-4" />;
    }
  };

  const renderTestCard = (test: TestResult) => {
    const bestVariant = test.variants.reduce((best, current) => 
      current.rate > best.rate ? current : best
    );

    return (
      <div key={test.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              test.status === 'active' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
            }`}>
              {getTestIcon(test.type)}
            </div>
            <div>
              <h3 className="font-semibold">{test.name}</h3>
              <p className="text-sm text-gray-500">Running for {test.duration}</p>
            </div>
          </div>
          
          <div className="text-right">
            {test.status === 'active' ? (
              <div>
                <p className="text-sm text-gray-500">Confidence</p>
                <p className="text-lg font-bold">{test.confidence}%</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500">Improvement</p>
                <p className="text-lg font-bold text-green-600">+{test.improvement}%</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {test.variants.map((variant, idx) => {
            const isLeading = variant === bestVariant;
            const barWidth = (variant.rate / bestVariant.rate) * 100;

            return (
              <div key={idx} className={`relative ${variant.isWinner ? 'ring-2 ring-green-500 rounded-lg p-2' : ''}`}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{variant.name}</span>
                    {variant.isWinner && (
                      <Award className="w-4 h-4 text-green-600" />
                    )}
                    {isLeading && test.status === 'active' && (
                      <span className="text-xs text-blue-600 font-medium">Leading</span>
                    )}
                  </div>
                  <div className="text-sm text-right">
                    <span className="font-medium">{variant.rate.toFixed(1)}%</span>
                    <span className="text-gray-500 ml-2">({variant.conversions}/{variant.sent})</span>
                  </div>
                </div>
                
                <div className="h-6 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      variant.isWinner ? 'bg-green-500' :
                      isLeading ? 'bg-blue-500' : 'bg-gray-400'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                
                <p className="text-xs text-gray-500 mt-1">
                  Revenue: ${variant.revenue}
                </p>
              </div>
            );
          })}
        </div>

        {test.status === 'active' && test.confidence >= 95 && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300">
              🎉 Test has reached statistical significance! Ready to declare winner.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <FlaskConical className="w-5 h-5 text-blue-600 mb-2" />
          <p className="text-sm text-gray-500">Active Tests</p>
          <p className="text-2xl font-bold">3</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <TrendingUp className="w-5 h-5 text-green-600 mb-2" />
          <p className="text-sm text-gray-500">Avg Improvement</p>
          <p className="text-2xl font-bold">+42.3%</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <DollarSign className="w-5 h-5 text-purple-600 mb-2" />
          <p className="text-sm text-gray-500">Extra Revenue</p>
          <p className="text-2xl font-bold">$3,240</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <Award className="w-5 h-5 text-yellow-600 mb-2" />
          <p className="text-sm text-gray-500">Tests Won</p>
          <p className="text-2xl font-bold">12/15</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {(['active', 'completed', 'create'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-lg font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800'
            }`}
          >
            {tab} {tab === 'active' && `(${activeTests.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'active' && (
        <div className="grid gap-6">
          {activeTests.map(renderTestCard)}
          
          {activeTests.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
              <FlaskConical className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No active tests running</p>
              <button 
                onClick={() => setActiveTab('create')}
                className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Create Your First Test
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'completed' && (
        <div className="grid gap-6">
          {completedTests.map(renderTestCard)}
          
          {/* Insights from completed tests */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Key Insights from Tests
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-purple-600 mt-0.5">•</span>
                <p className="text-sm">
                  <strong>Lower prices convert better:</strong> $19 PPVs had 51% higher conversion than $25
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-600 mt-0.5">•</span>
                <p className="text-sm">
                  <strong>Curiosity gaps work:</strong> Messages with mystery elements convert 68% better
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-600 mt-0.5">•</span>
                <p className="text-sm">
                  <strong>Late night = more sales:</strong> 2am messages have 24% conversion vs 13% at 9pm
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'create' && (
        <div className="grid md:grid-cols-2 gap-6">
          {Object.entries(COMMON_AB_TESTS).map(([key, test]) => (
            <div key={key} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-3 mb-4">
                {getTestIcon(test.type)}
                <div className="flex-1">
                  <h3 className="font-semibold">{test.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{test.type} Test</p>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                {test.variants.map((variant, idx) => (
                  <div key={idx} className="text-sm p-2 bg-gray-50 dark:bg-gray-900 rounded">
                    <span className="font-medium">{variant.name}:</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      {typeof variant.content === 'string' 
                        ? `"${variant.content.substring(0, 50)}..."` 
                        : JSON.stringify(variant.content)}
                    </span>
                  </div>
                ))}
              </div>
              
              <button className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Start This Test
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Best Practices */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">A/B Testing Best Practices</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-sm mb-2">Do's ✅</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Test one variable at a time</li>
              <li>• Run tests for at least 100 conversions</li>
              <li>• Wait for 95% confidence</li>
              <li>• Test during typical times</li>
              <li>• Document winning strategies</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-sm mb-2">Don'ts ❌</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Don't end tests too early</li>
              <li>• Don't test during holidays</li>
              <li>• Don't change mid-test</li>
              <li>• Don't ignore small wins</li>
              <li>• Don't test everything at once</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
