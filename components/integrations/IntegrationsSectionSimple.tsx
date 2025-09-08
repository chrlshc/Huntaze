'use client';
import { useState, useMemo } from 'react';
import Image from 'next/image';

interface Integration {
  id: string;
  name: string;
  logo: string;
  category: string;
  featured: boolean;
  description: string;
}

const integrations: Integration[] = [
  // Social & Communication
  { id: '1', name: 'Instagram', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=instagram', category: 'social', featured: true, description: 'Social media platform' },
  { id: '2', name: 'TikTok', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=tiktok', category: 'social', featured: true, description: 'Video platform' },
  { id: '3', name: 'Twitter/X', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=twitter', category: 'social', featured: true, description: 'Social network' },
  { id: '4', name: 'OnlyFans', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=onlyfans', category: 'social', featured: true, description: 'Content platform' },
  { id: '5', name: 'Slack', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=slack', category: 'communication', featured: true, description: 'Team messaging' },
  { id: '6', name: 'Discord', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=discord', category: 'communication', featured: false, description: 'Community platform' },
  
  // Analytics & Data
  { id: '7', name: 'Google Analytics', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=ga', category: 'analytics', featured: true, description: 'Web analytics' },
  { id: '8', name: 'Mixpanel', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=mixpanel', category: 'analytics', featured: false, description: 'Product analytics' },
  
  // Payment & Finance
  { id: '10', name: 'Stripe', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=stripe', category: 'payment', featured: true, description: 'Payment processing' },
  { id: '11', name: 'PayPal', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=paypal', category: 'payment', featured: false, description: 'Online payments' },
  
  // Productivity
  { id: '13', name: 'Notion', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=notion', category: 'productivity', featured: true, description: 'Workspace & notes' },
  { id: '14', name: 'Google Calendar', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=gcal', category: 'productivity', featured: true, description: 'Calendar & scheduling' },
  
  // Marketing
  { id: '17', name: 'Mailchimp', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=mailchimp', category: 'marketing', featured: true, description: 'Email marketing' },
  { id: '18', name: 'ConvertKit', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=convertkit', category: 'marketing', featured: false, description: 'Creator marketing' },
  
  // Storage
  { id: '21', name: 'Google Drive', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=gdrive', category: 'storage', featured: true, description: 'Cloud storage' },
  { id: '22', name: 'Dropbox', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=dropbox', category: 'storage', featured: false, description: 'File storage' },
];

const categories = [
  { id: 'all', name: 'All', icon: '🔗' },
  { id: 'social', name: 'Social Media', icon: '📱' },
  { id: 'communication', name: 'Communication', icon: '💬' },
  { id: 'analytics', name: 'Analytics', icon: '📊' },
  { id: 'payment', name: 'Payments', icon: '💳' },
  { id: 'productivity', name: 'Productivity', icon: '⚡' },
  { id: 'marketing', name: 'Marketing', icon: '📣' },
  { id: 'storage', name: 'Storage', icon: '☁️' }
];

export function IntegrationsSectionSimple() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIntegrations = useMemo(() => {
    return integrations.filter(integration => {
      const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
      const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm]);

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8 animate-fadeIn">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search integrations..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 justify-center mb-12 animate-slideUp delay-200">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 hover-scale ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
              {selectedCategory === category.id && (
                <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {filteredIntegrations.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Integration Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {filteredIntegrations.map((integration, index) => (
            <div
              key={integration.id}
              className={`group relative animate-scaleIn delay-${Math.min((index + 1) * 100, 800)}`}
            >
              <div className="relative bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-xl transition-all duration-200 cursor-pointer hover-lift">
                <div className="w-16 h-16 mx-auto mb-3 rounded-lg overflow-hidden grayscale group-hover:grayscale-0 transition-all">
                  <Image 
                    src={integration.logo}
                    alt={integration.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="text-sm font-medium text-center text-gray-900">
                  {integration.name}
                </h3>
                {integration.featured && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full" />
                )}
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {integration.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center animate-fadeIn delay-800">
          <p className="text-lg text-gray-600 mb-6">
            Don't see your favorite tool? 
          </p>
          <a 
            href="/contact" 
            className="btn btn-secondary inline-flex items-center gap-2 hover-glow"
          >
            Request Integration
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}