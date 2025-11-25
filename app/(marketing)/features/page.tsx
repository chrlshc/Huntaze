'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { 
  Zap, 
  TrendingUp, 
  Users, 
  Shield, 
  DollarSign,
  BarChart3,
  Clock,
  Sparkles,
  MessageSquare,
  Calendar,
  Globe,
  Bot,
  Target,
  Workflow
} from 'lucide-react';
import { FeatureCardProps } from '@/components/features/FeatureCard';

// Dynamic imports for heavy components to reduce initial bundle size
const FeatureGrid = dynamic(() => import('@/components/features/FeatureGrid').then(mod => ({ default: mod.FeatureGrid })), {
  loading: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="space-y-4 animate-pulse">
          <div className="h-12 w-12 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        </div>
      ))}
    </div>
  ),
  ssr: false,
});

const FeatureDetail = dynamic(() => import('@/components/features/FeatureDetail').then(mod => ({ default: mod.FeatureDetail })), {
  ssr: false,
});

// Feature data organized by category
const featuresData: Array<FeatureCardProps & { longDescription: string; benefits: string[] }> = [
  // Automation features
  {
    id: 'intelligent-automation',
    icon: Sparkles,
    title: 'Intelligent Automation',
    description: 'Save 10+ hours per week with AI-powered workflows that handle repetitive tasks automatically',
    longDescription: 'Our intelligent automation system uses advanced AI to learn your workflow patterns and automate repetitive tasks. Set up rules once and let the system handle the rest, freeing you to focus on high-value work.',
    benefits: [
      'Visual workflow builder with drag-and-drop interface',
      'Pre-built templates for common automation scenarios',
      'Conditional logic and branching for complex workflows',
      'Real-time monitoring and performance tracking',
      'Automatic error handling and retry mechanisms'
    ],
    category: 'automation',
    metric: 'Save 10h/week',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 'smart-scheduling',
    icon: Calendar,
    title: 'Smart Scheduling',
    description: 'Automatically schedule content and tasks at optimal times based on audience engagement patterns',
    longDescription: 'Our AI analyzes your audience engagement patterns and automatically schedules your content for maximum impact. No more guessing when to post - let data drive your timing decisions.',
    benefits: [
      'AI-powered optimal timing recommendations',
      'Bulk scheduling with intelligent distribution',
      'Timezone-aware scheduling for global audiences',
      'Automatic rescheduling for failed posts',
      'Calendar view with drag-and-drop editing'
    ],
    category: 'automation',
    metric: '3x better engagement',
    gradient: 'from-blue-500 to-purple-500'
  },
  {
    id: 'workflow-builder',
    icon: Workflow,
    title: 'Workflow Builder',
    description: 'Create custom workflows that connect your tools and automate complex multi-step processes',
    longDescription: 'Build sophisticated workflows that span multiple platforms and tools. Connect triggers, actions, and conditions to create powerful automation that adapts to your needs.',
    benefits: [
      'Connect 100+ apps and services',
      'Multi-step workflows with branching logic',
      'Custom variables and data transformation',
      'Webhook support for custom integrations',
      'Version control and workflow templates'
    ],
    category: 'automation',
    metric: '100+ integrations',
    gradient: 'from-indigo-500 to-blue-500'
  },
  // Analytics features
  {
    id: 'real-time-analytics',
    icon: BarChart3,
    title: 'Real-time Analytics',
    description: 'Make data-driven decisions 3x faster with instant insights and customizable dashboards',
    longDescription: 'Get instant visibility into your performance with real-time analytics dashboards. Track key metrics, identify trends, and make informed decisions based on up-to-the-minute data.',
    benefits: [
      'Real-time data updates with no refresh needed',
      'Customizable dashboards with drag-and-drop widgets',
      'Advanced filtering and segmentation',
      'Export reports in multiple formats',
      'Automated insights and anomaly detection'
    ],
    category: 'analytics',
    metric: '3x faster decisions',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'performance-tracking',
    icon: TrendingUp,
    title: 'Performance Tracking',
    description: 'Track all your key metrics in one place with comprehensive performance monitoring',
    longDescription: 'Monitor your performance across all channels with unified tracking. See what\'s working, identify opportunities, and optimize your strategy based on comprehensive data.',
    benefits: [
      'Cross-platform metric aggregation',
      'Custom KPI tracking and goal setting',
      'Historical data analysis and trending',
      'Comparative analysis across time periods',
      'Automated performance reports'
    ],
    category: 'analytics',
    metric: 'All metrics unified',
    gradient: 'from-green-500 to-teal-500'
  },
  {
    id: 'audience-insights',
    icon: Users,
    title: 'Audience Insights',
    description: 'Understand your audience better with detailed demographic and behavioral analytics',
    longDescription: 'Gain deep insights into who your audience is and how they engage with your content. Use this data to create more targeted and effective campaigns.',
    benefits: [
      'Demographic breakdowns and segmentation',
      'Engagement pattern analysis',
      'Audience growth tracking',
      'Content preference insights',
      'Predictive audience modeling'
    ],
    category: 'analytics',
    metric: 'Deep audience data',
    gradient: 'from-cyan-500 to-blue-500'
  },
  // Growth features
  {
    id: 'ai-assistant',
    icon: Bot,
    title: 'AI Assistant',
    description: 'Get intelligent suggestions and automated responses powered by advanced AI',
    longDescription: 'Our AI assistant helps you work smarter by providing intelligent suggestions, generating content ideas, and automating routine communications.',
    benefits: [
      'Context-aware content suggestions',
      'Automated response generation',
      'Sentiment analysis and tone adjustment',
      'Multi-language support',
      'Learning from your style and preferences'
    ],
    category: 'growth',
    metric: 'AI-powered growth',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 'growth-tools',
    icon: Target,
    title: 'Growth Tools',
    description: 'Accelerate your growth with proven strategies and automated outreach campaigns',
    longDescription: 'Access a suite of growth tools designed to help you expand your reach and engage new audiences. From automated outreach to viral content optimization.',
    benefits: [
      'Automated outreach campaigns',
      'Viral content identification',
      'Competitor analysis and benchmarking',
      'Growth opportunity recommendations',
      'A/B testing for optimization'
    ],
    category: 'growth',
    metric: '2x faster growth',
    gradient: 'from-pink-500 to-rose-500'
  },
  {
    id: 'team-collaboration',
    icon: Users,
    title: 'Team Collaboration',
    description: 'Work seamlessly with your team with built-in collaboration and approval workflows',
    longDescription: 'Enable your team to work together efficiently with real-time collaboration features, approval workflows, and role-based permissions.',
    benefits: [
      'Real-time collaborative editing',
      'Approval workflows and content review',
      'Role-based access control',
      'Activity feed and notifications',
      'Team performance analytics'
    ],
    category: 'growth',
    metric: '50% fewer meetings',
    gradient: 'from-orange-500 to-red-500'
  }
];

