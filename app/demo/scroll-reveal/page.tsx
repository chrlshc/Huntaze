'use client';

import { ArrowLeft, Zap, Shield, Rocket, Users, TrendingUp, Award } from 'lucide-react';
import Link from 'next/link';
import { ScrollReveal, ScrollRevealList, ScrollRevealScale } from '@/components/animations/ScrollReveal';

/**
 * Scroll Reveal Animations Demo
 * 
 * Demonstrates scroll-triggered animations with whileInView.
 * Requirements: 4.7
 */

const features = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Lightning Fast',
    description: 'Optimized performance for instant loading and smooth interactions.',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Secure by Default',
    description: 'Enterprise-grade security with end-to-end encryption.',
  },
  {
    icon: <Rocket className="w-6 h-6" />,
    title: 'Easy to Scale',
    description: 'Grows with your business from startup to enterprise.',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Team Collaboration',
    description: 'Work together seamlessly with real-time updates.',
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: 'Analytics Insights',
    description: 'Data-driven decisions with powerful analytics.',
  },
  {
    icon: <Award className="w-6 h-6" />,
    title: 'Award Winning',
    description: 'Recognized by industry leaders and customers.',
  },
];

const stats = [
  { value: '10K+', label: 'Active Users' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Support' },
  { value: '50+', label: 'Countries' },
];

export default function ScrollRevealDemo() {
  return (
    <div className="min-h-screen bg-theme-bg">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-theme-surface border-b border-theme-border backdrop-blur-sm bg-opacity-90">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/demo/skeleton"
            className="p-2 rounded-lg hover:bg-theme-border/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-theme-text" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-theme-text">Scroll Reveal Animations</h1>
            <p className="text-sm text-theme-muted">
              Scroll down to see animations trigger
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-32">
        {/* Hero Section */}
        <section className="text-center py-20">
          <ScrollReveal direction="up" delay={0.2}>
            <div className="inline-block px-4 py-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mb-6">
              ✨ New Feature Available
            </div>
          </ScrollReveal>
          
          <ScrollReveal direction="up" delay={0.3}>
            <h2 className="text-5xl md:text-6xl font-bold text-theme-text mb-6">
              Build Amazing
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Experiences
              </span>
            </h2>
          </ScrollReveal>
          
          <ScrollReveal direction="up" delay={0.4}>
            <p className="text-xl text-theme-muted max-w-2xl mx-auto mb-8">
              Create stunning applications with smooth animations that delight your users.
            </p>
          </ScrollReveal>
          
          <ScrollReveal direction="up" delay={0.5}>
            <div className="flex gap-4 justify-center">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Get Started
              </button>
              <button className="px-6 py-3 bg-theme-surface text-theme-text rounded-lg hover:bg-theme-border transition-colors border border-theme-border">
                Learn More
              </button>
            </div>
          </ScrollReveal>
        </section>

        {/* Stats Section */}
        <section>
          <ScrollReveal direction="up">
            <h2 className="text-3xl font-bold text-theme-text text-center mb-12">
              Trusted by Thousands
            </h2>
          </ScrollReveal>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <ScrollRevealScale key={index} delay={index * 0.1}>
                <div className="text-center">
                  <div className="text-4xl font-bold text-theme-text mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-theme-muted">{stat.label}</div>
                </div>
              </ScrollRevealScale>
            ))}
          </div>
        </section>

        {/* Features Grid */}
        <section>
          <ScrollReveal direction="up">
            <h2 className="text-3xl font-bold text-theme-text text-center mb-4">
              Powerful Features
            </h2>
          </ScrollReveal>
          
          <ScrollReveal direction="up" delay={0.1}>
            <p className="text-theme-muted text-center mb-12 max-w-2xl mx-auto">
              Everything you need to build and scale your application with confidence.
            </p>
          </ScrollReveal>
          
          <ScrollRevealList
            direction="up"
            staggerDelay={0.1}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-theme-surface rounded-xl border border-theme-border hover:border-blue-500/50 transition-colors"
              >
                <div className="w-12 h-12 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-theme-text mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-theme-muted">
                  {feature.description}
                </p>
              </div>
            ))}
          </ScrollRevealList>
        </section>

        {/* Alternating Content */}
        <section className="space-y-24">
          <ScrollReveal direction="left">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-theme-text mb-4">
                  Beautiful Design
                </h2>
                <p className="text-theme-muted mb-6">
                  Create stunning interfaces that users love. Our design system provides everything you need to build beautiful, accessible applications.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-theme-text">
                    <div className="w-5 h-5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xs">
                      ✓
                    </div>
                    Responsive by default
                  </li>
                  <li className="flex items-center gap-2 text-theme-text">
                    <div className="w-5 h-5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xs">
                      ✓
                    </div>
                    Dark mode support
                  </li>
                  <li className="flex items-center gap-2 text-theme-text">
                    <div className="w-5 h-5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xs">
                      ✓
                    </div>
                    Accessibility first
                  </li>
                </ul>
              </div>
              <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl" />
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="aspect-video bg-gradient-to-br from-green-500 to-teal-600 rounded-xl md:order-first" />
              <div>
                <h2 className="text-3xl font-bold text-theme-text mb-4">
                  Developer Experience
                </h2>
                <p className="text-theme-muted mb-6">
                  Built with developers in mind. Clean APIs, comprehensive documentation, and powerful tools to help you ship faster.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-theme-text">
                    <div className="w-5 h-5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xs">
                      ✓
                    </div>
                    TypeScript support
                  </li>
                  <li className="flex items-center gap-2 text-theme-text">
                    <div className="w-5 h-5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xs">
                      ✓
                    </div>
                    Comprehensive docs
                  </li>
                  <li className="flex items-center gap-2 text-theme-text">
                    <div className="w-5 h-5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-xs">
                      ✓
                    </div>
                    Active community
                  </li>
                </ul>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <ScrollRevealScale>
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
              <h2 className="text-4xl font-bold mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of developers building amazing applications.
              </p>
              <div className="flex gap-4 justify-center">
                <button className="px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                  Start Free Trial
                </button>
                <button className="px-8 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-medium backdrop-blur-sm">
                  View Pricing
                </button>
              </div>
            </div>
          </ScrollRevealScale>
        </section>

        {/* Code Example */}
        <section>
          <ScrollReveal direction="up">
            <h2 className="text-3xl font-bold text-theme-text text-center mb-4">
              Usage Example
            </h2>
          </ScrollReveal>
          
          <ScrollReveal direction="up" delay={0.1}>
            <div className="bg-theme-surface rounded-xl p-6 border border-theme-border">
              <pre className="bg-theme-bg p-4 rounded-lg overflow-x-auto text-sm">
                <code className="text-theme-text">{`import { ScrollReveal, ScrollRevealList } from '@/components/animations/ScrollReveal';

// Basic scroll reveal
<ScrollReveal direction="up" delay={0.2}>
  <h1>Animated Heading</h1>
</ScrollReveal>

// List with stagger
<ScrollRevealList direction="up" staggerDelay={0.1}>
  {items.map(item => (
    <div key={item.id}>{item.content}</div>
  ))}
</ScrollRevealList>

// Scale animation
<ScrollRevealScale delay={0.3}>
  <div>Scales up on scroll</div>
</ScrollRevealScale>`}</code>
              </pre>
            </div>
          </ScrollReveal>
        </section>
      </div>
    </div>
  );
}
