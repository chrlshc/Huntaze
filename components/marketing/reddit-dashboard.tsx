'use client';

import { useState } from 'react';
import { 
  MessageSquare,
  Shield,
  TrendingUp,
  AlertTriangle,
  Check,
  X,
  Link,
  Hash,
  Clock,
  Users,
  BarChart
} from 'lucide-react';
import { SUBREDDIT_RULES, REDDIT_BEST_PRACTICES, redditAutomation } from '@/lib/marketing/reddit-automation';
import { complianceEngine } from '@/lib/marketing/reddit-compliance';

interface SubredditStats {
  name: string;
  subscribers: number;
  postApprovalRate: number;
  avgUpvotes: number;
  conversionRate: number;
  lastPost?: Date;
  verified: boolean;
}

export default function RedditDashboard() {
  const [selectedSubreddit, setSelectedSubreddit] = useState('OnlyFansPromotions');
  const [testTitle, setTestTitle] = useState('[F] New content from today\'s shoot');
  const [hasLink, setHasLink] = useState(true);
  const [preflightResult, setPreflightResult] = useState<any>(null);
  
  // Mock data
  const subredditStats: SubredditStats[] = [
    {
      name: 'OnlyFansPromotions',
      subscribers: 450000,
      postApprovalRate: 92,
      avgUpvotes: 125,
      conversionRate: 3.2,
      lastPost: new Date(Date.now() - 86400000),
      verified: false
    },
    {
      name: 'OnlyFans101',
      subscribers: 380000,
      postApprovalRate: 78,
      avgUpvotes: 89,
      conversionRate: 2.8,
      lastPost: new Date(Date.now() - 172800000),
      verified: true
    },
    {
      name: 'RealGirls',
      subscribers: 2100000,
      postApprovalRate: 45,
      avgUpvotes: 450,
      conversionRate: 4.5,
      lastPost: new Date(Date.now() - 604800000),
      verified: true
    }
  ];
  
  const currentRules = SUBREDDIT_RULES[selectedSubreddit] || SUBREDDIT_RULES['OnlyFansPromotions'];
  const currentStats = subredditStats.find(s => s.name === selectedSubreddit);
  
  const runPreflightCheck = async () => {
    const result = await redditAutomation.preflightCheck(selectedSubreddit, {
      title: testTitle,
      hasLink,
      hasMedia: true,
      nsfw: true,
      flair: currentRules.requiresFlair || undefined
    });
    setPreflightResult(result);
  };
  
  const getRiskColor = (risk: number) => {
    if (risk < 0.3) return 'text-green-600';
    if (risk < 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getApprovalColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <MessageSquare className="w-5 h-5 text-orange-600 mb-2" />
          <p className="text-sm text-gray-500">Active Subreddits</p>
          <p className="text-2xl font-bold">12</p>
          <p className="text-xs text-green-600">+3 verified</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <TrendingUp className="w-5 h-5 text-blue-600 mb-2" />
          <p className="text-sm text-gray-500">Avg Approval Rate</p>
          <p className="text-2xl font-bold">71%</p>
          <p className="text-xs text-gray-600">Across all subs</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <Users className="w-5 h-5 text-purple-600 mb-2" />
          <p className="text-sm text-gray-500">Monthly Conversions</p>
          <p className="text-2xl font-bold">89</p>
          <p className="text-xs text-green-600">+22% vs last month</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <BarChart className="w-5 h-5 text-green-600 mb-2" />
          <p className="text-sm text-gray-500">Reddit LTV</p>
          <p className="text-2xl font-bold">$127</p>
          <p className="text-xs text-gray-600">90 day average</p>
        </div>
      </div>

      {/* Subreddit Manager */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Subreddit Rules & Performance</h2>
        
        {/* Subreddit Selector */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {subredditStats.map(sub => (
            <button
              key={sub.name}
              onClick={() => setSelectedSubreddit(sub.name)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedSubreddit === sub.name
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">r/{sub.name}</h3>
                {sub.verified && (
                  <span title="Verified"><Shield className="w-4 h-4 text-green-600" /></span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-2">
                {(sub.subscribers / 1000).toFixed(0)}k subscribers
              </p>
              <div className="text-sm">
                <span className={getApprovalColor(sub.postApprovalRate)}>
                  {sub.postApprovalRate}% approval
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Current Rules */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">Subreddit Rules</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {currentRules.requiresNSFW ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <X className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm">NSFW tag required</span>
              </div>
              
              <div className="flex items-center gap-2">
                {currentRules.requiresVerification ? (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                ) : (
                  <Check className="w-4 h-4 text-green-600" />
                )}
                <span className="text-sm">
                  {currentRules.requiresVerification 
                    ? `Verification required: ${currentRules.verificationFormat}`
                    : 'No verification needed'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {currentRules.linkInFirstCommentOnly ? (
                  <Link className="w-4 h-4 text-blue-600" />
                ) : (
                  <X className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm">
                  {currentRules.linkInFirstCommentOnly 
                    ? 'Links in first comment only'
                    : currentRules.allowsLinks 
                      ? 'Links allowed in post'
                      : 'No links allowed'}
                </span>
              </div>
              
              {currentRules.minKarma && (
                <div className="text-sm text-gray-600">
                  Min karma: {currentRules.minKarma}
                </div>
              )}
              
              {currentRules.cooldownHours && (
                <div className="text-sm text-gray-600">
                  Cooldown: {currentRules.cooldownHours}h between posts
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Banned Words</h3>
            <div className="flex flex-wrap gap-2">
              {currentRules.bannedWords.map(word => (
                <span key={word} className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs">
                  {word}
                </span>
              ))}
            </div>
            
            {currentRules.titleFormat && (
              <div className="mt-3">
                <p className="text-sm font-medium">Title Format:</p>
                <code className="text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                  {currentRules.titleFormat}
                </code>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pre-flight Check Tool */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Pre-flight Check
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Test Title</label>
            <input
              type="text"
              value={testTitle}
              onChange={(e) => setTestTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              placeholder="[F] Your title here"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={hasLink}
                onChange={(e) => setHasLink(e.target.checked)}
              />
              <span className="text-sm">Has link</span>
            </label>
            
            <button
              onClick={runPreflightCheck}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Run Check
            </button>
          </div>
          
          {preflightResult && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Check Result</h4>
                <span className={`font-bold ${getRiskColor(preflightResult.risk)}`}>
                  Risk: {(preflightResult.risk * 100).toFixed(0)}%
                </span>
              </div>
              
              {preflightResult.blockers.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-red-600 mb-1">Blockers:</p>
                  <ul className="list-disc pl-5 text-sm">
                    {preflightResult.blockers.map((blocker: string, idx: number) => (
                      <li key={idx}>{blocker}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {preflightResult.warnings.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-yellow-600 mb-1">Warnings:</p>
                  <ul className="list-disc pl-5 text-sm">
                    {preflightResult.warnings.map((warning: string, idx: number) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {preflightResult.canPost && (
                <p className="text-green-600 font-medium mt-3">✅ Safe to post!</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Best Practices */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Reddit Best Practices</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {Object.entries(REDDIT_BEST_PRACTICES).slice(0, 4).map(([category, practices]) => (
            <div key={category}>
              <h3 className="font-medium text-sm mb-2 capitalize">
                {category.replace('_', ' ')}
              </h3>
              <ul className="space-y-1">
                {(practices as string[]).map((practice, idx) => (
                  <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">•</span>
                    {practice}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
          <Hash className="w-5 h-5 text-orange-600 mb-2" />
          <p className="text-sm font-medium">Top Performing Sub</p>
          <p className="text-lg font-bold">r/RealGirls</p>
          <p className="text-xs text-gray-600">4.5% conversion rate</p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <Clock className="w-5 h-5 text-blue-600 mb-2" />
          <p className="text-sm font-medium">Best Posting Time</p>
          <p className="text-lg font-bold">10pm EST</p>
          <p className="text-xs text-gray-600">Highest engagement</p>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
          <TrendingUp className="w-5 h-5 text-purple-600 mb-2" />
          <p className="text-sm font-medium">Avg Reddit → OF</p>
          <p className="text-lg font-bold">3.2%</p>
          <p className="text-xs text-gray-600">Click to sub rate</p>
        </div>
      </div>
    </div>
  );
}
