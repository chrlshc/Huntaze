'use client';

import React from 'react';
import { Check, X, Sparkles } from 'lucide-react';

export default function PlanDetails() {
  const features = [
    {
      category: 'AI & Messaging',
      items: [
        { feature: 'AI messages per month', starter: '1,000', pro: '5,000', scale: '25,000', enterprise: 'Unlimited' },
        { feature: 'Primary AI model', starter: 'GPT-4', pro: 'GPT-4-Turbo', scale: 'GPT-4-Turbo', enterprise: 'GPT-4o' },
        { feature: 'Secondary AI model', starter: '-', pro: 'Claude Haiku', scale: 'Claude Sonnet', enterprise: 'Claude Opus' },
        { feature: 'Conversion uplift', starter: '+15-20%', pro: '+35-40%', scale: '+55-65%', enterprise: '+75-90%' },
        { feature: 'Style learning', starter: false, pro: true, scale: true, enterprise: true },
        { feature: 'Custom AI personality', starter: false, pro: false, scale: false, enterprise: true },
      ]
    },
    {
      category: 'Fan Segmentation',
      items: [
        { feature: 'Basic segments', starter: '4', pro: '10', scale: '10+', enterprise: 'Unlimited' },
        { feature: 'VIP/Whale detection', starter: false, pro: true, scale: true, enterprise: true },
        { feature: 'Churn score', starter: false, pro: true, scale: true, enterprise: true },
        { feature: 'Behavior prediction', starter: false, pro: false, scale: true, enterprise: true },
        { feature: '“Message these fans” list', starter: true, pro: true, scale: true, enterprise: true },
        { feature: 'Auto follow‑ups', starter: 'Basic', pro: 'Advanced', scale: 'AI Smart', enterprise: 'Predictive' },
      ]
    },
    {
      category: 'Sales & PPV',
      items: [
        { feature: 'Welcome messages', starter: true, pro: true, scale: true, enterprise: true },
        { feature: 'Automated PPV', starter: true, pro: true, scale: true, enterprise: true },
        { feature: 'Sales pings 🔔', starter: true, pro: true, scale: true, enterprise: true },
        { feature: 'Psych tactics', starter: false, pro: 'Basic FOMO', scale: 'Advanced (6 types)', enterprise: 'Unlimited' },
        { feature: 'A/B Testing', starter: false, pro: true, scale: true, enterprise: 'Auto-winner' },
        { feature: 'Abandoned cart recovery', starter: false, pro: false, scale: true, enterprise: true },
      ]
    },
    {
      category: 'Growth & Marketing',
      items: [
        { feature: 'Cross-platform (IG/TikTok/Reddit)', starter: false, pro: true, scale: true, enterprise: true },
        { feature: 'Safe captions', starter: false, pro: true, scale: true, enterprise: true },
        { feature: 'Shadowban detection', starter: false, pro: true, scale: true, enterprise: true },
        { feature: 'Reddit automation (rules + linking)', starter: false, pro: false, scale: true, enterprise: true },
        { feature: 'S4S Marketplace', starter: false, pro: false, scale: true, enterprise: true },
        { feature: 'Trend Calendar', starter: false, pro: false, scale: true, enterprise: true },
        { feature: 'Viral AI content', starter: false, pro: false, scale: true, enterprise: true },
      ]
    },
    {
      category: 'Retention',
      items: [
        { feature: 'Points system', starter: false, pro: true, scale: true, enterprise: true },
        { feature: 'Badges & rewards', starter: false, pro: true, scale: true, enterprise: 'Custom' },
        { feature: 'Loyalty tiers', starter: false, pro: '3 tiers', scale: '4 tiers', enterprise: 'Unlimited' },
        { feature: 'Auto celebrations', starter: false, pro: true, scale: true, enterprise: true },
        { feature: 'Pricing optimizer ($10 max)', starter: false, pro: true, scale: true, enterprise: true },
      ]
    },
    {
      category: 'Team & Ops',
      items: [
        { feature: 'OnlyFans accounts', starter: '1', pro: '1', scale: '3', enterprise: 'Unlimited' },
        { feature: 'Offline chatters mode', starter: false, pro: false, scale: true, enterprise: true },
        { feature: 'Team access', starter: false, pro: false, scale: '3 seats', enterprise: 'Unlimited' },
        { feature: 'Niche scripts', starter: false, pro: '5 niches', scale: '15+ niches', enterprise: 'Custom' },
        { feature: 'API access', starter: false, pro: false, scale: false, enterprise: true },
        { feature: 'White-label interface', starter: false, pro: false, scale: false, enterprise: true },
      ]
    },
    {
      category: 'Support & Onboarding',
      items: [
        { feature: 'Support', starter: 'Email', pro: 'Priority', scale: 'Priority', enterprise: 'Dedicated' },
        { feature: 'Onboarding', starter: 'Tutorial', pro: 'Guided', scale: 'Personalized', enterprise: 'White glove' },
        { feature: 'Success Manager', starter: false, pro: false, scale: false, enterprise: true },
        { feature: 'Updates', starter: 'Monthly', pro: 'Weekly', scale: 'Weekly', enterprise: 'Beta access' },
        { feature: 'Training', starter: 'Docs', pro: 'Videos', scale: 'Webinars', enterprise: '1‑on‑1' },
      ]
    },
    {
      category: 'Commission & Limites',
      items: [
        { feature: 'Commission plateforme', starter: '7%', pro: '5%', scale: '3%', enterprise: '1.5%' },
        { feature: 'Tu gardes', starter: '93%', pro: '95%', scale: '97%', enterprise: '98.5%' },
        { feature: 'Revenue cap mensuel', starter: '$2,500', pro: '$7,500', scale: '$25,000', enterprise: 'Illimité' },
        { feature: 'Économies vs agence', starter: '$841/mois', pro: '$2,363/mois', scale: '$9,621/mois', enterprise: '$24,051/mois' },
      ]
    }
  ];

  const renderValue = (value: string | boolean | number) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-600 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-gray-300 mx-auto" />
      );
    }
    return <span className="text-sm font-medium">{value}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Detailed Plan Comparison</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Each plan is optimized for your OnlyFans revenue level
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left p-6">Feature</th>
              <th className="text-center p-6">
                <div>
                  <div className="text-lg font-bold">STARTER</div>
                  <div className="text-sm text-gray-500">$19/mo</div>
                  <div className="text-xs text-green-600">7‑day trial</div>
                </div>
              </th>
              <th className="text-center p-6">
                <div>
                  <div className="text-lg font-bold text-purple-600">PRO</div>
                  <div className="text-sm text-gray-500">$39/mo</div>
                  <div className="text-xs text-purple-600">POPULAIRE</div>
                </div>
              </th>
              <th className="text-center p-6">
                <div>
                  <div className="text-lg font-bold text-blue-600">SCALE</div>
                  <div className="text-sm text-gray-500">$79/mo</div>
                  <div className="text-xs text-blue-600">BEST VALUE</div>
                </div>
              </th>
              <th className="text-center p-6">
                <div>
                  <div className="text-lg font-bold text-yellow-600">ENTERPRISE</div>
                  <div className="text-sm text-gray-500">$199/mo</div>
                  <div className="text-xs text-yellow-600">TOP 1%</div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {features.map((category, catIdx) => (
              <React.Fragment key={`cat-${catIdx}`}>
                <tr className="bg-gray-50 dark:bg-gray-900">
                  <td colSpan={5} className="p-4 font-semibold text-sm uppercase tracking-wide">
                    {category.category}
                  </td>
                </tr>
                {category.items.map((item, idx) => (
                  <tr key={`${catIdx}-${idx}`} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="p-4 text-sm">{item.feature}</td>
                    <td className="p-4 text-center">{renderValue(item.starter)}</td>
                    <td className="p-4 text-center bg-purple-50 dark:bg-purple-900/10">{renderValue(item.pro)}</td>
                    <td className="p-4 text-center">{renderValue(item.scale)}</td>
                    <td className="p-4 text-center">{renderValue(item.enterprise)}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Revenue-based recommendations */}
      <div className="mt-12 grid md:grid-cols-4 gap-6">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6">
          <h3 className="font-bold mb-2">STARTER recommended if:</h3>
          <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
            <li>• You’re starting on OF</li>
            <li>• Revenue &lt; $2,500/month</li>
            <li>• 50‑500 active fans</li>
            <li>• You want to test AI</li>
          </ul>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6">
          <h3 className="font-bold mb-2">PRO recommended if:</h3>
          <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
            <li>• Revenue $2.5k‑7.5k/month</li>
            <li>• 500‑2,000 active fans</li>
            <li>• You want more conversions</li>
            <li>• Cross‑platform is important</li>
          </ul>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
          <h3 className="font-bold mb-2">SCALE recommended if:</h3>
          <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
            <li>• Revenue $7.5k‑25k/month</li>
            <li>• 2,000+ active fans</li>
            <li>• You want full automation</li>
            <li>• S4S & trends are vital</li>
          </ul>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6">
          <h3 className="font-bold mb-2">ENTERPRISE recommended if:</h3>
          <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
            <li>• Revenue $25k+/month</li>
            <li>• Top 1% creators</li>
            <li>• Chatters team</li>
            <li>• Custom needs</li>
          </ul>
        </div>
      </div>

      {/* ROI Calculator */
      <div className="mt-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 text-white text-center">
        <Sparkles className="w-12 h-12 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-4">Quick ROI Calculation</h3>
        <p className="mb-6">
          If you earn $5,000/month with an agency (50% fee), you pay $2,500/month.<br/>
          With Huntaze PRO (5%), you pay only $239 ($39 + $200 fee).
        </p>
        <p className="text-3xl font-bold">
          You save $2,261 per month!
        </p>
        <p className="text-sm mt-2 opacity-90">
          That’s $27,132 per year in your pocket 💰
        </p>
      </div>
    </div>
  );
}
