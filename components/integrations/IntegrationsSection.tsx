'use client';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

// Integration data structure
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
  { id: '9', name: 'Segment', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=segment', category: 'analytics', featured: false, description: 'Customer data platform' },
  
  // Payment & Finance
  { id: '10', name: 'Stripe', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=stripe', category: 'payment', featured: true, description: 'Payment processing' },
  { id: '11', name: 'PayPal', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=paypal', category: 'payment', featured: false, description: 'Online payments' },
  { id: '12', name: 'Square', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=square', category: 'payment', featured: false, description: 'Payment solutions' },
  
  // Productivity
  { id: '13', name: 'Notion', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=notion', category: 'productivity', featured: true, description: 'Workspace & notes' },
  { id: '14', name: 'Google Calendar', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=gcal', category: 'productivity', featured: true, description: 'Calendar & scheduling' },
  { id: '15', name: 'Calendly', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=calendly', category: 'productivity', featured: false, description: 'Meeting scheduler' },
  { id: '16', name: 'Airtable', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=airtable', category: 'productivity', featured: false, description: 'Database & spreadsheets' },
  
  // Marketing
  { id: '17', name: 'Mailchimp', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=mailchimp', category: 'marketing', featured: true, description: 'Email marketing' },
  { id: '18', name: 'ConvertKit', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=convertkit', category: 'marketing', featured: false, description: 'Creator marketing' },
  { id: '19', name: 'Buffer', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=buffer', category: 'marketing', featured: false, description: 'Social media management' },
  { id: '20', name: 'Hootsuite', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=hootsuite', category: 'marketing', featured: false, description: 'Social media suite' },
  
  // Storage & Content
  { id: '21', name: 'Google Drive', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=gdrive', category: 'storage', featured: true, description: 'Cloud storage' },
  { id: '22', name: 'Dropbox', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=dropbox', category: 'storage', featured: false, description: 'File storage' },
  { id: '23', name: 'AWS S3', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=aws', category: 'storage', featured: false, description: 'Object storage' },
  
  // CRM
  { id: '24', name: 'Salesforce', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=salesforce', category: 'crm', featured: true, description: 'Enterprise CRM' },
  { id: '25', name: 'HubSpot', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=hubspot', category: 'crm', featured: false, description: 'Marketing CRM' },
  { id: '26', name: 'Pipedrive', logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=pipedrive', category: 'crm', featured: false, description: 'Sales CRM' },
];

const categories = [
  { id: 'all', name: 'All', icon: '🔗' },
  { id: 'social', name: 'Social Media', icon: '📱' },
  { id: 'communication', name: 'Communication', icon: '💬' },
  { id: 'analytics', name: 'Analytics', icon: '📊' },
  { id: 'payment', name: 'Payments', icon: '💳' },
  { id: 'productivity', name: 'Productivity', icon: '⚡' },
  { id: 'marketing', name: 'Marketing', icon: '📣' },
  { id: 'storage', name: 'Storage', icon: '☁️' },
  { id: 'crm', name: 'CRM', icon: '🎯' }
];

export function IntegrationsSection() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Filtered integrations with memoization
  const filteredIntegrations = useMemo(() => {
    return integrations.filter(integration => {
      const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
      const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    show: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring" as const,
        damping: 20,
        stiffness: 300
      }
    }
  };

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8">
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
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {categories.map((category) => (
            <motion.button
              key={category.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
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
            </motion.button>
          ))}
        </div>

        {/* Integration Grid */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <AnimatePresence mode="popLayout">
            {filteredIntegrations.map((integration) => (
              <motion.div
                key={integration.id}
                variants={itemVariants}
                layout
                className="group relative"
                onHoverStart={() => setHoveredId(integration.id)}
                onHoverEnd={() => setHoveredId(null)}
              >
                <motion.div
                  className="relative bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-xl transition-shadow duration-200 cursor-pointer"
                  whileHover={{ y: -4 }}
                >
                  {/* Featured Badge */}
                  {integration.featured && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Popular
                    </div>
                  )}

                  {/* Logo with grayscale effect */}
                  <motion.div
                    className="relative aspect-square w-full mb-3"
                    animate={{
                      filter: hoveredId === integration.id ? 'grayscale(0%)' : 'grayscale(100%)',
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <Image
                      src={integration.logo}
                      alt={`${integration.name} logo`}
                      fill
                      className="object-contain p-2"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                      loading="lazy"
                    />
                  </motion.div>

                  {/* Integration Name */}
                  <h3 className="text-sm font-medium text-gray-900 text-center">
                    {integration.name}
                  </h3>

                  {/* Hover Overlay */}
                  <AnimatePresence>
                    {hoveredId === integration.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex flex-col items-center justify-center text-white p-4"
                      >
                        <p className="text-xs text-center mb-3">{integration.description}</p>
                        <button className="text-xs bg-white text-purple-600 px-3 py-1.5 rounded-full font-medium hover:bg-gray-100 transition-colors">
                          Connect
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty State */}
        {filteredIntegrations.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-gray-500 mb-4">No integrations found matching your criteria.</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Clear filters
            </button>
          </motion.div>
        )}

        {/* CTA Section */}
        <motion.div
          className="text-center mt-20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-gray-600 mb-6">
            Can't find what you're looking for?
          </p>
          <button className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-medium hover:shadow-lg transition-all duration-300 hover:scale-105">
            Request an Integration
          </button>
          <p className="text-sm text-gray-500 mt-4">
            We add new integrations every week based on user feedback
          </p>
        </motion.div>
      </div>
    </section>
  );
}