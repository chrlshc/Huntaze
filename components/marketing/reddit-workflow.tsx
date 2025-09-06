'use client';

import { useState } from 'react';
import { 
  MessageSquare, 
  Search, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Globe,
  Hash,
  Link,
  TrendingUp
} from 'lucide-react';
import { redditAutomation } from '@/lib/marketing/reddit-automation';
import { REDDIT_TEMPLATES } from '@/lib/marketing/reddit-templates';
import { findEasySubreddits } from '@/lib/marketing/reddit-rules-loader';

export default function RedditWorkflow() {
  const [selectedNiche, setSelectedNiche] = useState('amateur');
  const [language, setLanguage] = useState<'en'>('en');
  const [karma, setKarma] = useState(250);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [suitableSubreddits, setSuitableSubreddits] = useState<string[]>([]);
  
  const generateRedditCampaign = async () => {
    // Find suitable subreddits
    const subs = findEasySubreddits(karma);
    setSuitableSubreddits(subs);
    
    // Generate title
    const title = redditAutomation.generateSafeTitle(selectedNiche);
    
    // Generate variations for A/B testing
    const variations = redditAutomation.generateTitleVariations(selectedNiche, 3);
    
    // Get template for first comment
    const template = REDDIT_TEMPLATES.find(t => t.niche === selectedNiche);
    const firstComment = template?.firstComments[0] || '';
    
    // Find best subreddits for niche
    const nicheSubreddits = await redditAutomation.findBestSubreddits(selectedNiche, karma);
    
    setGeneratedContent({
      title,
      variations,
      firstComment,
      suitableSubreddits: subs,
      nicheSubreddits,
      language,
      niche: selectedNiche
    });
  };
  
  return (
    <div className="space-y-6">
      {/* Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Reddit Campaign Generator</h2>
        
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Select Niche</label>
            <select
              value={selectedNiche}
              onChange={(e) => setSelectedNiche(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              {REDDIT_TEMPLATES.map(template => (
                <option key={template.niche} value={template.niche}>
                  {template.niche.charAt(0).toUpperCase() + template.niche.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              <option value="en">English</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Your Karma</label>
            <input
              type="number"
              value={karma}
              onChange={(e) => setKarma(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              placeholder="250"
            />
          </div>
        </div>
        
        <button
          onClick={generateRedditCampaign}
          className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          Generate Campaign
        </button>
      </div>
      
      {/* Generated Content */}
      {generatedContent && (
        <>
          {/* Title Suggestions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Generated Titles
            </h3>
            
            <div className="space-y-3">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="font-medium">Primary Title:</p>
                <p className="text-sm">{generatedContent.title}</p>
              </div>
              
              <div>
                <p className="font-medium mb-2">A/B Test Variations:</p>
                {generatedContent.variations.map((variation: string, idx: number) => (
                  <div key={idx} className="p-2 bg-gray-50 dark:bg-gray-900 rounded mb-2">
                    <span className="text-xs text-gray-500">Variant {idx + 1}:</span>
                    <p className="text-sm">{variation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* First Comment Template */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Link className="w-5 h-5" />
              First Comment Template
            </h3>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{generatedContent.firstComment}</p>
              <p className="text-xs text-gray-500 mt-2">
                Note: Replace {'{link}'} with your OnlyFans URL
              </p>
            </div>
          </div>
          
          {/* Suitable Subreddits */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Search className="w-5 h-5" />
              Suitable Subreddits (Based on {karma} karma)
            </h3>
            
            <div className="grid md:grid-cols-2 gap-3">
              {generatedContent.suitableSubreddits.map((sub: string) => (
                <div key={sub} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <span className="font-medium">r/{sub}</span>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Niche-Specific Recommendations */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Best "{selectedNiche}" Subreddits
            </h3>
            
            <div className="space-y-3">
              {generatedContent.nicheSubreddits.map((sub: any) => (
                <div key={sub.name} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">r/{sub.name}</h4>
                    <span className={`px-2 py-1 rounded text-xs ${
                      sub.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      sub.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {sub.difficulty}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Subscribers:</span>
                      <p className="font-medium">{sub.subscribers.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Avg Upvotes:</span>
                      <p className="font-medium">{sub.avgUpvotes}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Conv. Rate:</span>
                      <p className="font-medium">{sub.conversionRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Posting Tips */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Reddit Posting Best Practices</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Post your link in the first comment within 1 minute</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Reply to early comments to boost visibility</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Best times: 10pm-2am EST when Americans are active</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Use reddit-hosted images (i.reddit.com) for better reach</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-sm">Never mention prices or "selling" in posts</span>
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