export default function FeaturesPage() {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const handleFeatureClick = (id: string) => {
    setSelectedFeature(id);
  };

  const handleCloseDetail = () => {
    setSelectedFeature(null);
  };

  const selectedFeatureData = featuresData.find(f => f.id === selectedFeature);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-pink-50" />
        <div className="relative max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <span className="inline-block px-4 py-2 bg-purple-100 text-purple-600 rounded-full text-sm font-medium mb-6">
              Platform Features
            </span>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Features that Drive Success
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover how Huntaze transforms your workflow with powerful tools 
              and an intuitive interface designed for modern teams
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid - Organized by Category */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <FeatureGrid 
            features={featuresData} 
            onFeatureClick={handleFeatureClick}
          />
        </div>
      </section>

      {/* Feature Detail Modal */}
      {selectedFeatureData && (
        <FeatureDetail
          id={selectedFeatureData.id}
          icon={selectedFeatureData.icon}
          title={selectedFeatureData.title}
          description={selectedFeatureData.description}
          longDescription={selectedFeatureData.longDescription}
          benefits={selectedFeatureData.benefits}
          gradient={selectedFeatureData.gradient}
          isOpen={!!selectedFeature}
          onClose={handleCloseDetail}
        />
      )}

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-12 text-white"
          >
            <h2 className="text-4xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join the waitlist and be among the first to experience Huntaze
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/join">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white text-purple-600 font-bold rounded-xl hover:shadow-xl transition-all duration-300"
                >
                  Request Access
                </motion.button>
              </Link>
              <Link href="/contact">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white/20 backdrop-blur text-white font-bold rounded-xl hover:bg-white/30 transition-all duration-300"
                >
                  Contact Sales
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}